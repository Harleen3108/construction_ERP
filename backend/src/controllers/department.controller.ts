import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Department from '../models/Department';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Project from '../models/Project';
import OrganizationRegistration from '../models/OrganizationRegistration';
import { AuthRequest } from '../middleware/auth';

// SUPER_ADMIN: list all departments
export const listDepartments = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const items = await Department.find().sort({ createdAt: -1 });
  // Annotate with stats
  const annotated = await Promise.all(
    items.map(async (d) => {
      const userCount = await User.countDocuments({ department: d._id });
      const projectCount = await Project.countDocuments({ department: d._id });
      const sub = await Subscription.findOne({ department: d._id, status: 'ACTIVE' }).sort({ endDate: -1 });
      return { ...d.toObject(), userCount, projectCount, subscription: sub };
    })
  );
  res.json({ success: true, count: annotated.length, data: annotated });
});

// SUPER_ADMIN: create new department
export const createDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, code, type, state, city, address, contactEmail, contactPhone, headOfDepartment, enabledModules } = req.body;

  if (await Department.findOne({ code: code?.toUpperCase() })) {
    res.status(400);
    throw new Error('Department code already exists');
  }

  const dept = await Department.create({
    name, code, type, state, city, address, contactEmail, contactPhone, headOfDepartment,
    enabledModules: enabledModules || ['etender', 'erp', 'finance', 'mb', 'reports'],
    status: 'TRIAL',
    createdBy: req.user!._id,
  });

  // Auto-create a 30-day trial subscription
  await Subscription.create({
    department: dept._id,
    plan: 'TRIAL',
    status: 'ACTIVE',
    billingCycle: 'YEARLY',
    amount: 0,
    modules: dept.enabledModules,
  });

  res.status(201).json({ success: true, data: dept });
});

export const getDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Department.findById(req.params.id);
  if (!d) { res.status(404); throw new Error('Department not found'); }
  const subscription = await Subscription.findOne({ department: d._id }).sort({ endDate: -1 });
  const userCount = await User.countDocuments({ department: d._id });
  const projectCount = await Project.countDocuments({ department: d._id });
  res.json({ success: true, data: { ...d.toObject(), subscription, userCount, projectCount } });
});

export const updateDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: d });
});

export const toggleDepartmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const d = await Department.findById(req.params.id);
  if (!d) { res.status(404); throw new Error('Not found'); }
  d.status = d.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  await d.save();
  res.json({ success: true, data: d });
});

// SUPER_ADMIN: hard delete a department + all related records (cascade)
export const deleteDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) { res.status(404); throw new Error('Department not found'); }

  const deptId = dept._id;

  // Cascade delete in safe order — child records first
  const [users, subs, regs, projects] = await Promise.all([
    User.deleteMany({ department: deptId }),
    Subscription.deleteMany({ department: deptId }),
    OrganizationRegistration.deleteMany({ department: deptId }),
    Project.deleteMany({ department: deptId }),
  ]);

  await Department.deleteOne({ _id: deptId });

  console.log(`[Department] Deleted "${dept.name}" (${dept.code}) — cascade: ${users.deletedCount} users, ${subs.deletedCount} subs, ${regs.deletedCount} registrations, ${projects.deletedCount} projects`);

  res.json({
    success: true,
    message: `Department "${dept.name}" and all related records deleted`,
    data: {
      department: dept.name,
      code: dept.code,
      deleted: {
        users: users.deletedCount,
        subscriptions: subs.deletedCount,
        registrations: regs.deletedCount,
        projects: projects.deletedCount,
      },
    },
  });
});

// Update enabled modules for a department
export const updateModules = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { modules } = req.body;
  const d = await Department.findByIdAndUpdate(
    req.params.id,
    { enabledModules: modules },
    { new: true }
  );
  res.json({ success: true, data: d });
});

// Get current user's department (Dept Admin uses this)
export const myDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user!.department) return res.json({ success: true, data: null });
  const d = await Department.findById(req.user!.department);
  const subscription = await Subscription.findOne({ department: d?._id, status: 'ACTIVE' }).sort({ endDate: -1 });
  const userCount = await User.countDocuments({ department: d?._id });
  const projectCount = await Project.countDocuments({ department: d?._id });
  res.json({ success: true, data: { ...d?.toObject(), subscription, userCount, projectCount } });
});
