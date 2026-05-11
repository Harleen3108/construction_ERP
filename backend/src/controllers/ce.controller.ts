import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Tender from '../models/Tender';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Approval from '../models/Approval';
import User from '../models/User';
import MeasurementBook from '../models/MeasurementBook';
import Bid from '../models/Bid';
import { AuthRequest } from '../middleware/auth';

const HIGH_VALUE_THRESHOLD = Number(process.env.CE_HIGH_VALUE_THRESHOLD || 50_000_000); // 5 Cr

/**
 * Comprehensive CE governance dashboard.
 * Aggregates everything across the department for top-level oversight.
 */
export const ceDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) {
    return res.json({ success: true, data: {} });
  }
  const department = req.user!.department;

  const [
    totalProjects, inProgress, completed, delayed,
    totalTenders, openTenders, awardedTenders, evaluationTenders,
    totalBudgetAgg, finalCostAgg, paidAgg, pendingPayoutAgg,
    pendingMyApprovals,
    statusDist, typeDist,
    monthlyProjects, monthlyPayments,
    districtStats,
    contractorStats,
  ] = await Promise.all([
    Project.countDocuments({ department }),
    Project.countDocuments({ department, status: 'IN_PROGRESS' }),
    Project.countDocuments({ department, status: 'COMPLETED' }),
    Project.countDocuments({ department, status: 'IN_PROGRESS', endDate: { $lt: new Date() } }),
    Tender.countDocuments({ department }),
    Tender.countDocuments({ department, status: { $in: ['PUBLISHED', 'BIDDING_OPEN'] } }),
    Tender.countDocuments({ department, status: 'AWARDED' }),
    Tender.countDocuments({ department, status: 'EVALUATION' }),
    Project.aggregate([{ $match: { department } }, { $group: { _id: null, total: { $sum: '$estimatedCost' } } }]),
    Project.aggregate([
      { $match: { department, finalCost: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: '$finalCost' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Bill.aggregate([
      { $match: { department, status: { $in: ['ACCOUNTS_VERIFIED', 'TREASURY_PENDING'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]),
    // CE pending approvals (only stage='CE')
    Approval.countDocuments({ department, stage: 'CE', status: 'PENDING' }),
    // Project status distribution
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
    ]),
    // Project type distribution
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: '$projectType', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedCost' } } },
    ]),
    // Monthly trend (last 6 months)
    Project.aggregate([
      { $match: { department, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 }, budget: { $sum: '$estimatedCost' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
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
    // District/division-wise stats
    Project.aggregate([
      { $match: { department } },
      {
        $group: {
          _id: { district: '$district', state: '$state' },
          count: { $sum: 1 },
          budget: { $sum: '$estimatedCost' },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          delayed: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'IN_PROGRESS'] }, { $lt: ['$endDate', new Date()] }] },
                1, 0,
              ],
            },
          },
        },
      },
      { $sort: { budget: -1 } },
      { $limit: 10 },
    ]),
    // Top contractors by award value
    Project.aggregate([
      { $match: { department, awardedTo: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$awardedTo',
          projectCount: { $sum: 1 },
          totalAwarded: { $sum: '$awardedAmount' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          delayed: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'IN_PROGRESS'] }, { $lt: ['$endDate', new Date()] }] },
                1, 0,
              ],
            },
          },
        },
      },
      { $sort: { totalAwarded: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'contractor' },
      },
      { $unwind: { path: '$contractor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectCount: 1, totalAwarded: 1, completed: 1, delayed: 1,
          name: '$contractor.companyName', email: '$contractor.email',
        },
      },
    ]),
  ]);

  const totalBudget = totalBudgetAgg[0]?.total || 0;
  const finalCost = finalCostAgg[0]?.total || 0;
  const totalPaid = paidAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      kpi: {
        totalProjects, inProgress, completed, delayed,
        totalTenders, openTenders, awardedTenders, evaluationTenders,
        totalBudget, finalCost, totalPaid,
        utilizationPercent: totalBudget ? Math.round((totalPaid / totalBudget) * 100) : 0,
        pendingPayout: pendingPayoutAgg[0]?.total || 0,
        pendingPayoutCount: pendingPayoutAgg[0]?.count || 0,
        pendingMyApprovals,
        delayPercent: inProgress ? Math.round((delayed / inProgress) * 100) : 0,
      },
      statusDist,
      typeDist,
      monthlyProjects,
      monthlyPayments,
      districtStats,
      contractorStats,
    },
  });
});

