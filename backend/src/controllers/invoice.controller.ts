import { Response } from 'express';
import { customAlphabet } from 'nanoid';
import asyncHandler from '../utils/asyncHandler';
import Invoice from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

const numeric = customAlphabet('0123456789', 6);
const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${numeric()}`;

export const listInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN') q.department = req.user!.department;
  const items = await Invoice.find(q).populate('department', 'name code').sort({ createdAt: -1 });

  const summary = {
    total: items.reduce((s, i) => s + (i.total || 0), 0),
    paid: items.filter((i) => i.status === 'PAID').reduce((s, i) => s + (i.total || 0), 0),
    overdue: items.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + (i.total || 0), 0),
    pending: items.filter((i) => i.status === 'SENT').reduce((s, i) => s + (i.total || 0), 0),
  };
  res.json({ success: true, count: items.length, summary, data: items });
});

export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inv = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    ...req.body,
    total: 0, // recalculated in pre-save
  });
  res.status(201).json({ success: true, data: inv });
});

export const getInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inv = await Invoice.findById(req.params.id).populate('department subscription');
  if (!inv) { res.status(404); throw new Error('Invoice not found'); }
  res.json({ success: true, data: inv });
});

export const markPaid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { utrNumber, paymentMethod = 'BANK_TRANSFER' } = req.body;
  const inv = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: 'PAID', paidDate: new Date(), utrNumber, paymentMethod },
    { new: true }
  );
  res.json({ success: true, data: inv });
});

export const cancelInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inv = await Invoice.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
  res.json({ success: true, data: inv });
});
