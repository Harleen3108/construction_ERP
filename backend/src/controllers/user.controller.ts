import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, search } = req.query;
  const q: any = {};
  if (role) q.role = role;
  if (search) q.$or = [
    { name: new RegExp(search as string, 'i') },
    { email: new RegExp(search as string, 'i') },
    { companyName: new RegExp(search as string, 'i') },
  ];
  const users = await User.find(q).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

export const verifyContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
  res.json({ success: true, data: user });
});

export const toggleUserActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const u = await User.findById(req.params.id);
  if (!u) { res.status(404); throw new Error('Not found'); }
  u.active = !u.active;
  await u.save();
  res.json({ success: true, data: u });
});
