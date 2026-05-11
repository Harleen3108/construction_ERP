import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Tender from '../models/Tender';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import Approval from '../models/Approval';
import User from '../models/User';
import MeasurementBook from '../models/MeasurementBook';
import MaterialRequest from '../models/MaterialRequest';
import DailyProgress from '../models/DailyProgress';
import { AuthRequest } from '../middleware/auth';

/**
 * EE operational dashboard — focused on day-to-day division operations.
 */
export const eeDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) return res.json({ success: true, data: {} });
  const department = req.user!.department;

  const [
    // Approvals at EE stage
    pendingProjects, pendingTenders, pendingMBs, pendingBills,
    // Active operations
    activeTenders, activeProjects, openMaterialReqs,
    // Verification queue
    mbsToApprove, billsToApprove,
    // Team
    sdoCount, jeCount, contractorCount,
    // Financial pipeline
    budgetAgg, awardedAgg, billedAgg, paidAgg,
    // Time-series
    monthlyApprovals, dailyProgressTrend,
    // Status distribution
    projectStatusDist,
    // Activity feeds
    recentDailyProgress, recentMBs, recentBills,
  ] = await Promise.all([
    Approval.countDocuments({ department, stage: 'EE', status: 'PENDING', entityType: 'PROJECT' }),
    Approval.countDocuments({ department, stage: 'EE', status: 'PENDING', entityType: 'TENDER' }),
    Approval.countDocuments({ department, stage: 'EE', status: 'PENDING', entityType: 'MB' }),
    Approval.countDocuments({ department, stage: 'EE', status: 'PENDING', entityType: 'BILL' }),
    Tender.countDocuments({ department, status: { $in: ['PUBLISHED','BIDDING_OPEN','EVALUATION'] } }),
    Project.countDocuments({ department, status: 'IN_PROGRESS' }),
    MaterialRequest.countDocuments({ status: 'PENDING' }),
    MeasurementBook.countDocuments({ department, status: 'SDO_APPROVED' }), // SDO already approved, EE next
    Bill.countDocuments({ department, status: 'SDO_APPROVED' }),             // SDO approved, EE next
    User.countDocuments({ department, role: 'SDO', active: true }),
    User.countDocuments({ department, role: 'JE', active: true }),
    User.countDocuments({ role: 'CONTRACTOR', active: true }),
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
    // Monthly approvals actioned by this EE
    Approval.aggregate([
      { $match: { approver: req.user!._id, updatedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    // Daily progress submissions (last 14 days)
    DailyProgress.aggregate([
      { $match: { department, reportDate: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Project.aggregate([
      { $match: { department } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    DailyProgress.find({ department }).sort({ reportDate: -1 }).limit(5)
      .populate('project', 'name').populate('recordedBy', 'name role').lean(),
    MeasurementBook.find({ department }).sort({ createdAt: -1 }).limit(5)
      .populate('project', 'name').populate('recordedBy', 'name').lean(),
    Bill.find({ department }).sort({ createdAt: -1 }).limit(5)
      .populate('project', 'name').populate('contractor', 'name companyName').lean(),
  ]);

  const totalPendingEE = pendingProjects + pendingTenders + pendingMBs + pendingBills;
  const totalBudget = budgetAgg[0]?.total || 0;
  const totalAwarded = awardedAgg[0]?.total || 0;
  const totalBilled = billedAgg[0]?.total || 0;
  const totalPaid = paidAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      kpi: {
        totalPendingEE,
        pendingProjects, pendingTenders, pendingMBs, pendingBills,
        activeTenders, activeProjects, openMaterialReqs,
        mbsToApprove, billsToApprove,
        sdoCount, jeCount, contractorCount,
        totalBudget, totalAwarded, totalBilled, totalPaid,
        savings: totalBudget - totalAwarded,
      },
      monthlyApprovals,
      dailyProgressTrend,
      projectStatusDist,
      recentDailyProgress,
      recentMBs,
      recentBills,
    },
  });
});

/**
 * EE-stage approval queue (just items pending EE approval, in workflow order).
 */
export const eeApprovalQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const { type } = req.query; // optional filter

  const q: any = { department, stage: 'EE', status: 'PENDING' };
  if (type) q.entityType = String(type).toUpperCase();

  const all = await Approval.find(q).sort({ createdAt: -1 }).lean();

  const ready: any[] = [];
  for (const ap of all) {
    // Only ready if earlier-order approvals (same entity) are all APPROVED
    const earlier = await Approval.find({
      entityType: ap.entityType, entityId: ap.entityId, order: { $lt: ap.order },
    }).lean();
    if (!earlier.every((e) => e.status === 'APPROVED')) continue;

    let entity: any = null;
    if (ap.entityType === 'PROJECT') entity = await Project.findById(ap.entityId).populate('proposedBy', 'name').lean();
    if (ap.entityType === 'TENDER') entity = await Tender.findById(ap.entityId).populate('project', 'name location').lean();
    if (ap.entityType === 'MB') entity = await MeasurementBook.findById(ap.entityId).populate('project', 'name').populate('recordedBy', 'name').lean();
    if (ap.entityType === 'BILL') entity = await Bill.findById(ap.entityId).populate('project', 'name').populate('contractor', 'name companyName').lean();
    ready.push({ ...ap, entity });
  }

  res.json({ success: true, count: ready.length, data: ready });
});

/**
 * EE Team productivity — SDOs and JEs under this EE's division
 */
export const eeTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const team = await User.find({ department, role: { $in: ['SDO', 'JE'] }, active: true })
    .select('name email role designation phone lastLoginAt')
    .sort({ role: 1, name: 1 });

  const annotated = await Promise.all(
    team.map(async (u) => {
      const [proposals, mbs, approvalsDone, pending, dailyReports] = await Promise.all([
        Project.countDocuments({ proposedBy: u._id }),
        MeasurementBook.countDocuments({ recordedBy: u._id }),
        Approval.countDocuments({ approver: u._id, status: { $in: ['APPROVED', 'REJECTED'] } }),
        Approval.countDocuments({ stage: u.role, status: 'PENDING', department }),
        DailyProgress.countDocuments({ recordedBy: u._id }),
      ]);
      const lastActiveDays = u.lastLoginAt
        ? Math.floor((Date.now() - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...u.toObject(),
        metrics: { proposals, mbs, approvalsDone, pending, dailyReports, lastActiveDays },
      };
    })
  );

  res.json({ success: true, count: annotated.length, data: annotated });
});
