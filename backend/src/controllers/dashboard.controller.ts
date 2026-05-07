import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Approval from '../models/Approval';
import MeasurementBook from '../models/MeasurementBook';
import MaterialRequest from '../models/MaterialRequest';
import { AuthRequest } from '../middleware/auth';

// Returns dashboard data based on user role
export const myDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const userId = req.user!._id;

  if (role === 'CE') {
    const totalProjects = await Project.countDocuments();
    const inProgress = await Project.countDocuments({ status: 'IN_PROGRESS' });
    const delayed = await Project.find({
      status: 'IN_PROGRESS',
      endDate: { $lt: new Date() },
    }).countDocuments();
    const totalBudgetAgg = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$estimatedCost' } } },
    ]);
    const utilizedAgg = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$finalCost' } } },
    ]);
    const totalBudget = totalBudgetAgg[0]?.total || 0;
    const utilized = utilizedAgg[0]?.total || 0;
    return res.json({
      success: true,
      data: {
        totalProjects, inProgress, delayed,
        totalBudget,
        utilizationPercent: totalBudget ? Math.round((utilized / totalBudget) * 100) : 0,
      },
    });
  }

  if (role === 'EE') {
    const myProjects = await Project.find({})
      .select('name overallProgress status location estimatedCost')
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json({ success: true, data: { myProjects } });
  }

  if (role === 'SDO') {
    const pendingMB = await Approval.countDocuments({ stage: 'SDO', status: 'PENDING', entityType: 'MB' });
    const pendingBills = await Approval.countDocuments({ stage: 'SDO', status: 'PENDING', entityType: 'BILL' });
    const pendingMatReq = await MaterialRequest.countDocuments({ status: 'PENDING' });
    const activeProjects = await Project.countDocuments({ status: 'IN_PROGRESS' });
    return res.json({
      success: true,
      data: { pendingMB, pendingBills, pendingMatReq, activeProjects },
    });
  }

  if (role === 'CONTRACTOR') {
    const activeProjects = await Project.find({ awardedTo: userId, status: 'IN_PROGRESS' })
      .select('name overallProgress estimatedCost endDate');
    const pendingBills = await Bill.find({
      contractor: userId,
      status: { $in: ['SUBMITTED', 'JE_VERIFIED', 'SDO_APPROVED', 'EE_APPROVED', 'ACCOUNTS_VERIFIED', 'TREASURY_PENDING'] },
    });
    const paidBills = await Bill.find({ contractor: userId, status: 'PAID' });
    const pending = pendingBills.reduce((s, b) => s + b.netPayable, 0);
    const received = paidBills.reduce((s, b) => s + b.netPayable, 0);
    return res.json({
      success: true,
      data: {
        activeProjects,
        pendingAmount: pending,
        receivedAmount: received,
        pendingCount: pendingBills.length,
        paidCount: paidBills.length,
      },
    });
  }

  if (role === 'ACCOUNTANT' || role === 'TREASURY') {
    const pendingBillsAgg = await Bill.aggregate([
      { $match: { status: { $in: ['SUBMITTED', 'JE_VERIFIED', 'SDO_APPROVED', 'EE_APPROVED'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]);
    const approvedAgg = await Bill.aggregate([
      { $match: { status: { $in: ['ACCOUNTS_VERIFIED', 'TREASURY_PENDING'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]);
    const releasedAgg = await Payment.aggregate([
      { $match: { status: 'RELEASED' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const deductionsAgg = await Bill.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalDeductions' } } },
    ]);
    return res.json({
      success: true,
      data: {
        pendingBills: pendingBillsAgg[0]?.total || 0,
        billsApproved: approvedAgg[0]?.total || 0,
        paymentsReleased: releasedAgg[0]?.total || 0,
        totalDeductions: deductionsAgg[0]?.total || 0,
      },
    });
  }

  if (role === 'JE') {
    const myProjects = await Project.find({ proposedBy: userId })
      .select('name status overallProgress estimatedCost')
      .sort({ createdAt: -1 });
    const myMBs = await MeasurementBook.countDocuments({ recordedBy: userId });
    return res.json({ success: true, data: { myProjects, myMBs } });
  }

  if (role === 'ADMIN') {
    const [
      totalProjects, totalUsers, totalTenders, totalContractors,
      activeProjects, completedProjects, delayedProjects,
      pendingApprovalsCount, billsPaidCount, totalPaymentsAgg, totalBudgetAgg, utilizedAgg,
      statusDistribution, typeDistribution, fundingDistribution,
      monthlyProjects, monthlyPayments, approvalsByStage, recentAudits, topContractors,
    ] = await Promise.all([
      Project.countDocuments(),
      (await import('../models/User')).default.countDocuments(),
      (await import('../models/Tender')).default.countDocuments(),
      (await import('../models/User')).default.countDocuments({ role: 'CONTRACTOR' }),
      Project.countDocuments({ status: 'IN_PROGRESS' }),
      Project.countDocuments({ status: 'COMPLETED' }),
      Project.countDocuments({ status: 'IN_PROGRESS', endDate: { $lt: new Date() } }),
      Approval.countDocuments({ status: 'PENDING' }),
      (await import('../models/Bill')).default.countDocuments({ status: 'PAID' }),
      (await import('../models/Payment')).default.aggregate([
        { $match: { status: 'RELEASED' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Project.aggregate([{ $group: { _id: null, total: { $sum: '$estimatedCost' } } }]),
      Project.aggregate([
        { $match: { finalCost: { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: '$finalCost' } } },
      ]),
      // Status distribution
      Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
      ]),
      Project.aggregate([
        { $group: { _id: '$projectType', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
        { $sort: { count: -1 } },
      ]),
      Project.aggregate([
        { $group: { _id: '$fundingSource', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
      ]),
      // Monthly project creation (last 6 months)
      Project.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
            budget: { $sum: '$estimatedCost' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      // Monthly payments (last 6 months)
      (await import('../models/Payment')).default.aggregate([
        { $match: { paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }, status: 'RELEASED' } },
        {
          $group: {
            _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      // Pending approvals by stage
      Approval.aggregate([
        { $match: { status: 'PENDING' } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      // Recent audit logs
      (await import('../models/AuditLog')).default.find().sort({ timestamp: -1 }).limit(10).lean(),
      // Top contractors by awards
      Project.aggregate([
        { $match: { awardedTo: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$awardedTo',
            count: { $sum: 1 },
            totalAwarded: { $sum: '$awardedAmount' },
          },
        },
        { $sort: { totalAwarded: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users', localField: '_id', foreignField: '_id', as: 'contractor',
          },
        },
        { $unwind: { path: '$contractor', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            count: 1,
            totalAwarded: 1,
            name: '$contractor.companyName',
            email: '$contractor.email',
          },
        },
      ]),
    ]);

    const totalBudget = totalBudgetAgg[0]?.total || 0;
    const utilized = utilizedAgg[0]?.total || 0;
    const totalPayments = totalPaymentsAgg[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        kpi: {
          totalProjects, totalUsers, totalTenders, totalContractors,
          activeProjects, completedProjects, delayedProjects,
          pendingApprovalsCount, billsPaidCount,
          totalPayments, totalBudget,
          utilizationPercent: totalBudget ? Math.round((utilized / totalBudget) * 100) : 0,
        },
        statusDistribution,
        typeDistribution,
        fundingDistribution,
        monthlyProjects,
        monthlyPayments,
        approvalsByStage,
        recentAudits,
        topContractors,
      },
    });
  }

  res.json({ success: true, data: {} });
});
