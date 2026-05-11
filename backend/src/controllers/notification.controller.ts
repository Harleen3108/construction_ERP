import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const myNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { unread } = req.query;
  const q: any = { user: req.user!._id };
  if (unread === 'true') q.read = false;
  const items = await Notification.find(q).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user!._id, read: false });
  res.json({ success: true, count: items.length, unreadCount, data: items });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: n });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany(
    { user: req.user!._id, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ success: true });
});
