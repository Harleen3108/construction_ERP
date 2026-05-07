import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import WorkOrder from '../models/WorkOrder';
import Tender from '../models/Tender';
import Project from '../models/Project';
import Bid from '../models/Bid';
import { AuthRequest } from '../middleware/auth';
import { generateWorkOrderId, generateLOAId } from '../utils/generateId';

// Stage 7: Award tender to L1 → generate LOA + Work Order
export const awardTender = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tenderId } = req.params;
  const { startDate, endDate, durationDays, remarks } = req.body;

  const tender = await Tender.findById(tenderId);
  if (!tender || !tender.l1Bid) {
    res.status(400); throw new Error('Tender or L1 bid not identified');
  }
  const l1 = await Bid.findById(tender.l1Bid);
  if (!l1) { res.status(404); throw new Error('L1 bid missing'); }

  const wo = await WorkOrder.create({
    workOrderId: generateWorkOrderId(),
    loaId: generateLOAId(),
    project: tender.project,
    tender: tender._id,
    contractor: l1.contractor,
    contractorName: l1.contractorName,
    awardedAmount: l1.quotedAmount,
    startDate,
    endDate,
    durationDays,
    issuedBy: req.user!._id,
    remarks,
  });

  // Update bid → AWARDED
  l1.status = 'AWARDED';
  await l1.save();

  // Update tender → AWARDED
  tender.status = 'AWARDED';
  tender.awardedTo = l1.contractor;
  tender.awardedAmount = l1.quotedAmount;
  tender.awardedAt = new Date();
  await tender.save();

  // Update project → AWARDED + active
  await Project.findByIdAndUpdate(tender.project, {
    status: 'AWARDED',
    awardedTo: l1.contractor,
    awardedAmount: l1.quotedAmount,
    workOrder: wo._id,
    awardedAt: new Date(),
    startDate,
    endDate,
  });

  res.status(201).json({ success: true, data: wo });
});

export const listWorkOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q: any = {};
  if (req.user!.role === 'CONTRACTOR') q.contractor = req.user!._id;
  const wos = await WorkOrder.find(q)
    .populate('project', 'name location')
    .populate('contractor', 'name companyName')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: wos.length, data: wos });
});

export const getWorkOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wo = await WorkOrder.findById(req.params.id)
    .populate('project')
    .populate('tender')
    .populate('contractor', 'name companyName email phone gstNumber panNumber');
  if (!wo) { res.status(404); throw new Error('Work order not found'); }
  res.json({ success: true, data: wo });
});

export const acceptWorkOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wo = await WorkOrder.findById(req.params.id);
  if (!wo) { res.status(404); throw new Error('Not found'); }
  if (wo.contractor.toString() !== req.user!._id.toString()) {
    res.status(403); throw new Error('Not your work order');
  }
  wo.acceptedByContractor = true;
  wo.acceptedAt = new Date();
  await wo.save();

  // start project execution
  await Project.findByIdAndUpdate(wo.project, { status: 'IN_PROGRESS' });
  res.json({ success: true, data: wo });
});