/**
 * High-value approvals queue — CE-stage approvals where entity is above threshold.
 */
export const highValueApprovals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const threshold = Number(req.query.threshold) || HIGH_VALUE_THRESHOLD;

  const all = await Approval.find({ department, stage: 'CE', status: 'PENDING' })
    .sort({ createdAt: -1 })
    .lean();

  const ready: any[] = [];
  for (const ap of all) {
    // Only show approvals whose earlier steps have been approved
    const earlier = await Approval.find({
      entityType: ap.entityType, entityId: ap.entityId, order: { $lt: ap.order },
    }).lean();
    if (!earlier.every((e) => e.status === 'APPROVED')) continue;

    // Hydrate entity
    let entity: any = null;
    let value = 0;
    if (ap.entityType === 'PROJECT') {
      entity = await Project.findById(ap.entityId).lean();
      value = entity?.estimatedCost || 0;
    } else if (ap.entityType === 'TENDER') {
      entity = await Tender.findById(ap.entityId).populate('project', 'name location').lean();
      value = entity?.estimatedCost || 0;
    } else if (ap.entityType === 'BILL') {
      entity = await Bill.findById(ap.entityId).populate('project', 'name').populate('contractor', 'name companyName').lean();
      value = entity?.netPayable || 0;
    } else if (ap.entityType === 'MB') {
      entity = await MeasurementBook.findById(ap.entityId).populate('project', 'name').lean();
      value = entity?.totalAmount || 0;
    }
    ready.push({ ...ap, entity, value, isHighValue: value >= threshold });
  }

  // High-value first, then everything else by value desc
  ready.sort((a, b) => {
    if (a.isHighValue !== b.isHighValue) return a.isHighValue ? -1 : 1;
    return (b.value || 0) - (a.value || 0);
  });

  res.json({
    success: true,
    threshold,
    count: ready.length,
    highValueCount: ready.filter((r) => r.isHighValue).length,
    data: ready,
  });
});

/**
 * Risk dashboard — delayed and at-risk projects.
 */
