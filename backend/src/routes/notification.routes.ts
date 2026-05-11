import { Router } from 'express';
import { myNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', myNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

export default router;
