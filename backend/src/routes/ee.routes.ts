import { Router } from 'express';
import { eeDashboard, eeApprovalQueue, eeTeam } from '../controllers/ee.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('EE', 'DEPT_ADMIN', 'SUPER_ADMIN', 'CE'));

router.get('/dashboard', eeDashboard);
router.get('/approval-queue', eeApprovalQueue);
router.get('/team', eeTeam);

export default router;
