import { Router } from 'express';
import { deptStats, recentActivity } from '../controllers/dept.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('DEPT_ADMIN', 'CE', 'EE', 'SDO', 'JE', 'ACCOUNTANT'));

router.get('/stats', deptStats);
router.get('/activity', recentActivity);

export default router;
