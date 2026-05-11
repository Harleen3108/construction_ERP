import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User';
import Project from '../models/Project';
import Bill from '../models/Bill';
import Bid from '../models/Bid';
import { AuthRequest } from '../middleware/auth';

export const listContractors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, verified } = req.query;
  const q: any = { role: 'CONTRACTOR' };
  if (verified === 'true') q.contractorVerified = true;
  if (verified === 'false') q.contractorVerified = false;
  if (search) q.$or = [
    { name: new RegExp(search as string, 'i') },
    { companyName: new RegExp(search as string, 'i') },
    { email: new RegExp(search as string, 'i') },
    { gstNumber: new RegExp(search as string, 'i') },
  ];
  const contractors = await User.find(q).sort({ createdAt: -1 });

  // Annotate with award stats
  const annotated = await Promise.all(
    contractors.map(async (c) => {
      const projectsAwarded = await Project.countDocuments({ awardedTo: c._id });
      const totalAwarded = await Project.aggregate([
        { $match: { awardedTo: c._id } },
        { $group: { _id: null, total: { $sum: '$awardedAmount' } } },
      ]);
      return {
        ...c.toObject(),
        projectsAwarded,
        totalAwardedValue: totalAwarded[0]?.total || 0,
      };
    })
  );

  res.json({ success: true, count: annotated.length, data: annotated });
});

export const getContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const c = await User.findOne({ _id: req.params.id, role: 'CONTRACTOR' });
  if (!c) { res.status(404); throw new Error('Contractor not found'); }
  res.json({ success: true, data: c });
});

// Detailed performance metrics for a contractor
export const getContractorPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contractorId = req.params.id;
  const c = await User.findOne({ _id: contractorId, role: 'CONTRACTOR' });
  if (!c) { res.status(404); throw new Error('Contractor not found'); }

  const projects = await Project.find({ awardedTo: contractorId })
    .select('name location estimatedCost awardedAmount status overallProgress startDate endDate actualEndDate');

  const totalBids = await Bid.countDocuments({ contractor: contractorId });
  const wonBids = await Bid.countDocuments({ contractor: contractorId, isL1: true });
  const totalBilled = await Bill.aggregate([
    { $match: { contractor: c._id } },
    { $group: { _id: null, total: { $sum: '$netPayable' } } },
  ]);
  const paid = await Bill.aggregate([
    { $match: { contractor: c._id, status: 'PAID' } },
    { $group: { _id: null, total: { $sum: '$netPayable' } } },
  ]);

  // Compute on-time delivery rate
  const completed = projects.filter((p) => p.status === 'COMPLETED');
  const onTime = completed.filter((p) =>
    p.actualEndDate && p.endDate && new Date(p.actualEndDate) <= new Date(p.endDate)
  ).length;
  const onTimePercent = completed.length ? Math.round((onTime / completed.length) * 100) : 0;

  res.json({
    success: true,
    data: {
      contractor: c,
      projects,
      stats: {
        totalProjects: projects.length,
        active: projects.filter((p) => p.status === 'IN_PROGRESS').length,
        completed: completed.length,
        totalBids,
        wonBids,
        winRate: totalBids ? Math.round((wonBids / totalBids) * 100) : 0,
        onTimePercent,
        totalBilled: totalBilled[0]?.total || 0,
        paidToDate: paid[0]?.total || 0,
      },
    },
  });
});

// Verify contractor (Dept Admin)
export const verifyContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const c = await User.findByIdAndUpdate(
    req.params.id,
    { contractorVerified: true, active: true },
    { new: true }
  );
  res.json({ success: true, data: c });
});

// Blacklist (deactivate) a contractor
export const blacklistContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const c = await User.findByIdAndUpdate(
    req.params.id,
    { active: false, contractorVerified: false },
    { new: true }
  );
  // Could log reason in audit log
  console.log(`Contractor ${c?.email} blacklisted by ${req.user!.email}. Reason: ${reason || 'N/A'}`);
  res.json({ success: true, data: c });
});

export const updateContractorProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fields = ['companyName', 'gstNumber', 'panNumber', 'registrationNumber', 'experienceYears', 'phone'];
  const update: any = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });
  const c = await User.findByIdAndUpdate(req.user!._id, update, { new: true });
  res.json({ success: true, data: c });
});
