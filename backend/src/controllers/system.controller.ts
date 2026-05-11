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
