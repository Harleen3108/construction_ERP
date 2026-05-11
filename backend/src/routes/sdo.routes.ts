import { Router } from 'express';
import { sdoDashboard, sdoApprovalQueue, dailyProgressToVerify } from '../controllers/sdo.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('SDO', 'EE', 'CE', 'DEPT_ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', sdoDashboard);
router.get('/approval-queue', sdoApprovalQueue);
router.get('/daily-progress-to-verify', dailyProgressToVerify);

export default router;
