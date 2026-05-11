import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Inspection from '../models/Inspection';
import { AuthRequest } from '../middleware/auth';

const deptFilter = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN' ? {} : { department: req.user!.department };

export const listInspections = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, type, project } = req.query;
  const q: any = { ...deptFilter(req) };
  if (status) q.status = status;
  if (type) q.type = type;
  if (project) q.project = project;

  const items = await Inspection.find(q)
    .populate('project', 'name location')
    .populate('inspector', 'name role')
    .sort({ scheduledDate: -1 });

  const counts = {
    scheduled: await Inspection.countDocuments({ ...deptFilter(req), status: 'SCHEDULED' }),
    completed: await Inspection.countDocuments({ ...deptFilter(req), status: 'COMPLETED' }),
    postponed: await Inspection.countDocuments({ ...deptFilter(req), status: 'POSTPONED' }),
    followUp: await Inspection.countDocuments({ ...deptFilter(req), followUpRequired: true }),
  };

  res.json({ success: true, count: items.length, counts, data: items });
});

export const createInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const insp = await Inspection.create({
    ...req.body,
    department: req.user!.department,
    inspector: req.body.inspector || req.user!._id,
  });
  res.status(201).json({ success: true, data: insp });
});

export const getInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const i = await Inspection.findById(req.params.id)
    .populate('project', 'name location estimatedCost')
    .populate('inspector', 'name role designation');
  if (!i) { res.status(404); throw new Error('Inspection not found'); }
  res.json({ success: true, data: i });
});

export const updateInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const i = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: i });
});

export const completeInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { findings, rating, recommendations, followUpRequired } = req.body;
  const i = await Inspection.findByIdAndUpdate(
    req.params.id,
    {
      status: 'COMPLETED',
      conductedDate: new Date(),
      findings, rating, recommendations,
      followUpRequired: !!followUpRequired,
    },
    { new: true }
  );
  res.json({ success: true, data: i });
});
