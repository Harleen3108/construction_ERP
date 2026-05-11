import { Router } from 'express';
import { jeDashboard, mySubmissions, myTasks, siteMonitoring, projectTimeline } from '../controllers/je.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('JE', 'SDO', 'EE', 'CE', 'DEPT_ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', jeDashboard);
router.get('/my-submissions', mySubmissions);
router.get('/my-tasks', myTasks);
router.get('/site-monitoring', siteMonitoring);
router.get('/project-timeline/:id', projectTimeline);

export default router;
