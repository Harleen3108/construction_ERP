import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Tender from '../models/Tender';
import Bid from '../models/Bid';
import Bill from '../models/Bill';
import Payment from '../models/Payment';
import WorkOrder from '../models/WorkOrder';
import MeasurementBook from '../models/MeasurementBook';
import { AuthRequest } from '../middleware/auth';

/**
 * Contractor dashboard — comprehensive workspace view.
 */
export const contDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const monthStart = new Date(new Date().setDate(1));
  monthStart.setHours(0, 0, 0, 0);

  const [
    // Tenders & bidding
    availableTenders, myBids, wonBids, lostBids,
    // Projects
    awardedProjects, activeProjects, completedProjects,
    // Bills & payments
    pendingBillsAgg, paidBillsAgg, thisMonthPaidAgg, deductionsAgg,
    billsPending, billsPaid,
    // Work orders pending acceptance
    pendingWOAcceptance,
    // Monthly earnings
    monthlyEarnings,
    // Recent activity
    recentBids, recentBills, recentPayments,
    // Active projects with progress
    activeProjectsList,
  ] = await Promise.all([
    Tender.countDocuments({ status: { $in: ['PUBLISHED', 'BIDDING_OPEN'] } }),
    Bid.countDocuments({ contractor: userId }),
    Bid.countDocuments({ contractor: userId, isL1: true }),
    Bid.countDocuments({ contractor: userId, status: 'TECHNICALLY_DISQUALIFIED' }),

    Project.countDocuments({ awardedTo: userId }),
    Project.countDocuments({ awardedTo: userId, status: 'IN_PROGRESS' }),
    Project.countDocuments({ awardedTo: userId, status: 'COMPLETED' }),

    Bill.aggregate([
      { $match: { contractor: userId, status: { $nin: ['PAID', 'REJECTED'] } } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { contractor: userId, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { contractor: userId, status: 'RELEASED', paymentDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Bill.aggregate([
      { $match: { contractor: userId, status: 'PAID' } },
      {
        $group: {
          _id: null,
          gst: { $sum: '$gstAmount' },
          tds: { $sum: '$tdsAmount' },
          security: { $sum: '$securityAmount' },
          total: { $sum: '$totalDeductions' },
        },
      },
    ]),
    Bill.countDocuments({ contractor: userId, status: { $nin: ['PAID', 'REJECTED'] } }),
    Bill.countDocuments({ contractor: userId, status: 'PAID' }),

    WorkOrder.countDocuments({ contractor: userId, acceptedByContractor: false }),

    Payment.aggregate([
      { $match: { contractor: userId, status: 'RELEASED', paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),

    Bid.find({ contractor: userId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('tender', 'tenderId title estimatedCost status')
      .lean(),
    Bill.find({ contractor: userId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('project', 'name')
      .lean(),
    Payment.find({ contractor: userId, status: 'RELEASED' })
      .sort({ paymentDate: -1 }).limit(5)
      .populate('bill', 'billNumber')
      .lean(),

    Project.find({ awardedTo: userId, status: 'IN_PROGRESS' })
      .select('name location overallProgress endDate awardedAmount workOrder')
      .populate('workOrder', 'workOrderId acceptedByContractor')
      .limit(5)
      .lean(),
  ]);

  const ded = deductionsAgg[0] || { gst: 0, tds: 0, security: 0, total: 0 };
  const winRate = myBids ? Math.round((wonBids / myBids) * 100) : 0;

  // Document compliance score
  const u = req.user!;
  const docFields = ['companyName', 'gstNumber', 'panNumber', 'registrationNumber', 'experienceYears'];
  const filledDocs = docFields.filter((f) => !!(u as any)[f]).length;
  const docCompliance = Math.round((filledDocs / docFields.length) * 100);

  res.json({
    success: true,
    data: {
      kpi: {
        availableTenders, myBids, wonBids, lostBids, winRate,
        awardedProjects, activeProjects, completedProjects,
        pendingPayout: pendingBillsAgg[0]?.total || 0,
        totalEarned: paidBillsAgg[0]?.total || 0,
        thisMonthEarned: thisMonthPaidAgg[0]?.total || 0,
        totalDeductions: ded.total,
        gstPaid: ded.gst, tdsPaid: ded.tds, securityHeld: ded.security,
        billsPending, billsPaid,
        pendingWOAcceptance,
        docCompliance,
        contractorVerified: u.contractorVerified,
      },
      monthlyEarnings,
      recentBids,
      recentBills,
      recentPayments,
      activeProjectsList,
    },
  });
});

/**
 * Earnings — comprehensive financial breakdown for contractor.
 */
export const earnings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const { fromDate, toDate } = req.query;

  const matchStage: any = { contractor: userId };
  if (fromDate || toDate) {
    matchStage.paymentDate = {};
    if (fromDate) matchStage.paymentDate.$gte = new Date(fromDate as string);
    if (toDate) matchStage.paymentDate.$lte = new Date(toDate as string);
  }
  matchStage.status = 'RELEASED';

  const [summary, byMonth, byProject, recentPayments] = await Promise.all([
    Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { y: { $year: '$paymentDate' }, m: { $month: '$paymentDate' } },
          amount: { $sum: '$amount' }, count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$project', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      {
        $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' },
      },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          total: 1, count: 1,
          projectName: '$project.name', projectId: '$project.projectId',
          estimatedCost: '$project.estimatedCost', awardedAmount: '$project.awardedAmount',
        },
      },
    ]),
    Payment.find(matchStage)
      .sort({ paymentDate: -1 }).limit(20)
      .populate('bill', 'billNumber currentBillAmount totalDeductions netPayable gstAmount tdsAmount securityAmount')
      .populate('project', 'name')
      .lean(),
  ]);

  // Pending bills (not yet paid)
  const pending = await Bill.find({
    contractor: userId,
    status: { $nin: ['PAID', 'REJECTED'] },
  })
    .populate('project', 'name')
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      summary: summary[0] || { total: 0, count: 0 },
      byMonth,
      byProject,
      recentPayments,
      pendingBills: pending,
    },
  });
});

/**
 * Contractor active projects — execution view
 */
export const myProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const projects = await Project.find({ awardedTo: userId })
    .populate('workOrder')
    .sort({ status: 1, createdAt: -1 })
    .lean();

  const annotated = await Promise.all(
    projects.map(async (p) => {
      const [mbCount, billCount, billsPaid, paidAgg] = await Promise.all([
        MeasurementBook.countDocuments({ project: p._id }),
        Bill.countDocuments({ project: p._id, contractor: userId }),
        Bill.countDocuments({ project: p._id, contractor: userId, status: 'PAID' }),
        Bill.aggregate([
          { $match: { project: p._id, contractor: userId, status: 'PAID' } },
          { $group: { _id: null, total: { $sum: '$netPayable' } } },
        ]),
      ]);
      const totalPaid = paidAgg[0]?.total || 0;
      const remainingValue = Math.max(0, (p.awardedAmount || 0) - totalPaid);
      const isOverdue = p.status === 'IN_PROGRESS' && p.endDate && new Date(p.endDate) < new Date();
      return {
        ...p,
        execution: {
          mbCount, billCount, billsPaid, totalPaid, remainingValue, isOverdue,
        },
      };
    })
  );

  res.json({ success: true, count: annotated.length, data: annotated });
});
