import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import AuditLog from '../models/AuditLog';

/**
 * Logs every mutating action (POST/PUT/PATCH/DELETE) by authenticated users.
 * Use as global middleware AFTER `protect` for protected routes.
 */
export const auditLogger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const original = res.json.bind(res);
  (res as any).json = (data: any) => {
    if (
      req.user &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      res.statusCode < 400
    ) {
      AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: `${req.method} ${req.originalUrl}`,
        entity: req.baseUrl.split('/').pop() || 'unknown',
        entityId: data?.data?._id || req.params?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { body: req.body, response: { success: data?.success } },
      }).catch((e) => console.error('[Audit] failed:', e.message));
    }
    return original(data);
  };
  next();
};
