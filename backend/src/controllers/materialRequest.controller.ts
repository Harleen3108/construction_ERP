import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import MaterialRequest from '../models/MaterialRequest';
import { AuthRequest } from '../middleware/auth';

const deptScope = (req: AuthRequest) => {
  if (req.user!.role === 'SUPER_ADMIN') return {};
  return {}; // MaterialRequest doesn't have department field — scoped via project
};

export const listMaterialRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, project } = req.query;
  const q: any = { ...deptScope(req) };
  if (status) q.status = status;
  if (project) q.project = project;
  if (req.user!.role === 'CONTRACTOR') q.contractor = req.user!._id;

  const items = await MaterialRequest.find(q)
    .populate('project', 'name location')
    .populate('requestedBy', 'name role')
    .populate('approvedBy', 'name role')
    .populate('contractor', 'name companyName')
    .sort({ createdAt: -1 });

  const counts = {
    pending: await MaterialRequest.countDocuments({ status: 'PENDING' }),
    approved: await MaterialRequest.countDocuments({ status: 'APPROVED' }),
    rejected: await MaterialRequest.countDocuments({ status: 'REJECTED' }),
    delivered: await MaterialRequest.countDocuments({ status: 'DELIVERED' }),
  };
  res.json({ success: true, count: items.length, counts, data: items });
});

export const createMaterialRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const r = await MaterialRequest.create({
    ...req.body,
    requestedBy: req.user!._id,
    contractor: req.body.contractor || req.user!._id,
    status: 'PENDING',
  });
  res.status(201).json({ success: true, data: r });
});

export const getMaterialRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const r = await MaterialRequest.findById(req.params.id)
    .populate('project', 'name location')
    .populate('requestedBy approvedBy contractor', 'name role companyName');
  if (!r) { res.status(404); throw new Error('Not found'); }
  res.json({ success: true, data: r });
});

export const approveMaterialRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  const r = await MaterialRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'APPROVED', approvedBy: req.user!._id, approvedAt: new Date(), remarks },
    { new: true }
  );
  res.json({ success: true, data: r });
});

export const rejectMaterialRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  const r = await MaterialRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'REJECTED', approvedBy: req.user!._id, approvedAt: new Date(), remarks },
    { new: true }
  );
  res.json({ success: true, data: r });
});

export const markDelivered = asyncHandler(async (req: AuthRequest, res: Response) => {
  const r = await MaterialRequest.findByIdAndUpdate(req.params.id, { status: 'DELIVERED' }, { new: true });
  res.json({ success: true, data: r });
});
