import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Division from '../models/Division';
import { AuthRequest } from '../middleware/auth';

const deptFilter = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN' ? {} : { department: req.user!.department };

export const listDivisions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await Division.find(deptFilter(req))
    .populate('inCharge', 'name role designation')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const createDivision = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (await Division.findOne({ department: req.user!.department, code: req.body.code?.toUpperCase() })) {
    res.status(400);
    throw new Error('Division code already exists in your department');
  }
  const div = await Division.create({
    ...req.body,
    department: req.user!.department,
  });
  res.status(201).json({ success: true, data: div });
});

export const getDivision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Division.findById(req.params.id).populate('inCharge department');
  if (!d) { res.status(404); throw new Error('Division not found'); }
  res.json({ success: true, data: d });
});

export const updateDivision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Division.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: d });
});

export const toggleDivision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Division.findById(req.params.id);
  if (!d) { res.status(404); throw new Error('Not found'); }
  d.active = !d.active;
  await d.save();
  res.json({ success: true, data: d });
});
