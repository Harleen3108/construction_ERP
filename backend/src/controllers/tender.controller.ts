import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Tender from '../models/Tender';
import Project from '../models/Project';
import Approval from '../models/Approval';
import { AuthRequest } from '../middleware/auth';
import { generateTenderId } from '../utils/generateId';

// Stage 3: Create tender (only after project SANCTIONED)
export const createTender = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { project: projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) { res.status(404); throw new Error('Project not found'); }
  if (project.status !== 'SANCTIONED' && project.status !== 'TENDER_CREATED') {
    res.status(400);
    throw new Error('Project is not sanctioned yet');
  }

  const tender = await Tender.create({
    tenderId: generateTenderId(),
    ...req.body,
    title: req.body.title || `Tender for ${project.name}`,
    createdBy: req.user!._id,
    status: 'DRAFT',
  });

  // Tender approval workflow: EE → CE
  const stages: ('EE' | 'CE')[] = ['EE', 'CE'];
  const approvals = await Approval.insertMany(
    stages.map((stage, i) => ({
      entityType: 'TENDER',
      entityId: tender._id,
      stage,
      order: i + 1,
      status: 'PENDING',
    }))
  );
  tender.approvals = approvals.map((a) => a._id) as any;
  tender.status = 'UNDER_APPROVAL';
  await tender.save();

  project.tender = tender._id;
  project.status = 'TENDER_CREATED';
  await project.save();

  res.status(201).json({ success: true, data: tender });
});

export const listTenders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, search } = req.query;
  const q: any = {};
  if (status) q.status = status;
  if (search) q.title = new RegExp(search as string, 'i');

  // Contractors only see PUBLISHED / BIDDING_OPEN / BIDDING_CLOSED tenders
  if (req.user!.role === 'CONTRACTOR') {
    q.status = { $in: ['PUBLISHED', 'BIDDING_OPEN', 'BIDDING_CLOSED', 'EVALUATION', 'AWARDED'] };
  }

  const tenders = await Tender.find(q)
    .populate('project', 'name location estimatedCost')
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: tenders.length, data: tenders });
});

export const getTender = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tender = await Tender.findById(req.params.id)
    .populate('project')
    .populate('createdBy', 'name email role')
    .populate({ path: 'approvals', populate: { path: 'approver', select: 'name role' } })
    .populate({ path: 'bids', populate: { path: 'contractor', select: 'name companyName email' } })
    .populate('l1Bid');
  if (!tender) { res.status(404); throw new Error('Tender not found'); }
  res.json({ success: true, data: tender });
});

// Stage 5: Open tender for bidding (after publish, on bid start date)
export const openBidding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tender = await Tender.findByIdAndUpdate(
    req.params.id,
    { status: 'BIDDING_OPEN' },
    { new: true }
  );
  if (tender) await Project.findByIdAndUpdate(tender.project, { status: 'BIDDING_OPEN' });
  res.json({ success: true, data: tender });
});

// Close bidding manually
export const closeBidding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tender = await Tender.findByIdAndUpdate(
    req.params.id,
    { status: 'BIDDING_CLOSED' },
    { new: true }
  );
  if (tender) await Project.findByIdAndUpdate(tender.project, { status: 'BID_EVALUATION' });
  res.json({ success: true, data: tender });
});

export const updateTender = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: tender });
});
