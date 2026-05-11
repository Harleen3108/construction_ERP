import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import DailyProgress from '../models/DailyProgress';
import { AuthRequest } from '../middleware/auth';

export const createDailyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dp = await DailyProgress.create({
    ...req.body,
    department: req.user!.department,
    recordedBy: req.user!._id,
  });
  res.status(201).json({ success: true, data: dp });
});

export const listDailyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { project } = req.query;
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN') q.department = req.user!.department;
  if (project) q.project = project;
  const items = await DailyProgress.find(q)
    .populate('project', 'name location')
    .populate('recordedBy', 'name role')
    .populate('verifiedBy', 'name role')
    .sort({ reportDate: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const getDailyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dp = await DailyProgress.findById(req.params.id)
    .populate('project')
    .populate('recordedBy', 'name role')
    .populate('verifiedBy', 'name role');
  if (!dp) { res.status(404); throw new Error('Not found'); }
  res.json({ success: true, data: dp });
});

export const verifyDailyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dp = await DailyProgress.findByIdAndUpdate(
    req.params.id,
    { verifiedBy: req.user!._id, verifiedAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: dp });
});
