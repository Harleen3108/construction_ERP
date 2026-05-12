import { Request, Response } from 'express';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler';
import OrganizationRegistration from '../models/OrganizationRegistration';
import Department from '../models/Department';
import Subscription from '../models/Subscription';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import {
  registrationConfirmationEmail,
  approvalEmail,
  rejectionEmail,
} from '../utils/emailTemplates';

// PUBLIC — Anyone can submit a registration request
export const applyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const {
    orgName, type, state, city, address, contactEmail, contactPhone,
    headOfDepartment, website,
    adminName, adminPhone, adminDesignation,
    requestedModules, expectedUsers, expectedProjects, preferredPlan, notes,
  } = req.body;

  // Normalize email + code (most duplicate "errors" come from case mismatches)
  const adminEmail = String(req.body.adminEmail || '').toLowerCase().trim();
  const code = String(req.body.code || '').toUpperCase().trim();

  // Basic validation
  if (!orgName || !code || !contactEmail || !adminName || !adminEmail) {
    res.status(400);
    throw new Error('Required fields missing');
  }

  // ── Smart duplicate checks ──
  // An APPROVED registration is only a real conflict if its linked Department still exists.
  // Otherwise it's an orphan (admin deleted the dept) — auto-clean it up so the user can re-register.

  const isRegStillLive = async (reg: any): Promise<boolean> => {
    if (reg.status === 'PENDING') return true;       // still in queue, real conflict
    if (reg.status !== 'APPROVED') return false;
    if (!reg.department) return false;
    const dept = await Department.findById(reg.department);
    return !!dept;                                    // alive only if dept still exists
  };

  // Auto-cleanup helper for orphaned approved registrations
  const cleanupOrphan = async (reg: any) => {
    console.log(`[Registration] Auto-cleanup orphan registration ${reg._id} (admin's dept was deleted)`);
    // Remove the orphaned registration, subscription, and admin user
    if (reg.deptAdmin) await User.deleteOne({ _id: reg.deptAdmin });
    if (reg.subscription) {
      const Subscription = (await import('../models/Subscription')).default;
      await Subscription.deleteOne({ _id: reg.subscription });
    }
    await OrganizationRegistration.deleteOne({ _id: reg._id });
  };

  // 1) Same admin email
  const emailRegDup = await OrganizationRegistration.findOne({
    adminEmail, status: { $in: ['PENDING', 'APPROVED'] },
  });
  if (emailRegDup) {
    if (await isRegStillLive(emailRegDup)) {
      res.status(400);
      throw new Error(
        `A registration with email "${adminEmail}" is already ${emailRegDup.status === 'PENDING' ? 'pending review' : 'approved'}. Please use a different admin email.`
      );
    }
    await cleanupOrphan(emailRegDup);
  }

  // 2) Same department code
  const codeRegDup = await OrganizationRegistration.findOne({
    code, status: { $in: ['PENDING', 'APPROVED'] },
  });
  if (codeRegDup) {
    if (await isRegStillLive(codeRegDup)) {
      res.status(400);
      throw new Error(
        `Department code "${code}" is already taken by another registration. Please choose a different code (e.g., ${code}-2).`
      );
    }
    await cleanupOrphan(codeRegDup);
  }

  // 3) Department already onboarded with this code?
  if (await Department.findOne({ code })) {
    res.status(400);
    throw new Error(
      `Department code "${code}" is already in use by an active department. Please choose a different code.`
    );
  }

  // 4) Admin email exists as a user?
  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser) {
    // If it's a DEPT_ADMIN whose department was deleted, it's an orphan — clean up
    if (existingUser.role === 'DEPT_ADMIN' && existingUser.department) {
      const dept = await Department.findById(existingUser.department);
      if (!dept) {
        console.log(`[Registration] Auto-cleanup orphan DEPT_ADMIN ${existingUser.email}`);
        await User.deleteOne({ _id: existingUser._id });
      } else {
        res.status(400);
        throw new Error(`An account with email "${adminEmail}" already exists. Please use a different email or log in instead.`);
      }
    } else {
      res.status(400);
      throw new Error(`An account with email "${adminEmail}" already exists. Please use a different email or log in instead.`);
    }
  }

  const reg = await OrganizationRegistration.create({
    orgName, code, type, state, city, address, contactEmail, contactPhone,
    headOfDepartment, website,
    adminName, adminEmail, adminPhone, adminDesignation,
    requestedModules, expectedUsers, expectedProjects, preferredPlan, notes,
    status: 'PENDING',
  });

  // Confirmation email to applicant
  await sendEmail({
    to: adminEmail,
    subject: 'Registration Received — Constructor ERP',
    html: registrationConfirmationEmail(orgName, adminName),
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. You will receive an email once your organization is reviewed.',
    data: { registrationId: reg._id, status: reg.status },
  });
});

// SUPER_ADMIN — list registrations
export const listRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const q: any = {};
  if (status) q.status = status;
  const items = await OrganizationRegistration.find(q)
    .populate('reviewedBy', 'name')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });

  const counts = {
    pending: await OrganizationRegistration.countDocuments({ status: 'PENDING' }),
    approved: await OrganizationRegistration.countDocuments({ status: 'APPROVED' }),
    rejected: await OrganizationRegistration.countDocuments({ status: 'REJECTED' }),
    total: await OrganizationRegistration.countDocuments(),
  };
  res.json({ success: true, count: items.length, counts, data: items });
});

