import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Department from '../models/Department';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Project from '../models/Project';
import Tender from '../models/Tender';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import OrganizationRegistration from '../models/OrganizationRegistration';
import SupportTicket from '../models/SupportTicket';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, getActiveProvider } from '../utils/email';

// SUPER_ADMIN — platform-wide stats
export const platformStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalDepts, activeDepts, suspendedDepts, trialDepts,
    totalUsers, activeUsers, totalProjects, activeProjects,
    totalTenders, openTenders,
    totalRevenueAgg, monthlyRevenueAgg,
    pendingRegs, openTickets,
    totalAudit,
  ] = await Promise.all([
    Department.countDocuments(),
    Department.countDocuments({ status: 'ACTIVE' }),
    Department.countDocuments({ status: 'SUSPENDED' }),
    Department.countDocuments({ status: 'TRIAL' }),
    User.countDocuments(),
    User.countDocuments({ active: true }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'IN_PROGRESS' }),
    Tender.countDocuments(),
    Tender.countDocuments({ status: { $in: ['PUBLISHED', 'BIDDING_OPEN'] } }),
    Subscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'PAID', paidDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    OrganizationRegistration.countDocuments({ status: 'PENDING' }),
    SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
    AuditLog.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
  ]);

  // Department types distribution
  const deptByType = await Department.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  // Subscriptions by plan
  const subsByPlan = await Subscription.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$plan', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
  ]);

  // Monthly registrations (last 6 months)
  const monthlyRegs = await OrganizationRegistration.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        count: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  // Top departments by project count
  const topDepts = await Project.aggregate([
    { $group: { _id: '$department', projectCount: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
    { $sort: { totalBudget: -1 } },
    { $limit: 5 },
    {
      $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { projectCount: 1, totalBudget: 1, name: '$dept.name', code: '$dept.code', type: '$dept.type' } },
  ]);

  res.json({
    success: true,
    data: {
      kpi: {
        totalDepts, activeDepts, suspendedDepts, trialDepts,
        totalUsers, activeUsers,
        totalProjects, activeProjects,
        totalTenders, openTenders,
        annualRevenue: totalRevenueAgg[0]?.total || 0,
        monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
        pendingRegistrations: pendingRegs,
        openSupportTickets: openTickets,
        last24hActions: totalAudit,
      },
      deptByType,
      subsByPlan,
      monthlyRegistrations: monthlyRegs,
      topDepartments: topDepts,
    },
  });
});

/**
 * SUPER_ADMIN — Diagnostic info about SMTP/email setup.
 * Returns the current SMTP config (without exposing the password).
 */
export const emailDiagnostics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const provider = getActiveProvider();
  res.json({
    success: true,
    data: {
      activeProvider: provider,
      providerStatus:
        provider === 'resend' ? '✓ Resend (HTTPS API — works on any cloud host)' :
        provider === 'brevo'  ? '✓ Brevo / Sendinblue (HTTPS API — 300/day free, works on any cloud host)' :
        provider === 'smtp'   ? '⚠ SMTP (may fail on Render free tier — port often blocked)' :
        '✗ No provider configured — emails will only log to console',
      // Resend
      resendConfigured: !!process.env.RESEND_API_KEY,
      resendFrom: process.env.RESEND_FROM || 'NOT SET (will use onboarding@resend.dev)',
      // Brevo
      brevoConfigured: !!process.env.BREVO_API_KEY,
      brevoFrom: process.env.BREVO_FROM || process.env.BREVO_FROM_EMAIL || 'NOT SET (must use a verified sender)',
      // SMTP
      smtpConfigured: !!process.env.SMTP_HOST,
      host: process.env.SMTP_HOST || 'NOT SET',
      port: process.env.SMTP_PORT || 'NOT SET',
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || 'NOT SET',
      passSet: !!process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'NOT SET',
      // App
      clientUrl: process.env.CLIENT_URL || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'development',
      recommendations: [
        provider === 'console' ? '⚠ No email provider configured. Use Resend (free 3000/mo) or Brevo (free 300/day) — both work on cloud hosts via HTTPS.' : null,
        provider === 'smtp' && process.env.SMTP_PORT === '587' ? '⚠ Port 587 is blocked on most cloud hosts (Render free, Railway). Either switch to port 465 + SMTP_SECURE=true, OR (better) use Resend/Brevo HTTPS API.' : null,
        provider === 'brevo' && !process.env.BREVO_FROM && !process.env.SMTP_FROM ? '⚠ BREVO_FROM is not set. Brevo requires a verified sender — add a sender at app.brevo.com → Senders & IP → Senders, then set BREVO_FROM in env.' : null,
        !process.env.CLIENT_URL ? '⚠ CLIENT_URL is not set — reset/activation links will point to localhost:5173 (broken for users)' : null,
        process.env.CLIENT_URL?.includes('localhost') ? '⚠ CLIENT_URL contains localhost — reset links will not work for users. Update to your live frontend URL.' : null,
      ].filter(Boolean),
    },
  });
});

/**
 * SUPER_ADMIN — Send a test email and return the actual result (success or detailed error).
 */
export const sendTestEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { to } = req.body;
  if (!to) {
    res.status(400);
    throw new Error('Recipient email is required');
  }

  const result = await sendEmail({
    to,
    subject: '✓ Constructor ERP — SMTP Test',
    html: `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h2 style="color:#0B3D91;">SMTP Test Successful</h2>
        <p>Hi there,</p>
        <p>If you're reading this email, your Constructor ERP SMTP configuration is working correctly. ✓</p>
        <p style="font-size:12px;color:#666;">
          Sent by: ${req.user?.email}<br>
          Server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}<br>
          Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes (SSL)' : 'No (TLS/plain)'}<br>
          Time: ${new Date().toISOString()}
        </p>
      </div>
    `,
  });

  res.json({
    success: result.ok,
    message: result.ok
      ? `Test email sent to ${to} successfully. Check inbox (and spam folder).`
      : `Failed to send test email. See error below.`,
    data: result,
  });
});
