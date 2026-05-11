import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import User, { UserRole, IPermissions } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Scope user queries to department (Super Admin sees all)
const deptFilter = (req: AuthRequest) => {
  if (req.user!.role === 'SUPER_ADMIN') return {};
  return { department: req.user!.department };
};

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, search } = req.query;
  const q: any = { ...deptFilter(req) };
  if (role) q.role = role;
  if (search) q.$or = [
    { name: new RegExp(search as string, 'i') },
    { email: new RegExp(search as string, 'i') },
    { companyName: new RegExp(search as string, 'i') },
  ];
  const users = await User.find(q).populate('department', 'name code').sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id).populate('department', 'name code');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

// Department Admin creates users for their department
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name, email, password, role, phone, designation, employeeId,
    companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  } = req.body;

  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already exists');
  }

  // Department admins can only create non-super-admin users in their own department
  if (req.user!.role === 'DEPT_ADMIN' && (role === 'SUPER_ADMIN')) {
    res.status(403);
    throw new Error('Cannot create Super Admin');
  }

  const department = req.user!.role === 'SUPER_ADMIN'
    ? req.body.department
    : req.user!.department;

  const user = await User.create({
    name, email, password, role: role as UserRole,
    department, phone, designation, employeeId,
    companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  });
  res.status(201).json({ success: true, data: user });
});

export const verifyContractor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { contractorVerified: true, active: true },
    { new: true }
  );
  res.json({ success: true, data: user });
});

export const toggleUserActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const u = await User.findById(req.params.id);
  if (!u) { res.status(404); throw new Error('Not found'); }
  u.active = !u.active;
  await u.save();
  res.json({ success: true, data: u });
});

// Department Admin overrides default permissions per user
export const updatePermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const perms = req.body as IPermissions;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { permissions: perms },
    { new: true }
  );
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});
