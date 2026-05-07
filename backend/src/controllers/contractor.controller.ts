import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const listContractors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contractors = await User.find({ role: 'CONTRACTOR' }).sort({ createdAt: -1 });
  res.json({ success: true, count: contractors.length, data: contractors });
});

export const getContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const c = await User.findOne({ _id: req.params.id, role: 'CONTRACTOR' });
  if (!c) { res.status(404); throw new Error('Contractor not found'); }
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
