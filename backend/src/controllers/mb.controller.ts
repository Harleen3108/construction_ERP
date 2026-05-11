import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import MeasurementBook from '../models/MeasurementBook';
import Approval from '../models/Approval';
import { AuthRequest } from '../middleware/auth';
import { generateMBId } from '../utils/generateId';

// Stage 9: JE records measurements
export const createMB = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entries = [], ...rest } = req.body;
  const totalAmount = entries.reduce((s: number, e: any) => s + (e.amount || 0), 0);

  const mb = await MeasurementBook.create({
    mbId: generateMBId(),
    ...rest,
    department: req.user!.department,
    entries,
    totalAmount,
    recordedBy: req.user!._id,
    status: 'SUBMITTED',
  });

  // Approval workflow: SDO → EE
  const stages: ('SDO' | 'EE')[] = ['SDO', 'EE'];
  const approvals = await Approval.insertMany(
    stages.map((s, i) => ({
      department: req.user!.department,
      entityType: 'MB',
      entityId: mb._id,
      stage: s,
      order: i + 1,
      status: 'PENDING',
    }))
  );
  mb.approvals = approvals.map((a) => a._id) as any;
  await mb.save();

  res.status(201).json({ success: true, data: mb });
});

export const listMBs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectId, status } = req.query;
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'CONTRACTOR') {
    q.department = req.user!.department;
  }
  if (projectId) q.project = projectId;
  if (status) q.status = status;

  if (req.user!.role === 'JE') q.recordedBy = req.user!._id;
  if (req.user!.role === 'CONTRACTOR') q.contractor = req.user!._id;

  const items = await MeasurementBook.find(q)
    .populate('project', 'name location')
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const getMB = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mb = await MeasurementBook.findById(req.params.id)
    .populate('project')
    .populate('recordedBy', 'name role')
    .populate({ path: 'approvals', populate: { path: 'approver', select: 'name role' } });
  if (!mb) { res.status(404); throw new Error('MB not found'); }
  res.json({ success: true, data: mb });
});

export const updateMB = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mb = await MeasurementBook.findById(req.params.id);
  if (!mb) { res.status(404); throw new Error('MB not found'); }
  if (mb.status !== 'DRAFT' && mb.status !== 'SUBMITTED') {
    res.status(400); throw new Error('Cannot update MB after approval');
  }
  Object.assign(mb, req.body);
  if (req.body.entries) {
    mb.totalAmount = (req.body.entries as any[]).reduce((s, e) => s + (e.amount || 0), 0);
  }
  await mb.save();
  res.json({ success: true, data: mb });
});
