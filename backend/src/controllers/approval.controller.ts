import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Approval, { ApprovalEntity } from '../models/Approval';
import Project from '../models/Project';
import Tender from '../models/Tender';
import MeasurementBook from '../models/MeasurementBook';
import Bill from '../models/Bill';
import { AuthRequest } from '../middleware/auth';

const ROLE_TO_STAGE: Record<string, string[]> = {
  SDO: ['SDO'],
  EE: ['EE'],
  CE: ['CE'],
  ACCOUNTANT: ['ACCOUNTANT'],
  TREASURY: ['TREASURY'],
  ADMIN: ['SDO', 'EE', 'CE', 'ACCOUNTANT', 'TREASURY'],
};

// List pending approvals for the logged-in user's role
export const myPendingApprovals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stages = ROLE_TO_STAGE[req.user!.role] || [];
  if (!stages.length) return res.json({ success: true, data: [] });

  const all = await Approval.find({ stage: { $in: stages }, status: 'PENDING' })
    .sort({ createdAt: -1 })
    .lean();

  // For each approval, only include if all earlier-order approvals (same entity) are APPROVED
  const ready: any[] = [];
  for (const ap of all) {
    const earlier = await Approval.find({
      entityType: ap.entityType,
      entityId: ap.entityId,
      order: { $lt: ap.order },
    }).lean();
    const allEarlierApproved = earlier.every((e) => e.status === 'APPROVED');
    if (allEarlierApproved) {
      // Hydrate entity preview
      let entity: any = null;
      if (ap.entityType === 'PROJECT') entity = await Project.findById(ap.entityId).lean();
      if (ap.entityType === 'TENDER') entity = await Tender.findById(ap.entityId).lean();
      if (ap.entityType === 'MB') entity = await MeasurementBook.findById(ap.entityId).populate('project').lean();
      if (ap.entityType === 'BILL') entity = await Bill.findById(ap.entityId).populate('project').populate('contractor', 'name companyName').lean();
      ready.push({ ...ap, entity });
    }
  }

  res.json({ success: true, count: ready.length, data: ready });
});

// Approve / Reject
export const actOnApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { action, remarks } = req.body; // 'APPROVE' | 'REJECT' | 'RETURN'
  const approval = await Approval.findById(req.params.id);
  if (!approval) { res.status(404); throw new Error('Approval not found'); }
  if (approval.status !== 'PENDING') {
    res.status(400);
    throw new Error('Already processed');
  }

  // Permission: only role that matches stage can act
  const stages = ROLE_TO_STAGE[req.user!.role] || [];
  if (!stages.includes(approval.stage) && req.user!.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Not permitted to act on this approval');
  }

  approval.approver = req.user!._id;
  approval.approverName = req.user!.name;
  approval.approverRole = req.user!.role;
  approval.remarks = remarks;

  if (action === 'APPROVE') {
    approval.status = 'APPROVED';
    approval.approvedAt = new Date();
    await approval.save();

    // If all approvals approved → update entity status
    const allApprovals = await Approval.find({
      entityType: approval.entityType, entityId: approval.entityId,
    });
    const allDone = allApprovals.every((a) => a.status === 'APPROVED');
    if (allDone) {
      await onAllApproved(approval.entityType, approval.entityId.toString());
    }
  } else if (action === 'REJECT') {
    approval.status = 'REJECTED';
    approval.rejectedAt = new Date();
    await approval.save();
    await onRejected(approval.entityType, approval.entityId.toString());
  } else if (action === 'RETURN') {
    approval.status = 'RETURNED';
    await approval.save();
  }

  res.json({ success: true, data: approval });
});

async function onAllApproved(entityType: string, entityId: string) {
  if (entityType === 'PROJECT') {
    await Project.findByIdAndUpdate(entityId, {
      status: 'SANCTIONED',
      sanctionedAt: new Date(),
    });
  } else if (entityType === 'TENDER') {
    await Tender.findByIdAndUpdate(entityId, { status: 'PUBLISHED', publishDate: new Date() });
    const t = await Tender.findById(entityId);
    if (t) await Project.findByIdAndUpdate(t.project, { status: 'TENDER_PUBLISHED' });
  } else if (entityType === 'MB') {
    await MeasurementBook.findByIdAndUpdate(entityId, { status: 'EE_APPROVED', approvedAt: new Date() });
  } else if (entityType === 'BILL') {
    await Bill.findByIdAndUpdate(entityId, { status: 'TREASURY_PENDING' });
  }
}

async function onRejected(entityType: string, entityId: string) {
  if (entityType === 'PROJECT')
    await Project.findByIdAndUpdate(entityId, { status: 'REJECTED' });
  else if (entityType === 'TENDER')
    await Tender.findByIdAndUpdate(entityId, { status: 'CANCELLED' });
  else if (entityType === 'MB')
    await MeasurementBook.findByIdAndUpdate(entityId, { status: 'REJECTED' });
  else if (entityType === 'BILL')
    await Bill.findByIdAndUpdate(entityId, { status: 'REJECTED' });
}

// Get approvals for a specific entity (project/tender/bill/etc.)
export const getApprovalsForEntity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entityType, entityId } = req.params;
  const items = await Approval.find({
    entityType: entityType.toUpperCase() as ApprovalEntity, entityId,
  })
    .sort({ order: 1 })
    .populate('approver', 'name role designation');
  res.json({ success: true, data: items });
});
