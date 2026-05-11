import { Router } from 'express';
import { platformStats } from '../controllers/system.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect, authorize('SUPER_ADMIN'));
router.get('/stats', platformStats);

export default router;
