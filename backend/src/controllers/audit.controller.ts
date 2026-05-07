import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export const listAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { entity, entityId, user, from, to, limit = 200 } = req.query;
  const q: any = {};
  if (entity) q.entity = entity;
  if (entityId) q.entityId = entityId;
  if (user) q.user = user;
  if (from || to) {
    q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from as string);
    if (to) q.timestamp.$lte = new Date(to as string);
  }
  const logs = await AuditLog.find(q).sort({ timestamp: -1 }).limit(Number(limit));
  res.json({ success: true, count: logs.length, data: logs });
});

export const auditSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const total = await AuditLog.countDocuments();
  const last24h = await AuditLog.countDocuments({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  const byRole = await AuditLog.aggregate([
    { $group: { _id: '$userRole', count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: { total, last24h, byRole } });
});
