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
    orgName, code, type, state, city, address, contactEmail, contactPhone,
    headOfDepartment, website,
    adminName, adminEmail, adminPhone, adminDesignation,
    requestedModules, expectedUsers, expectedProjects, preferredPlan, notes,
  } = req.body;

  // Basic validation
  if (!orgName || !code || !contactEmail || !adminName || !adminEmail) {
    res.status(400);
    throw new Error('Required fields missing');
  }

  // Check if a registration with this admin email or org code already exists
  const dup = await OrganizationRegistration.findOne({
    $or: [{ adminEmail }, { code: code.toUpperCase() }],
    status: { $in: ['PENDING', 'APPROVED'] },
  });
  if (dup) {
    res.status(400);
    throw new Error('A registration with this email or department code already exists');
  }
  if (await Department.findOne({ code: code.toUpperCase() })) {
    res.status(400);
    throw new Error('Department code is already taken');
  }
  if (await User.findOne({ email: adminEmail.toLowerCase() })) {
    res.status(400);
    throw new Error('Admin email is already in use');
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
  await sendEmail({
    to: reg.adminEmail,
    subject: '✓ Your Organization is Approved — Set Password',
    html: approvalEmail(reg.orgName, reg.adminName, dept.code, setPasswordLink, plan),
  });

  res.json({
    success: true,
    message: 'Registration approved. Department, Subscription, and Admin account created. Email sent.',
    data: { registration: reg, department: dept, subscription: sub, admin: { _id: admin._id, email: admin.email } },
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
