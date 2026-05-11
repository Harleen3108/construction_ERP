import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Bill from '../models/Bill';
import MeasurementBook from '../models/MeasurementBook';
import Project from '../models/Project';
import Approval from '../models/Approval';
import { AuthRequest } from '../middleware/auth';
import { generateBillId } from '../utils/generateId';

// Stage 10: Contractor raises bill against approved MBs
export const createBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    project, workOrder, measurementBooks = [],
    gstPercent, tdsPercent, securityPercent, retentionPercent, otherDeductions = 0,
    billType = 'RA_BILL', remarks,
  } = req.body;

  // Validate MBs are EE_APPROVED
  const mbs = await MeasurementBook.find({ _id: { $in: measurementBooks }, status: 'EE_APPROVED' });
  if (mbs.length !== measurementBooks.length) {
    res.status(400); throw new Error('All MBs must be EE-approved before billing');
  }
  const grossAmount = mbs.reduce((s, m) => s + (m.totalAmount || 0), 0);

  // Sum previous bills already PAID for the same project
  const previousBills = await Bill.find({
    project, contractor: req.user!._id, status: { $in: ['PAID', 'TREASURY_PENDING', 'ACCOUNTS_VERIFIED'] },
  });
  const previousBillsTotal = previousBills.reduce((s, b) => s + (b.currentBillAmount || 0), 0);
  const currentBillAmount = grossAmount - previousBillsTotal;
  const billNumber = `RA Bill ${previousBills.length + 1}`;

  const projDoc = await Project.findById(project);
  const department = projDoc?.department;

  const bill = await Bill.create({
    billId: generateBillId(),
    billNumber,
    billType,
    department,
    project,
    workOrder,
    contractor: req.user!._id,
    measurementBooks,
    grossAmount,
    previousBillsTotal,
    currentBillAmount,
    gstPercent: gstPercent ?? Number(process.env.GST_PERCENT || 18),
    tdsPercent: tdsPercent ?? Number(process.env.TDS_PERCENT || 1),
    securityPercent: securityPercent ?? Number(process.env.SECURITY_PERCENT || 5),
    retentionPercent: retentionPercent ?? Number(process.env.RETENTION_PERCENT || 0),
    otherDeductions,
    remarks,
    netPayable: 0,
    status: 'SUBMITTED',
    submittedAt: new Date(),
  });

  // Approval workflow: JE → SDO → EE → ACCOUNTANT
  const stages: ('JE' | 'SDO' | 'EE' | 'ACCOUNTANT')[] = ['JE', 'SDO', 'EE', 'ACCOUNTANT'];
  const approvals = await Approval.insertMany(
    stages.map((s, i) => ({
      department,
      entityType: 'BILL',
      entityId: bill._id,
      stage: s,
      order: i + 1,
      status: 'PENDING',
    }))
  );
  bill.approvals = approvals.map((a) => a._id) as any;
  await bill.save();

  res.status(201).json({ success: true, data: bill });
});

export const listBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectId, status } = req.query;
  const q: any = {};
  if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'CONTRACTOR') {
    q.department = req.user!.department;
  }
  if (projectId) q.project = projectId;
  if (status) q.status = status;
  if (req.user!.role === 'CONTRACTOR') q.contractor = req.user!._id;
  const items = await Bill.find(q)
    .populate('project', 'name')
    .populate('contractor', 'name companyName')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

export const getBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bill = await Bill.findById(req.params.id)
    .populate('project', 'name location')
    .populate('contractor', 'name companyName email')
    .populate('measurementBooks')
    .populate({ path: 'approvals', populate: { path: 'approver', select: 'name role' } })
    .populate('payment');
  if (!bill) { res.status(404); throw new Error('Bill not found'); }
  res.json({ success: true, data: bill });
});

// Helper for live preview (no DB write)
export const calculateDeductions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentBillAmount, gstPercent = 18, tdsPercent = 1, securityPercent = 5, retentionPercent = 0, otherDeductions = 0 } = req.body;
  const gst = (currentBillAmount * gstPercent) / 100;
  const tds = (currentBillAmount * tdsPercent) / 100;
  const sec = (currentBillAmount * securityPercent) / 100;
  const ret = (currentBillAmount * retentionPercent) / 100;
  const totalDeductions = gst + tds + sec + ret + otherDeductions;
  res.json({
    success: true,
    data: {
      currentBillAmount,
      gstAmount: gst, tdsAmount: tds, securityAmount: sec, retentionAmount: ret,
      otherDeductions, totalDeductions,
      netPayable: currentBillAmount - totalDeductions,
    },
  });
});
