import { Router } from 'express';
import {
  createProject, listProjects, getProject, updateProject,
  updateProgress, completeProject, deleteProject,
} from '../controllers/project.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .post(authorize('JE', 'DEPT_ADMIN'), createProject)
  .get(listProjects);

router.route('/:id')
  .get(getProject)
  .put(authorize('JE', 'EE', 'CE', 'DEPT_ADMIN'), updateProject)
  .delete(authorize('JE', 'DEPT_ADMIN'), deleteProject);

router.put('/:id/progress', authorize('JE', 'EE', 'DEPT_ADMIN'), updateProgress);
router.put('/:id/complete', authorize('EE', 'CE', 'DEPT_ADMIN'), completeProject);

export default router;
