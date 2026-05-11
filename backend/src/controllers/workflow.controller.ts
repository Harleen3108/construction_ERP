import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import WorkflowConfig from '../models/WorkflowConfig';
import { AuthRequest } from '../middleware/auth';

// Default workflow templates (used as starter when dept has none configured)
const DEFAULT_WORKFLOWS = {
  PROJECT: [
    { stage: 'SDO', order: 1, required: true, notes: 'Site verification & technical review' },
    { stage: 'EE',  order: 2, required: true, notes: 'Engineering & estimation approval' },
    { stage: 'CE',  order: 3, required: true, notes: 'Final sanction' },
  ],
  TENDER: [
    { stage: 'EE', order: 1, required: true, notes: 'Tender preparation review' },
    { stage: 'CE', order: 2, required: true, notes: 'Publication approval' },
  ],
  MB: [
    { stage: 'SDO', order: 1, required: true, notes: 'Site measurement verification' },
    { stage: 'EE',  order: 2, required: true, notes: 'Final MB approval' },
  ],
  BILL: [
    { stage: 'JE',         order: 1, required: true, notes: 'Initial bill verification' },
    { stage: 'SDO',        order: 2, required: true, notes: 'Site & MB cross-check' },
    { stage: 'EE',         order: 3, required: true, notes: 'Engineering certification' },
    { stage: 'ACCOUNTANT', order: 4, required: true, notes: 'Deductions verification & payment release' },
  ],
  WORK_ORDER: [
    { stage: 'EE', order: 1, required: true, notes: 'Work order issuance' },
    { stage: 'CE', order: 2, required: false, thresholdMin: 50000000, notes: 'CE approval for orders >= 5 Cr' },
  ],
};

// List all workflows for the user's department (auto-creates defaults if missing)
export const listWorkflows = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) {
    return res.json({ success: true, data: [] });
  }
  const department = req.user!.department;

  const existing = await WorkflowConfig.find({ department });
  const types: any[] = ['PROJECT','TENDER','MB','BILL','WORK_ORDER'];

  // Seed defaults for any missing types
  for (const t of types) {
    if (!existing.find((w) => w.entityType === t)) {
      const created = await WorkflowConfig.create({
        department,
        entityType: t,
        steps: (DEFAULT_WORKFLOWS as any)[t],
        active: true,
        notifyOnEachStep: true,
      });
      existing.push(created);
    }
  }

  res.json({ success: true, count: existing.length, data: existing });
});

export const updateWorkflow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entityType } = req.params;
  const { steps, active, notifyOnEachStep, autoEscalateAfterDays } = req.body;

  const w = await WorkflowConfig.findOneAndUpdate(
    { department: req.user!.department, entityType: entityType.toUpperCase() },
    {
      steps,
      active,
      notifyOnEachStep,
      autoEscalateAfterDays,
      updatedBy: req.user!._id,
    },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: w });
});

export const resetWorkflow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entityType } = req.params;
  const def = (DEFAULT_WORKFLOWS as any)[entityType.toUpperCase()];
  if (!def) { res.status(400); throw new Error('Invalid workflow type'); }
  const w = await WorkflowConfig.findOneAndUpdate(
    { department: req.user!.department, entityType: entityType.toUpperCase() },
    { steps: def, updatedBy: req.user!._id },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: w });
});
