import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import User, { UserRole } from '../models/User';
import generateToken from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';

// @desc Register a new user
// @route POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name, email, password, role, phone, designation, department,
    employeeId, companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  } = req.body;

  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const user = await User.create({
    name, email, password, role: role as UserRole, phone, designation,
    department, employeeId, companyName, gstNumber, panNumber, registrationNumber, experienceYears,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id.toString()),
    },
  });
});

// @desc Login
// @route POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.active) {
    res.status(403);
    throw new Error('Account is disabled');
  }
  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      companyName: user.companyName,
      avatar: user.avatar,
      token: generateToken(user._id.toString()),
    },
  });
});

// @desc Get current user
// @route GET /api/auth/me
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

// @desc Update profile
// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const fields = ['name', 'phone', 'designation', 'companyName', 'avatar'];
  const update: any = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });
  const user = await User.findByIdAndUpdate(req.user!._id, update, { new: true });
  res.json({ success: true, data: user });
});
