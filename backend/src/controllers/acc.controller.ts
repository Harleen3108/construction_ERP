import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Approval from '../models/Approval';
import User from '../models/User';
import MeasurementBook from '../models/MeasurementBook';
import { AuthRequest } from '../middleware/auth';

/**
 * Accountant comprehensive finance dashboard.
 */
export const accDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) return res.json({ success: true, data: {} });
  const department = req.user!.department;
  const monthStart = new Date(new Date().setDate(1));
  monthStart.setHours(0, 0, 0, 0);

  const [
    // Approvals at ACCOUNTANT stage
    pendingApprovalsCount,
    // Bills by status
    billsPendingMyApproval, billsTreasuryPending, billsPaid,
    // Pipeline aggregates
    pendingAmountAgg, paidAmountAgg, thisMonthPaidAgg,
    // Deductions ever collected
    totalDeductionsAgg,
    // This month's stats
    thisMonthDeductionsAgg, thisMonthBillsCount,
    // Trend data
    monthlyPayments, monthlyDeductions, deductionsByType,
    // Recent activity
    recentBills, recentPayments,
    // Top contractors by paid amount
    topContractorsByPaid,
  ] = await Promise.all([
    Approval.countDocuments({ department, stage: 'ACCOUNTANT', status: 'PENDING' }),
    Bill.countDocuments({ department, status: 'EE_APPROVED' }), // ready for Accountant
    Bill.countDocuments({ department, status: { $in: ['ACCOUNTS_VERIFIED', 'TREASURY_PENDING'] } }),
    Bill.countDocuments({ department, status: 'PAID' }),

    Bill.aggregate([
      { $match: { department, status: { $in: ['SUBMITTED','JE_VERIFIED','SDO_APPROVED','EE_APPROVED','ACCOUNTS_VERIFIED','TREASURY_PENDING'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED', paymentDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    Bill.aggregate([
      { $match: { department, status: 'PAID' } },
      {
        $group: {
          _id: null,
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          security: { $sum: '$securityAmount' },
          retention: { $sum: '$retentionAmount' },
          other: { $sum: '$otherDeductions' },
          total: { $sum: '$totalDeductions' },
        },
      },
    ]),

    Bill.aggregate([
      { $match: { department, status: 'PAID', updatedAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          total: { $sum: '$totalDeductions' },
        },
      },
    ]),
    Bill.countDocuments({ department, status: 'PAID', updatedAt: { $gte: monthStart } }),

    Payment.aggregate([
      { $match: { department, status: 'RELEASED', paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
          amount: { $sum: '$amount' }, count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Bill.aggregate([
      { $match: { department, status: 'PAID', updatedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          security: { $sum: '$securityAmount' },
          total: { $sum: '$totalDeductions' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Bill.aggregate([
      { $match: { department, status: 'PAID' } },
      {
        $group: {
          _id: null,
          GST: { $sum: '$gstAmount' },
          TDS: { $sum: '$tdsAmount' },
          Security: { $sum: '$securityAmount' },
          Retention: { $sum: '$retentionAmount' },
          Other: { $sum: '$otherDeductions' },
        },
      },
    ]),

    Bill.find({ department }).sort({ createdAt: -1 }).limit(5)
      .populate('project', 'name').populate('contractor', 'name companyName').lean(),
    Payment.find({ department }).sort({ paymentDate: -1 }).limit(5)
      .populate('bill', 'billNumber').populate('contractor', 'name companyName').lean(),

    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
      {
        $group: {
          _id: '$contractor',
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'contractor' } },
      { $unwind: { path: '$contractor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalPaid: 1, paymentCount: 1,
          name: '$contractor.companyName', email: '$contractor.email',
        },
      },
    ]),
  ]);

  const ded = totalDeductionsAgg[0] || { gst: 0, tds: 0, security: 0, retention: 0, other: 0, total: 0 };
  const thisMonthDed = thisMonthDeductionsAgg[0] || { gst: 0, tds: 0, total: 0 };

  res.json({
    success: true,
    data: {
      kpi: {
        pendingApprovalsCount,
        billsPendingMyApproval, billsTreasuryPending, billsPaid,
        pendingPayout: pendingAmountAgg[0]?.total || 0,
        totalPaid: paidAmountAgg[0]?.total || 0,
        thisMonthPaid: thisMonthPaidAgg[0]?.total || 0,
        totalDeductions: ded.total,
        thisMonthDeductions: thisMonthDed.total,
        thisMonthBillsPaid: thisMonthBillsCount,
        thisMonthGST: thisMonthDed.gst,
        thisMonthTDS: thisMonthDed.tds,
      },
      deductions: ded,
      monthlyPayments,
      monthlyDeductions,
      deductionsByType: deductionsByType[0] || {},
      recentBills,
      recentPayments,
      topContractorsByPaid,
    },
  });
});

/**
 * Bills awaiting Accountant verification (after EE approval).
 */
export const billVerificationQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;

  const bills = await Bill.find({
    department,
    status: { $in: ['EE_APPROVED', 'ACCOUNTS_VERIFIED'] },
  })
    .populate('project', 'name location')
    .populate('contractor', 'name companyName gstNumber panNumber')
    .populate('workOrder', 'workOrderId loaId')
    .sort({ submittedAt: -1 })
    .lean();

  // Compute days-since-submission for SLA tracking
  const annotated = bills.map((b) => ({
    ...b,
    daysSinceSubmit: b.submittedAt
      ? Math.floor((Date.now() - new Date(b.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  res.json({ success: true, count: annotated.length, data: annotated });
});

/**
 * Deductions Report — month-over-month + per-tax breakdown.
 */
export const deductionsReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const { fromDate, toDate } = req.query;

  const matchStage: any = { department, status: 'PAID' };
  if (fromDate || toDate) {
    matchStage.updatedAt = {};
    if (fromDate) matchStage.updatedAt.$gte = new Date(fromDate as string);
    if (toDate) matchStage.updatedAt.$lte = new Date(toDate as string);
  }

  const [totals, byMonth, byContractor] = await Promise.all([
    Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          security: { $sum: '$securityAmount' },
          retention: { $sum: '$retentionAmount' },
          other: { $sum: '$otherDeductions' },
          total: { $sum: '$totalDeductions' },
          billCount: { $sum: 1 },
        },
      },
    ]),
    Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          security: { $sum: '$securityAmount' },
          retention: { $sum: '$retentionAmount' },
          total: { $sum: '$totalDeductions' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$contractor',
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          total: { $sum: '$totalDeductions' },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'contractor' } },
      { $unwind: { path: '$contractor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          gst: 1, tds: 1, total: 1, billCount: 1,
          name: '$contractor.companyName', gstNumber: '$contractor.gstNumber', panNumber: '$contractor.panNumber',
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totals: totals[0] || { gst: 0, tds: 0, security: 0, retention: 0, other: 0, total: 0, billCount: 0 },
      byMonth,
      byContractor,
    },
  });
});

/**
 * Budget Monitoring — project-wise allocated vs utilized.
 */
export const budgetMonitoring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const projects = await Project.find({ department, status: { $ne: 'REJECTED' } })
    .populate('awardedTo', 'name companyName')
    .sort({ estimatedCost: -1 })
    .lean();

  const annotated = await Promise.all(
    projects.map(async (p) => {
      const [paidAgg, pendingAgg] = await Promise.all([
        Bill.aggregate([
          { $match: { project: p._id, status: 'PAID' } },
          { $group: { _id: null, total: { $sum: '$netPayable' } } },
        ]),
        Bill.aggregate([
          { $match: { project: p._id, status: { $nin: ['PAID', 'REJECTED'] } } },
          { $group: { _id: null, total: { $sum: '$netPayable' } } },
        ]),
      ]);
      const paid = paidAgg[0]?.total || 0;
      const pending = pendingAgg[0]?.total || 0;
      const utilizationPercent = p.estimatedCost ? Math.round(((paid + pending) / p.estimatedCost) * 100) : 0;
      return {
        ...p,
        finance: {
          paid, pending,
          remaining: Math.max(0, p.estimatedCost - paid - pending),
          utilizationPercent,
          isOverBudget: paid + pending > p.estimatedCost,
        },
      };
    })
  );

  const summary = {
    totalBudget: projects.reduce((s, p) => s + (p.estimatedCost || 0), 0),
    totalAwarded: projects.reduce((s, p) => s + (p.awardedAmount || 0), 0),
    totalPaid: annotated.reduce((s, p) => s + (p.finance.paid || 0), 0),
    totalPending: annotated.reduce((s, p) => s + (p.finance.pending || 0), 0),
    overBudgetCount: annotated.filter((p) => p.finance.isOverBudget).length,
  };

  res.json({ success: true, count: annotated.length, summary, data: annotated });
});

/**
 * Contractor Payment History — per-contractor payment tracking.
 */
export const contractorPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const contractors = await User.find({ role: 'CONTRACTOR' }).select('name companyName gstNumber panNumber email').lean();

  const annotated = await Promise.all(
    contractors.map(async (c) => {
      const [paid, pending, lastPayment, projectCount] = await Promise.all([
        Bill.aggregate([
          { $match: { department, contractor: c._id, status: 'PAID' } },
          { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
        ]),
        Bill.aggregate([
          { $match: { department, contractor: c._id, status: { $nin: ['PAID', 'REJECTED'] } } },
          { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
        ]),
        Payment.findOne({ department, contractor: c._id, status: 'RELEASED' })
          .sort({ paymentDate: -1 })
          .lean(),
        Project.countDocuments({ department, awardedTo: c._id }),
      ]);
      return {
        ...c,
        projectCount,
        paid: paid[0]?.total || 0,
        paidCount: paid[0]?.count || 0,
        pending: pending[0]?.total || 0,
        pendingCount: pending[0]?.count || 0,
        lastPayment,
      };
    })
  );

  // Only include contractors with any activity
  const active = annotated.filter((c) => c.paid > 0 || c.pending > 0 || c.projectCount > 0);
  active.sort((a, b) => b.paid - a.paid);

  res.json({ success: true, count: active.length, data: active });
});
