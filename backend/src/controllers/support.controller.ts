import { Response } from 'express';
import { customAlphabet } from 'nanoid';
import asyncHandler from '../utils/asyncHandler';
import SupportTicket from '../models/SupportTicket';
import { AuthRequest } from '../middleware/auth';

const numeric = customAlphabet('0123456789', 5);
const generateTicketId = () => `TKT-${new Date().getFullYear()}-${numeric()}`;

export const listTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN') {
    if (req.user!.department) q.department = req.user!.department;
    else q.raisedBy = req.user!._id;
  }
  if (req.query.status) q.status = req.query.status;
  if (req.query.priority) q.priority = req.query.priority;

  const items = await SupportTicket.find(q)
    .populate('raisedBy', 'name email role')
    .populate('department', 'name code')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });

  const counts = {
    open: await SupportTicket.countDocuments({ ...q, status: 'OPEN' }),
    inProgress: await SupportTicket.countDocuments({ ...q, status: 'IN_PROGRESS' }),
    resolved: await SupportTicket.countDocuments({ ...q, status: 'RESOLVED' }),
    critical: await SupportTicket.countDocuments({ ...q, priority: 'CRITICAL', status: { $ne: 'CLOSED' } }),
  };
  res.json({ success: true, count: items.length, counts, data: items });
});

export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const t = await SupportTicket.create({
    ticketId: generateTicketId(),
    ...req.body,
    raisedBy: req.user!._id,
    department: req.user!.department,
    status: 'OPEN',
  });
  res.status(201).json({ success: true, data: t });
});

export const getTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const t = await SupportTicket.findById(req.params.id)
    .populate('raisedBy', 'name email role')
    .populate('department', 'name code')
    .populate('assignedTo', 'name')
    .populate('responses.by', 'name role');
  if (!t) { res.status(404); throw new Error('Ticket not found'); }
  res.json({ success: true, data: t });
});

export const respondToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const t = await SupportTicket.findById(req.params.id);
  if (!t) { res.status(404); throw new Error('Not found'); }
  t.responses.push({ by: req.user!._id, message, at: new Date() });
  if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
  await t.save();
  res.json({ success: true, data: t });
});

export const updateTicketStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, assignedTo } = req.body;
  const update: any = { status };
  if (status === 'RESOLVED') update.resolvedAt = new Date();
  if (assignedTo) update.assignedTo = assignedTo;
  const t = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, data: t });
});