export const riskDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const now = new Date();
  const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const delayed = await Project.find({
    department, status: 'IN_PROGRESS', endDate: { $lt: now },
  })
    .populate('awardedTo', 'name companyName')
    .populate('proposedBy', 'name')
    .select('name location estimatedCost overallProgress endDate startDate awardedTo proposedBy');

  const dueSoon = await Project.find({
    department, status: 'IN_PROGRESS',
    endDate: { $gte: now, $lt: next30 },
    overallProgress: { $lt: 80 },
  })
    .populate('awardedTo', 'name companyName')
    .select('name location estimatedCost overallProgress endDate awardedTo');

  // Stalled — projects with no MB updates in last 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMBs = await MeasurementBook.aggregate([
    { $match: { department } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$project', lastMBAt: { $first: '$createdAt' } } },
  ]);
  const recentMap = new Map(recentMBs.map((r) => [String(r._id), r.lastMBAt]));
  const allActive = await Project.find({ department, status: 'IN_PROGRESS' })
    .populate('awardedTo', 'name companyName')
    .select('name location estimatedCost overallProgress awardedTo');
  const stalled = allActive.filter((p) => {
    const last = recentMap.get(String(p._id));
    return !last || new Date(last) < cutoff;
  });

  // Cost overruns
  const overrun = await Project.find({
    department,
    finalCost: { $exists: true, $ne: null },
    $expr: { $gt: ['$finalCost', { $multiply: ['$estimatedCost', 1.05] }] },
  })
    .populate('awardedTo', 'name companyName')
    .select('name estimatedCost finalCost awardedTo');

  res.json({
    success: true,
    data: {
      delayed: delayed.map((p) => ({
        ...p.toObject(),
        daysOverdue: Math.floor((now.getTime() - new Date(p.endDate!).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      dueSoon: dueSoon.map((p) => ({
        ...p.toObject(),
        daysRemaining: Math.floor((new Date(p.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      stalled,
      overrun: overrun.map((p) => ({
        ...p.toObject(),
        overrunPercent: Math.round(((p.finalCost! - p.estimatedCost) / p.estimatedCost) * 100),
      })),
    },
  });
});

/**
 * Engineer performance — productivity per EE/SDO/JE.
 */
export const engineerPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;

  const engineers = await User.find({
    department, role: { $in: ['EE', 'SDO', 'JE'] }, active: true,
  }).select('name email role designation');

  const results = await Promise.all(
    engineers.map(async (u) => {
      const [
        proposalsCreated, mbsRecorded, approvalsActioned, projectsAssigned,
      ] = await Promise.all([
        Project.countDocuments({ proposedBy: u._id }),
        MeasurementBook.countDocuments({ recordedBy: u._id }),
        Approval.countDocuments({ approver: u._id, status: { $in: ['APPROVED', 'REJECTED'] } }),
        Project.countDocuments({ department, status: 'IN_PROGRESS' }), // shared workload approximation
      ]);
      const pendingForUser = await Approval.countDocuments({
        stage: u.role, status: 'PENDING', department,
      });
      return {
        ...u.toObject(),
        metrics: {
          proposalsCreated,
          mbsRecorded,
          approvalsActioned,
          pendingApprovals: pendingForUser,
        },
      };
    })
  );

  res.json({ success: true, count: results.length, data: results });
});

/**
 * Financial monitoring — comprehensive department financial picture.
 */
export const financialMonitoring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;

  const [
    totalBudget, totalAwarded, totalBilled, totalPaid,
    deductionsAgg, billsByStatus, paymentsByMode, monthlyDeductions,
    topProjectsByBudget,
  ] = await Promise.all([
    Project.aggregate([{ $match: { department } }, { $group: { _id: null, total: { $sum: '$estimatedCost' } } }]),
    Project.aggregate([
      { $match: { department, awardedAmount: { $exists: true } } },
      { $group: { _id: null, total: { $sum: '$awardedAmount' } } },
    ]),
    Bill.aggregate([{ $match: { department } }, { $group: { _id: null, total: { $sum: '$netPayable' } } }]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
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
      { $match: { department } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$netPayable' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED' } },
      { $group: { _id: '$paymentMode', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { department, status: 'RELEASED', paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $lookup: { from: 'bills', localField: 'bill', foreignField: '_id', as: 'billDoc' },
      },
      { $unwind: { path: '$billDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
          gross: { $sum: { $ifNull: ['$billDoc.currentBillAmount', 0] } },
          deductions: { $sum: { $ifNull: ['$billDoc.totalDeductions', 0] } },
          netPaid: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Project.find({ department }).sort({ estimatedCost: -1 }).limit(10).select('name estimatedCost finalCost overallProgress status awardedAmount'),
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        totalBudget: totalBudget[0]?.total || 0,
        totalAwarded: totalAwarded[0]?.total || 0,
        totalBilled: totalBilled[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
        savings: (totalBudget[0]?.total || 0) - (totalAwarded[0]?.total || 0),
      },
      deductions: deductionsAgg[0] || { gst: 0, tds: 0, security: 0, retention: 0, other: 0, total: 0 },
      billsByStatus,
      paymentsByMode,
      monthlyDeductions,
      topProjectsByBudget,
    },
  });
});

/**
 * Comprehensive project monitor — all department projects with EE/contractor/MB/bill counts
 */
export const projectMonitor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const { status, search } = req.query;

  const q: any = { department };
  if (status) q.status = status;
  if (search) q.name = new RegExp(search as string, 'i');

  const projects = await Project.find(q)
    .populate('proposedBy', 'name role')
    .populate('awardedTo', 'name companyName')
    .sort({ createdAt: -1 })
    .lean();

  // Annotate each with execution metrics
  const annotated = await Promise.all(
    projects.map(async (p) => {
      const [mbCount, mbApproved, billCount, billsPaid, paidAgg, daysToEnd] = await Promise.all([
        MeasurementBook.countDocuments({ project: p._id }),
        MeasurementBook.countDocuments({ project: p._id, status: 'EE_APPROVED' }),
        Bill.countDocuments({ project: p._id }),
        Bill.countDocuments({ project: p._id, status: 'PAID' }),
        Bill.aggregate([
          { $match: { project: p._id, status: 'PAID' } },
          { $group: { _id: null, total: { $sum: '$netPayable' } } },
        ]),
        Promise.resolve(p.endDate ? Math.floor((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null),
      ]);
      return {
        ...p,
        metrics: {
          mbCount, mbApproved,
          billCount, billsPaid,
          totalPaid: paidAgg[0]?.total || 0,
          daysToEnd,
          isDelayed: p.status === 'IN_PROGRESS' && p.endDate && new Date(p.endDate) < new Date(),
        },
      };
    })
  );

  res.json({ success: true, count: annotated.length, data: annotated });
});

/**
 * Tender oversight — all tenders with bid summaries
 */
export const tenderOversight = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const { status } = req.query;

  const q: any = { department };
  if (status) q.status = status;

  const tenders = await Tender.find(q)
    .populate('project', 'name location estimatedCost')
    .populate('createdBy', 'name role')
    .populate('awardedTo', 'name companyName')
    .sort({ createdAt: -1 })
    .lean();

  // Annotate with bid summary (L1, L2, count) — only fetch for tenders with bids
  const annotated = await Promise.all(
    tenders.map(async (t) => {
      const bids = await Bid.find({ tender: t._id, quotedAmount: { $exists: true, $ne: null } })
        .populate('contractor', 'name companyName')
        .sort({ quotedAmount: 1 })
        .limit(3)
        .lean();
      const l1 = bids[0];
      const l2 = bids[1];
      const totalBids = await Bid.countDocuments({ tender: t._id });
      return {
        ...t,
        bidSummary: {
          totalBids,
          l1: l1 ? { name: (l1.contractor as any)?.companyName || (l1.contractor as any)?.name, amount: l1.quotedAmount } : null,
          l2: l2 ? { name: (l2.contractor as any)?.companyName || (l2.contractor as any)?.name, amount: l2.quotedAmount } : null,
          savingsVsEstimate: l1 && t.estimatedCost ? Math.round(((t.estimatedCost - (l1.quotedAmount || 0)) / t.estimatedCost) * 100) : null,
        },
      };
    })
  );

  res.json({ success: true, count: annotated.length, data: annotated });
});

/**
 * CE's personal approval history — every approval/rejection they've actioned
 */
export const approvalHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await Approval.find({
    approver: req.user!._id,
    status: { $in: ['APPROVED', 'REJECTED', 'RETURNED'] },
  })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  // Hydrate entity names
  const items = await Promise.all(
    history.map(async (h) => {
      let entity: any = null;
      if (h.entityType === 'PROJECT') entity = await Project.findById(h.entityId).select('name estimatedCost projectId').lean();
      if (h.entityType === 'TENDER') entity = await Tender.findById(h.entityId).select('title tenderId estimatedCost').lean();
      if (h.entityType === 'BILL') entity = await Bill.findById(h.entityId).select('billNumber netPayable').lean();
      if (h.entityType === 'MB') entity = await MeasurementBook.findById(h.entityId).select('mbId workItem totalAmount').lean();
      return { ...h, entity };
    })
  );

  const summary = {
    approved: history.filter((h) => h.status === 'APPROVED').length,
    rejected: history.filter((h) => h.status === 'REJECTED').length,
    returned: history.filter((h) => h.status === 'RETURNED').length,
    total: history.length,
  };

  res.json({ success: true, count: items.length, summary, data: items });
});

