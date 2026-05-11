import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler';
import User, { UserRole } from '../models/User';
import Department from '../models/Department';
import generateToken from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { passwordResetEmail } from '../utils/emailTemplates';

// @route POST /api/auth/register
// Used for direct contractor self-registration (legacy). Org-level registration goes through /api/registrations/apply
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name, email, password, role, phone, designation, department,
    employeeId, companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  } = req.body;

  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const user = await User.create({
    name, email, password, role: (role || 'CONTRACTOR') as UserRole, phone, designation,
    department, employeeId, companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id.toString()),
    },
  });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // First fetch raw user without populate to handle stale string-department gracefully
  const userRaw = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!userRaw || !(await userRaw.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  // Populate department safely — only if it's an ObjectId
  let user: any = userRaw;
  if (userRaw.department && mongoose.Types.ObjectId.isValid(userRaw.department as any)) {
    try {
      user = await User.findById(userRaw._id)
        .select('+password')
        .populate('department', 'name code status enabledModules');
    } catch {
      user = userRaw; // populate failed — fall back to raw
    }
  }
  if (!user.active) {
    res.status(403);
    throw new Error('Account is disabled');
  }
  if (user.mustSetPassword) {
    res.status(403);
    throw new Error('You must set your password using the link sent to your email before logging in');
  }
  // Block login if department is suspended/expired
  if (user.role !== 'SUPER_ADMIN' && user.department) {
    const dept: any = user.department;
    if (dept?.status === 'SUSPENDED' || dept?.status === 'EXPIRED') {
      res.status(403);
      throw new Error(`Your department workspace is ${dept.status}. Contact platform admin.`);
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      companyName: user.companyName,
      avatar: user.avatar,
      permissions: user.permissions,
      token: generateToken(user._id.toString()),
    },
  });
});

// @route GET /api/auth/me
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  let user: any = await User.findById(req.user!._id);
  if (user?.department && mongoose.Types.ObjectId.isValid(user.department)) {
    try {
      user = await User.findById(req.user!._id).populate('department', 'name code status enabledModules');
    } catch { /* fall back to raw */ }
  }
  res.json({ success: true, data: user });
});

// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fields = ['name', 'phone', 'designation', 'companyName', 'avatar'];
  const update: any = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });
  const user = await User.findByIdAndUpdate(req.user!._id, update, { new: true });
  res.json({ success: true, data: user });
});

/* ============================================================
 * Set-password (after Super Admin approves a new department)
 * The DEPT_ADMIN user gets an email with a one-time link.
 * ============================================================ */

// @route GET /api/auth/verify-token/:token
// Verifies whether a set-password / reset token is still valid.
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    $or: [
      { passwordSetToken: tokenHash, passwordSetExpires: { $gt: new Date() } },
      { passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } },
    ],
  }).select('+passwordSetToken +passwordResetToken +passwordSetExpires +passwordResetExpires');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired link' });
  }
  res.json({
    success: true,
    data: { name: user.name, email: user.email, role: user.role },
  });
});

// @route POST /api/auth/set-password
// Body: { token, password }
export const setPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error('Token and password are required');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    $or: [
      { passwordSetToken: tokenHash, passwordSetExpires: { $gt: new Date() } },
      { passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } },
    ],
  }).select('+passwordSetToken +passwordResetToken +passwordSetExpires +passwordResetExpires +password');

  if (!user) {
    console.log('[SetPassword] Invalid or expired token attempted');
    res.status(400);
    throw new Error('Invalid or expired reset link. Please request a new one.');
  }

  console.log(`[SetPassword] Resetting password for ${user.email}`);

  // Set new password — pre-save hook will bcrypt-hash it (isModified('password') = true)
  user.password = password;
  user.mustSetPassword = false;
  // Clear tokens so they can't be reused
  user.passwordSetToken = undefined;
  user.passwordSetExpires = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  console.log(`[SetPassword] ✓ Password updated successfully for ${user.email}`);

  res.json({
    success: true,
    message: 'Password updated successfully. You can now log in with your new password.',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    },
  });
});

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalized = String(email).toLowerCase().trim();
  console.log(`[ForgotPassword] Request for: ${normalized}`);

  const user = await User.findOne({ email: normalized });

  // Always respond success to avoid email enumeration
  if (!user) {
    console.log(`[ForgotPassword] No user found for ${normalized} — returning generic success`);
    return res.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
    });
  }
  if (!user.active) {
    console.log(`[ForgotPassword] User ${normalized} is disabled — refusing reset`);
    return res.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
    });
  }

  // Generate raw token (sent in email) and store its hash (in DB)
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Use findByIdAndUpdate to bypass pre-save hooks and avoid validation issues
  await User.findByIdAndUpdate(user._id, {
    $set: {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    },
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${token}`;
  console.log(`[ForgotPassword] Generated reset link for ${user.email} (expires ${expires.toISOString()})`);

  const sent = await sendEmail({
    to: user.email,
    subject: 'Reset Your Password — Constructor ERP',
    html: passwordResetEmail(user.name, resetLink),
  });

  if (!sent) {
    console.error(`[ForgotPassword] Email failed to send to ${user.email}`);
  }

  res.json({
    success: true,
    message: 'If an account with this email exists, a reset link has been sent. Check your inbox (and spam folder).',
  });
});
