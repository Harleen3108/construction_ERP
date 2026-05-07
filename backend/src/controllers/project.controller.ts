import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Project from '../models/Project';
import Approval from '../models/Approval';
import { AuthRequest } from '../middleware/auth';
import { generateProjectId } from '../utils/generateId';

// Stage 1: JE creates a proposal
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.create({
    projectId: generateProjectId(),
    ...req.body,
    proposedBy: req.user!._id,
    status: 'PROPOSED',
  });

  // Create approval workflow: SDO → EE → CE
  const stages: ('SDO' | 'EE' | 'CE')[] = ['SDO', 'EE', 'CE'];
  const approvals = await Approval.insertMany(
    stages.map((stage, i) => ({
      entityType: 'PROJECT',
      entityId: project._id,
      stage,
      order: i + 1,
      status: 'PENDING',
    }))
  );
  project.approvals = approvals.map((a) => a._id) as any;
  project.status = 'UNDER_APPROVAL';
  await project.save();

  res.status(201).json({ success: true, data: project });
});

// Get all projects (filter by status, role)
export const listProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, search, mine } = req.query;
  const q: any = {};
  if (status) q.status = status;
  if (search) q.name = new RegExp(search as string, 'i');

  const role = req.user!.role;
  if (mine === 'true') {
    if (role === 'JE') q.proposedBy = req.user!._id;
    else if (role === 'CONTRACTOR') q.awardedTo = req.user!._id;
  }

  const projects = await Project.find(q)
    .populate('proposedBy', 'name email role')
    .populate('awardedTo', 'name companyName')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: projects.length, data: projects });
});

// Stage 1: get single project with full details
export const getProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id)
    .populate('proposedBy', 'name email role designation')
    .populate('awardedTo', 'name companyName email')
    .populate({
      path: 'approvals',
      populate: { path: 'approver', select: 'name role' },
    })
    .populate('tender')
    .populate('workOrder');
  if (!project) { res.status(404); throw new Error('Project not found'); }
  res.json({ success: true, data: project });
});

// Update project (only by proposer in DRAFT/PROPOSED state)
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }
  Object.assign(project, req.body);
  await project.save();
  res.json({ success: true, data: project });
});

// Stage 8: update overall progress
export const updateProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { progress } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { overallProgress: progress, status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS' },
    { new: true }
  );
  res.json({ success: true, data: project });
});

// Stage 12: complete project
export const completeProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { closureReport, finalCost, actualEndDate } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    {
      status: 'COMPLETED',
      closureReport,
      finalCost,
      actualEndDate: actualEndDate || new Date(),
      completedAt: new Date(),
      overallProgress: 100,
    },
    { new: true }
  );
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const p = await Project.findById(req.params.id);
  if (!p) { res.status(404); throw new Error('Not found'); }
  if (p.status !== 'PROPOSED' && p.status !== 'REJECTED') {
    res.status(400);
    throw new Error('Cannot delete projects past proposal stage');
  }
  await p.deleteOne();
  res.json({ success: true, message: 'Project deleted' });
});
