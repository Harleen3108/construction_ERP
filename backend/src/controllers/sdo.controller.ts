import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Approval from '../models/Approval';
import MeasurementBook from '../models/MeasurementBook';
import Bill from '../models/Bill';
import DailyProgress from '../models/DailyProgress';
import MaterialRequest from '../models/MaterialRequest';
import Inspection from '../models/Inspection';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * SDO verification dashboard — focused on field verification work.
 */
export const sdoDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) return res.json({ success: true, data: {} });
  const department = req.user!.department;

  const [
    pendingProjects, pendingMBs, pendingBills,
    unverifiedDailyReports, pendingMaterials, scheduledInspections,
    activeProjects, contractorsCount, jeCount,
    monthlyVerifications, dailyTrend,
    recentMBsToVerify, recentDailyReports,
  ] = await Promise.all([
    Approval.countDocuments({ department, stage: 'SDO', status: 'PENDING', entityType: 'PROJECT' }),
    Approval.countDocuments({ department, stage: 'SDO', status: 'PENDING', entityType: 'MB' }),
    Approval.countDocuments({ department, stage: 'SDO', status: 'PENDING', entityType: 'BILL' }),
    DailyProgress.countDocuments({ department, verifiedBy: { $exists: false } }),
    MaterialRequest.countDocuments({ status: 'PENDING' }),
    Inspection.countDocuments({ department, status: 'SCHEDULED', inspector: req.user!._id }),
    Project.countDocuments({ department, status: 'IN_PROGRESS' }),
    User.countDocuments({ role: 'CONTRACTOR', active: true }),
    User.countDocuments({ department, role: 'JE', active: true }),
    // SDO's verification activity (last 6 months)
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
          submitted: { $sum: 1 },
          verified: { $sum: { $cond: [{ $ifNull: ['$verifiedBy', false] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    MeasurementBook.find({ department, status: 'SUBMITTED' })
      .sort({ createdAt: -1 }).limit(5)
      .populate('project', 'name location')
      .populate('recordedBy', 'name')
      .lean(),
    DailyProgress.find({ department, verifiedBy: { $exists: false } })
      .sort({ reportDate: -1 }).limit(5)
      .populate('project', 'name')
      .populate('recordedBy', 'name role')
      .lean(),
  ]);

  const totalPendingSDO = pendingProjects + pendingMBs + pendingBills;

  res.json({
    success: true,
    data: {
      kpi: {
        totalPendingSDO,
        pendingProjects, pendingMBs, pendingBills,
        unverifiedDailyReports, pendingMaterials, scheduledInspections,
        activeProjects, contractorsCount, jeCount,
      },
      monthlyVerifications,
      dailyTrend,
      recentMBsToVerify,
      recentDailyReports,
    },
  });
});

/**
 * SDO-stage approval queue (items pending SDO approval, in workflow order).
 */
export const sdoApprovalQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const { type } = req.query;

  const q: any = { department, stage: 'SDO', status: 'PENDING' };
  if (type) q.entityType = String(type).toUpperCase();

  const all = await Approval.find(q).sort({ createdAt: -1 }).lean();

  const ready: any[] = [];
  for (const ap of all) {
    const earlier = await Approval.find({
      entityType: ap.entityType, entityId: ap.entityId, order: { $lt: ap.order },
    }).lean();
    if (!earlier.every((e) => e.status === 'APPROVED')) continue;

    let entity: any = null;
    if (ap.entityType === 'PROJECT') entity = await Project.findById(ap.entityId).populate('proposedBy', 'name').lean();
    if (ap.entityType === 'MB') entity = await MeasurementBook.findById(ap.entityId).populate('project', 'name location').populate('recordedBy', 'name').lean();
    if (ap.entityType === 'BILL') entity = await Bill.findById(ap.entityId).populate('project', 'name').populate('contractor', 'name companyName').lean();
    ready.push({ ...ap, entity });
  }

  res.json({ success: true, count: ready.length, data: ready });
});

/**
 * Daily progress reports awaiting SDO verification.
 */
export const dailyProgressToVerify = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = req.user!.department;
  const items = await DailyProgress.find({ department, verifiedBy: { $exists: false } })
    .populate('project', 'name location overallProgress')
    .populate('recordedBy', 'name role')
    .sort({ reportDate: -1 });

  const verifiedToday = await DailyProgress.countDocuments({
    department,
    verifiedBy: req.user!._id,
    verifiedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });

  res.json({ success: true, count: items.length, verifiedToday, data: items });
});
