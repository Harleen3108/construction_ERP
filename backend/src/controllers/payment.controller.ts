import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Payment from '../models/Payment';
import Bill from '../models/Bill';
import { AuthRequest } from '../middleware/auth';
import { generatePaymentId } from '../utils/generateId';

// Stage 11: Treasury releases payment
export const releasePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { billId, paymentMode = 'RTGS', utrNumber, bankName, accountNumber, ifsc, remarks } = req.body;

  const bill = await Bill.findById(billId);
  if (!bill) { res.status(404); throw new Error('Bill not found'); }
  if (!['ACCOUNTS_VERIFIED', 'TREASURY_PENDING'].includes(bill.status)) {
    res.status(400); throw new Error('Bill is not ready for payment');
  }

  const pay = await Payment.create({
    paymentId: generatePaymentId(),
    department: bill.department,
    bill: bill._id,
    project: bill.project,
    contractor: bill.contractor,
    amount: bill.netPayable,
    paymentMode,
    utrNumber,
    bankName,
    accountNumber: accountNumber ? `XXXX${String(accountNumber).slice(-4)}` : undefined,
    ifsc,
    paymentDate: new Date(),
    status: 'RELEASED',
    releasedBy: req.user!._id,
    remarks,
  });

  bill.status = 'PAID';
  bill.payment = pay._id;
  await bill.save();

  res.status(201).json({ success: true, data: pay });
});

export const listPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'CONTRACTOR') {
    q.department = req.user!.department;
  }
  if (req.user!.role === 'CONTRACTOR') q.contractor = req.user!._id;
  const items = await Payment.find(q)
    .populate('bill', 'billNumber netPayable')
    .populate('project', 'name')
    .populate('contractor', 'name companyName')
    .sort({ paymentDate: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const p = await Payment.findById(req.params.id)
    .populate('bill')
    .populate('project', 'name location')
    .populate('contractor', 'name companyName email');
  if (!p) { res.status(404); throw new Error('Payment not found'); }
  res.json({ success: true, data: p });
});
