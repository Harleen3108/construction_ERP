import { Router } from 'express';
import { createMilestone, listMilestones, updateMilestone, deleteMilestone } from '../controllers/milestone.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.post('/', authorize('JE', 'EE', 'CE', 'ADMIN'), createMilestone);
router.get('/project/:projectId', listMilestones);
router.put('/:id', authorize('JE', 'EE', 'CE', 'CONTRACTOR', 'ADMIN'), updateMilestone);
router.delete('/:id', authorize('EE', 'CE', 'ADMIN'), deleteMilestone);

export default router;