// SUPER_ADMIN — single registration detail
export const getRegistration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reg = await OrganizationRegistration.findById(req.params.id)
    .populate('reviewedBy', 'name email')
    .populate('department')
    .populate('subscription')
    .populate('deptAdmin', 'name email');
  if (!reg) { res.status(404); throw new Error('Registration not found'); }
  res.json({ success: true, data: reg });
});

// SUPER_ADMIN — APPROVE: creates Department + Subscription + DEPT_ADMIN user, sends email
export const approveRegistration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plan = 'TRIAL', billingCycle = 'YEARLY', amount = 0, modules, maxUsers, maxProjects, validityDays = 365 } = req.body;
  const reg = await OrganizationRegistration.findById(req.params.id);
  if (!reg) { res.status(404); throw new Error('Registration not found'); }
  if (reg.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Registration is already ${reg.status}`);
  }

  const enabledModules = modules || reg.requestedModules || ['etender','erp','finance','mb','reports'];

  // 1. Create department
  const dept = await Department.create({
    name: reg.orgName,
    code: reg.code,
    type: reg.type,
    state: reg.state,
    city: reg.city,
    address: reg.address,
    contactEmail: reg.contactEmail,
    contactPhone: reg.contactPhone,
    headOfDepartment: reg.headOfDepartment,
    enabledModules,
    status: 'ACTIVE',
    createdBy: req.user!._id,
  });

  // 2. Create subscription
  const sub = await Subscription.create({
    department: dept._id,
    plan,
    status: 'ACTIVE',
    billingCycle,
    amount,
    modules: enabledModules,
    maxUsers,
    maxProjects,
    startDate: new Date(),
    endDate: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
  });

  // 3. Create DEPT_ADMIN user with password set token
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const setToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(setToken).digest('hex');

  const admin = await User.create({
    name: reg.adminName,
    email: reg.adminEmail,
    password: tempPassword,
    role: 'DEPT_ADMIN',
    department: dept._id,
    phone: reg.adminPhone,
    designation: reg.adminDesignation || 'Department Administrator',
    mustSetPassword: true,
    passwordSetToken: tokenHash,
    passwordSetExpires: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hrs
    active: true,
  });

  // 4. Update registration
  reg.status = 'APPROVED';
  reg.reviewedBy = req.user!._id;
  reg.reviewedAt = new Date();
  reg.department = dept._id;
  reg.subscription = sub._id;
  reg.deptAdmin = admin._id;
  reg.approvalEmailSent = true;
  await reg.save();

  // 5. Send approval email with set-password link
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const setPasswordLink = `${clientUrl}/set-password/${setToken}`;
  const emailResult = await sendEmail({
    to: reg.adminEmail,
    subject: '✓ Your Organization is Approved — Set Password',
    html: approvalEmail(reg.orgName, reg.adminName, dept.code, setPasswordLink, plan),
  });

  res.json({
    success: true,
    message: emailResult.ok
      ? 'Registration approved · Email sent to the admin'
      : 'Registration approved · Email failed to send — use the link below to manually activate the admin',
    data: {
      registration: reg,
      department: dept,
      subscription: sub,
      admin: { _id: admin._id, email: admin.email },
      activationLink: setPasswordLink, // ALWAYS returned so Super Admin can manually share if email fails
      emailSent: emailResult.ok,
      emailError: emailResult.error,
    },
  });
});

// SUPER_ADMIN — Generate a fresh activation link for an already-approved registration (in case email failed)
export const resendActivation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reg = await OrganizationRegistration.findById(req.params.id).populate('deptAdmin');
  if (!reg || reg.status !== 'APPROVED' || !reg.deptAdmin) {
    res.status(400);
    throw new Error('Registration is not in an approved state');
  }
  const admin = await User.findById(reg.deptAdmin).select('+passwordSetToken +passwordSetExpires');
  if (!admin) { res.status(404); throw new Error('Admin user not found'); }
  if (!admin.mustSetPassword) {
    res.status(400);
    throw new Error('User has already set their password');
  }

  // Generate a fresh token
  const setToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(setToken).digest('hex');
  admin.passwordSetToken = tokenHash;
  admin.passwordSetExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await admin.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const setPasswordLink = `${clientUrl}/set-password/${setToken}`;

  const emailResult = await sendEmail({
    to: admin.email,
    subject: 'Activate Your Account — Constructor ERP',
    html: approvalEmail(reg.orgName, reg.adminName, (await Department.findById(reg.department))?.code || '', setPasswordLink, 'PROFESSIONAL'),
  });

  res.json({
    success: true,
    message: emailResult.ok ? 'Activation email resent' : 'Email failed — use the link below to share manually',
    data: { activationLink: setPasswordLink, emailSent: emailResult.ok, emailError: emailResult.error },
  });
});

// SUPER_ADMIN — REJECT
export const rejectRegistration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const reg = await OrganizationRegistration.findById(req.params.id);
  if (!reg) { res.status(404); throw new Error('Registration not found'); }
  if (reg.status !== 'PENDING') {
    res.status(400);
    throw new Error(`Registration is already ${reg.status}`);
  }

  reg.status = 'REJECTED';
  reg.reviewedBy = req.user!._id;
  reg.reviewedAt = new Date();
  reg.rejectionReason = reason;
  await reg.save();

  await sendEmail({
    to: reg.adminEmail,
    subject: 'Registration Update — Constructor ERP',
    html: rejectionEmail(reg.orgName, reg.adminName, reason),
  });

  res.json({ success: true, data: reg });
});
