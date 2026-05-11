import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Approval from '../models/Approval';
import MeasurementBook from '../models/MeasurementBook';
import DailyProgress from '../models/DailyProgress';
import MaterialRequest from '../models/MaterialRequest';
import Milestone from '../models/Milestone';
import { AuthRequest } from '../middleware/auth';

/**
 * JE field-execution dashboard — focused on personal submissions and assigned work.
 */
export const jeDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const department = req.user!.department;
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    myProposals, myMBs, myDailyReports, myMaterialReqs,
    proposalsApproved, mbsApproved, mbsRejected,
    todayReports, thisWeekMBs,
    assignedActiveProjects,
    pendingApprovalsCount,
    monthlyActivity, dailyTrend,
    recentProposals, recentMBs, recentReports,
  ] = await Promise.all([
    Project.countDocuments({ proposedBy: userId }),
    MeasurementBook.countDocuments({ recordedBy: userId }),
    DailyProgress.countDocuments({ recordedBy: userId }),
    MaterialRequest.countDocuments({ requestedBy: userId }),
    Project.countDocuments({ proposedBy: userId, status: { $nin: ['PROPOSED','UNDER_APPROVAL','REJECTED'] } }),
    MeasurementBook.countDocuments({ recordedBy: userId, status: 'EE_APPROVED' }),
    MeasurementBook.countDocuments({ recordedBy: userId, status: 'REJECTED' }),
    DailyProgress.countDocuments({ recordedBy: userId, reportDate: { $gte: todayStart } }),
    MeasurementBook.countDocuments({
      recordedBy: userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    // Projects in execution where this JE was the proposer
    Project.find({ proposedBy: userId, status: { $in: ['IN_PROGRESS', 'AWARDED'] } })
      .select('name location overallProgress endDate awardedTo')
      .populate('awardedTo', 'name companyName')
      .lean(),
    // Pending approvals on the JE's own submissions
    countPendingFromMe(userId),
    // Monthly MB activity (last 6 months)
    MeasurementBook.aggregate([
      { $match: { recordedBy: userId, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    // Daily report submissions (last 14 days)
    DailyProgress.aggregate([
      { $match: { recordedBy: userId, reportDate: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Project.find({ proposedBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    MeasurementBook.find({ recordedBy: userId }).sort({ createdAt: -1 }).limit(5).populate('project', 'name').lean(),
    DailyProgress.find({ recordedBy: userId }).sort({ reportDate: -1 }).limit(5).populate('project', 'name').lean(),
  ]);

  res.json({
    success: true,
    data: {
      kpi: {
        myProposals, myMBs, myDailyReports, myMaterialReqs,
        proposalsApproved, mbsApproved, mbsRejected,
        todayReports, thisWeekMBs,
        assignedActiveCount: assignedActiveProjects.length,
        pendingFromMe: pendingApprovalsCount,
      },
      assignedActiveProjects,
      monthlyActivity,
      dailyTrend,
      recentProposals,
      recentMBs,
      recentReports,
    },
  });
});

async function countPendingFromMe(userId: any) {
  // Count of approvals on entities the user submitted
  const projects = await Project.find({ proposedBy: userId, status: 'UNDER_APPROVAL' }).select('_id');
  const mbs = await MeasurementBook.find({ recordedBy: userId, status: { $in: ['SUBMITTED', 'SDO_APPROVED'] } }).select('_id');
  const allIds = [...projects.map((p) => p._id), ...mbs.map((m) => m._id)];
  return Approval.countDocuments({
    entityId: { $in: allIds }, status: 'PENDING',
  });
}

/**
 * "My Submissions" — every entity the JE has submitted with its current approval status
 */
export const mySubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const { type } = req.query;

  const result: any[] = [];

  if (!type || type === 'PROPOSAL') {
    const projects = await Project.find({ proposedBy: userId }).sort({ createdAt: -1 }).lean();
    for (const p of projects) {
      const approvals = await Approval.find({ entityType: 'PROJECT', entityId: p._id }).sort({ order: 1 }).lean();
      const nextStage = approvals.find((a) => a.status === 'PENDING');
      result.push({
        kind: 'PROPOSAL',
        _id: p._id,
        name: p.name,
        projectId: p.projectId,
        amount: p.estimatedCost,
        status: p.status,
        createdAt: p.createdAt,
        approvals,
        nextStage: nextStage?.stage || null,
        link: `/proposals/${p._id}`,
      });
    }
  }

  if (!type || type === 'MB') {
    const mbs = await MeasurementBook.find({ recordedBy: userId }).sort({ createdAt: -1 })
      .populate('project', 'name').lean();
    for (const m of mbs) {
      const approvals = await Approval.find({ entityType: 'MB', entityId: m._id }).sort({ order: 1 }).lean();
      const nextStage = approvals.find((a) => a.status === 'PENDING');
      result.push({
        kind: 'MB',
        _id: m._id,
        name: m.workItem,
        projectId: m.mbId,
        projectName: (m.project as any)?.name,
        amount: m.totalAmount,
        status: m.status,
        createdAt: m.createdAt,
        approvals,
        nextStage: nextStage?.stage || null,
        link: `/mb/${m._id}`,
      });
    }
  }

  if (!type || type === 'DAILY') {
    const reports = await DailyProgress.find({ recordedBy: userId }).sort({ reportDate: -1 }).limit(50)
      .populate('project', 'name').lean();
    for (const r of reports) {
      result.push({
        kind: 'DAILY',
        _id: r._id,
        name: r.workDescription?.slice(0, 60),
        projectName: (r.project as any)?.name,
        status: r.verifiedBy ? 'VERIFIED' : 'PENDING',
        createdAt: r.reportDate,
        verifiedAt: r.verifiedAt,
        link: '/daily-progress',
      });
    }
  }

  if (!type || type === 'MATERIAL') {
    const materials = await MaterialRequest.find({ requestedBy: userId }).sort({ createdAt: -1 }).limit(50)
      .populate('project', 'name').lean();
    for (const r of materials) {
      result.push({
        kind: 'MATERIAL',
        _id: r._id,
        name: `${r.items?.length || 0} items requested`,
        projectName: (r.project as any)?.name,
        status: r.status,
        createdAt: r.createdAt,
        link: '/material-requests',
      });
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const summary = {
    total: result.length,
    pending: result.filter((r) => /SUBMIT|UNDER_APP|PENDING|SDO_APP/.test(r.status || '')).length,
    approved: result.filter((r) => /EE_APP|SANCTIONED|APPROVED|VERIFIED|IN_PROG|COMPLETED|DELIVERED/.test(r.status || '')).length,
    rejected: result.filter((r) => /REJECTED/.test(r.status || '')).length,
  };

  res.json({ success: true, count: result.length, summary, data: result });
});

/**
 * Site Monitoring — unified field view across all assigned projects.
 * Per-project: progress, last daily report, last MB, contractor activity, pending tasks.
 */
export const siteMonitoring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const department = req.user!.department;

  // Projects this JE is involved with
  const projects = await Project.find({
    $or: [
      { proposedBy: userId },
      { status: 'IN_PROGRESS', department },
    ],
  })
    .populate('awardedTo', 'name companyName')
    .sort({ overallProgress: 1 })
    .lean();

  const enriched = await Promise.all(
    projects.map(async (p) => {
      const [lastDaily, lastMB, milestonesTotal, milestonesDone, recentIssues, mbsThisWeek] = await Promise.all([
        DailyProgress.findOne({ project: p._id })
          .sort({ reportDate: -1 })
          .populate('recordedBy', 'name')
          .lean(),
        MeasurementBook.findOne({ project: p._id })
          .sort({ createdAt: -1 })
          .lean(),
        Milestone.countDocuments({ project: p._id }),
        Milestone.countDocuments({ project: p._id, status: 'COMPLETED' }),
        DailyProgress.find({
          project: p._id,
          issues: { $exists: true, $ne: null, $not: { $eq: '' } },
          reportDate: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        }).select('issues reportDate').sort({ reportDate: -1 }).limit(3).lean(),
        MeasurementBook.countDocuments({
          project: p._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      const daysSinceReport = lastDaily
        ? Math.floor((Date.now() - new Date(lastDaily.reportDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isOverdue = p.status === 'IN_PROGRESS' && p.endDate && new Date(p.endDate) < new Date();

      return {
        ...p,
        site: {
          lastDaily,
          lastMB,
          milestonesTotal,
          milestonesDone,
          recentIssues,
          mbsThisWeek,
          daysSinceReport,
          needsAttention: (daysSinceReport ?? 999) > 3 || recentIssues.length > 0,
          isOverdue,
        },
      };
    })
  );

  res.json({ success: true, count: enriched.length, data: enriched });
});

/**
 * Project Timeline — visual milestone Gantt data for a project.
 */
export const projectTimeline = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('awardedTo', 'name companyName')
    .populate('proposedBy', 'name')
    .lean();

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const milestones = await Milestone.find({ project: id })
    .sort({ plannedStartDate: 1 })
    .lean();

  // Determine timeline bounds
  const dates = milestones
    .flatMap((m) => [m.plannedStartDate, m.plannedEndDate, m.actualStartDate, m.actualEndDate])
    .filter(Boolean)
    .map((d) => new Date(d!).getTime());
  if (project.startDate) dates.push(new Date(project.startDate).getTime());
  if (project.endDate) dates.push(new Date(project.endDate).getTime());

  const timelineStart = dates.length ? Math.min(...dates) : Date.now();
  const timelineEnd = dates.length ? Math.max(...dates) : Date.now() + 30 * 24 * 60 * 60 * 1000;

  // Annotate each milestone with timeline position
  const totalDuration = timelineEnd - timelineStart;
  const enriched = milestones.map((m) => {
    const start = new Date(m.plannedStartDate).getTime();
    const end = new Date(m.plannedEndDate).getTime();
    const actualStart = m.actualStartDate ? new Date(m.actualStartDate).getTime() : null;
    const actualEnd = m.actualEndDate ? new Date(m.actualEndDate).getTime() : null;
    return {
      ...m,
      timeline: {
        plannedOffset: ((start - timelineStart) / totalDuration) * 100,
        plannedWidth: ((end - start) / totalDuration) * 100,
        actualOffset: actualStart ? ((actualStart - timelineStart) / totalDuration) * 100 : null,
        actualWidth: actualStart && actualEnd ? ((actualEnd - actualStart) / totalDuration) * 100 : null,
        isOverdue: m.status !== 'COMPLETED' && end < Date.now(),
      },
    };
  });

  // Recent daily reports for context
  const recentReports = await DailyProgress.find({ project: id })
    .sort({ reportDate: -1 }).limit(10)
    .populate('recordedBy', 'name role')
    .lean();

  res.json({
    success: true,
    data: {
      project,
      milestones: enriched,
      timelineStart, timelineEnd,
      recentReports,
    },
  });
});

/**
 * Tasks / milestones assigned across JE's projects
 */
export const myTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  // JE's projects (proposed by them or projects in IN_PROGRESS in their department)
  const projects = await Project.find({
    $or: [
      { proposedBy: userId },
      { status: 'IN_PROGRESS', department: req.user!.department },
    ],
  }).select('_id name').lean();

  const projectIds = projects.map((p) => p._id);
  const milestones = await Milestone.find({ project: { $in: projectIds } })
    .populate('project', 'name')
    .sort({ plannedStartDate: 1 });

  const now = new Date();
  const annotated = milestones.map((m: any) => ({
    ...m.toObject(),
    isOverdue: m.status !== 'COMPLETED' && m.plannedEndDate && new Date(m.plannedEndDate) < now,
    daysToEnd: m.plannedEndDate
      ? Math.floor((new Date(m.plannedEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  res.json({ success: true, count: annotated.length, data: annotated });
});
