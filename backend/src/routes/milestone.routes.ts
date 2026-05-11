import { Router } from 'express';
import { createMilestone, listMilestones, updateMilestone, deleteMilestone } from '../controllers/milestone.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.post('/', authorize('JE', 'EE', 'CE', 'DEPT_ADMIN'), createMilestone);
router.get('/project/:projectId', listMilestones);
router.put('/:id', authorize('JE', 'EE', 'CE', 'CONTRACTOR', 'DEPT_ADMIN'), updateMilestone);
router.delete('/:id', authorize('EE', 'CE', 'DEPT_ADMIN'), deleteMilestone);

export default router;
