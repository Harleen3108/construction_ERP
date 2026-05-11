import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Subscription from '../models/Subscription';
import Department from '../models/Department';
import { AuthRequest } from '../middleware/auth';

export const listSubscriptions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const items = await Subscription.find()
    .populate('department', 'name code type status')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { department, plan, billingCycle, amount, modules, maxUsers, maxProjects, startDate, endDate, notes } = req.body;

  // Mark previous active subscription as expired
  await Subscription.updateMany({ department, status: 'ACTIVE' }, { status: 'EXPIRED' });

  const sub = await Subscription.create({
    department, plan, billingCycle, amount, modules, maxUsers, maxProjects,
    startDate, endDate, notes, status: 'ACTIVE',
  });

  // Update department status & modules
  await Department.findByIdAndUpdate(department, {
    status: 'ACTIVE',
    enabledModules: modules,
  });

  res.status(201).json({ success: true, data: sub });
});

export const getSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = await Subscription.findById(req.params.id).populate('department');
  if (!s) { res.status(404); throw new Error('Not found'); }
  res.json({ success: true, data: s });
});

export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const s = await Subscription.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
  if (s) await Department.findByIdAndUpdate(s.department, { status: 'SUSPENDED' });
  res.json({ success: true, data: s });
});
