import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Milestone from '../models/Milestone';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

// Create milestones for a project
export const createMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const m = await Milestone.create({ ...req.body, updatedBy: req.user!._id });
  res.status(201).json({ success: true, data: m });
});

export const listMilestones = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const items = await Milestone.find({ project: projectId }).sort({ plannedStartDate: 1 });
  res.json({ success: true, count: items.length, data: items });
});

export const updateMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const m = await Milestone.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user!._id },
    { new: true }
  );
  if (!m) { res.status(404); throw new Error('Milestone not found'); }

  // Recalculate project overall progress as average
  const all = await Milestone.find({ project: m.project });
  const avg = all.reduce((s, x) => s + x.progress, 0) / (all.length || 1);
  await Project.findByIdAndUpdate(m.project, {
    overallProgress: Math.round(avg),
    status: avg === 100 ? 'COMPLETED' : 'IN_PROGRESS',
  });

  res.json({ success: true, data: m });
});

export const deleteMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Milestone.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
