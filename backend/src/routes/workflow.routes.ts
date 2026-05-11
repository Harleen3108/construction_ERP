import { Router } from 'express';
import { listWorkflows, updateWorkflow, resetWorkflow } from '../controllers/workflow.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', listWorkflows);
router.put('/:entityType', authorize('DEPT_ADMIN', 'SUPER_ADMIN'), updateWorkflow);
router.put('/:entityType/reset', authorize('DEPT_ADMIN', 'SUPER_ADMIN'), resetWorkflow);

export default router;
