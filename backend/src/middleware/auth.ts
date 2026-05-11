import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole, IPermissions } from '../models/User';
import Department from '../models/Department';

export interface AuthRequest extends Request {
  user?: IUser;
  deptScope?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.active) return res.status(403).json({ success: false, message: 'Account disabled' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Role-based authorization. SUPER_ADMIN always passes.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (req.user.role === 'SUPER_ADMIN') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' not permitted for this action`,
      });
    }
    next();
  };
};

/**
 * Permission-based authorization.
 */
export const checkPermission = (...perms: (keyof IPermissions)[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (req.user.role === 'SUPER_ADMIN') return next();
    const has = perms.some((p) => req.user!.permissions?.[p]);
    if (!has) {
      return res.status(403).json({
        success: false,
        message: `Missing required permission: ${perms.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * Multi-tenant scoping. Adds department filter for downstream queries.
 * SUPER_ADMIN sees everything; everyone else is scoped to their department.
 */
export const departmentScope = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.department) {
    req.deptScope = { department: req.user.department };
  } else {
    req.deptScope = {};
  }
  next();
};

/**
 * Module-gating: requires the user's department has the named module enabled.
 */
export const requireModule = (moduleName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (req.user.role === 'SUPER_ADMIN' || !req.user.department) return next();
    const dept = await Department.findById(req.user.department);
    if (!dept) return res.status(403).json({ success: false, message: 'Department not found' });
    if (!dept.enabledModules.includes(moduleName)) {
      return res.status(403).json({
        success: false,
        message: `Module '${moduleName}' is not enabled for your department`,
      });
    }
    next();
  };
};
