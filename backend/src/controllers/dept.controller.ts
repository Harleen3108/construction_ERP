import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Tender from '../models/Tender';
import User from '../models/User';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Approval from '../models/Approval';
import AuditLog from '../models/AuditLog';
import Division from '../models/Division';
import { AuthRequest } from '../middleware/auth';

/**
 * Comprehensive Department Admin stats — projects, finance, users, pipeline.
 */
export const deptStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) {
    return res.json({ success: true, data: {} });
  }
  const department = req.user!.department;

  const [
    totalProjects, activeProjects, completedProjects, delayedProjects,
    totalTenders, openTenders, awardedTenders,
    totalUsers, activeUsers, contractors, verifiedContractors,
    pendingApprovals, totalDivisions,
    budgetAgg, paidAgg, pendingBillsAgg,
    statusDistribution, typeDistribution,
    monthlyProjects, monthlyPayments,
    usersByRole,
  ] = await Promise.all([
    Project.countDocuments({ department }),
    Project.countDocuments({ department, status: 'IN_PROGRESS' }),
    Project.countDocuments({ department, status: 'COMPLETED' }),
    Project.countDocuments({ department, status: 'IN_PROGRESS', endDate: { $lt: new Date() } }),
    Tender.countDocuments({ department }),
    Tender.countDocuments({ department, status: { $in: ['PUBLISHED', 'BIDDING_OPEN'] } }),
    Tender.countDocuments({ department, status: 'AWARDED' }),
    User.countDocuments({ department }),
    User.countDocuments({ department, active: true }),
    User.countDocuments({ role: 'CONTRACTOR' }), // contractors are cross-dept
    User.countDocuments({ role: 'CONTRACTOR', contractorVerified: true }),
    Approval.countDocuments({ department, status: 'PENDING' }),
    Division.countDocuments({ department }),
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: null, total: { $sum: '$estimatedCost' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Bill.aggregate([
      { $match: { department, status: { $in: ['SUBMITTED','JE_VERIFIED','SDO_APPROVED','EE_APPROVED','ACCOUNTS_VERIFIED','TREASURY_PENDING'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
    ]),
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: '$projectType', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
      { $sort: { count: -1 } },
    ]),
    Project.aggregate([
      { $match: { department, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
          budget: { $sum: '$estimatedCost' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED', paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    User.aggregate([
      { $match: { department } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ]);

  const totalBudget = budgetAgg[0]?.total || 0;
  const totalPaid = paidAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      kpi: {
        totalProjects, activeProjects, completedProjects, delayedProjects,
        totalTenders, openTenders, awardedTenders,
        totalUsers, activeUsers,
        contractors, verifiedContractors,
        pendingApprovals,
        totalDivisions,
        totalBudget,
        totalPaid,
        utilizationPercent: totalBudget ? Math.round((totalPaid / totalBudget) * 100) : 0,
        pendingPayout: pendingBillsAgg[0]?.total || 0,
        pendingBillsCount: pendingBillsAgg[0]?.count || 0,
      },
      statusDistribution,
      typeDistribution,
      monthlyProjects,
      monthlyPayments,
      usersByRole,
    },
  });
});

/**
 * Recent activity feed scoped to department (last 20 audit log entries)
 */
export const recentActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.department;
  const q: any = department ? { department } : {};
  const items = await AuditLog.find(q).sort({ timestamp: -1 }).limit(20).lean();
  res.json({ success: true, count: items.length, data: items });
});
