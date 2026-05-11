import { Router } from 'express';
import { contDashboard, earnings, myProjects } from '../controllers/cont.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('CONTRACTOR', 'SUPER_ADMIN'));

router.get('/dashboard', contDashboard);
router.get('/earnings', earnings);
router.get('/my-projects', myProjects);

export default router;
