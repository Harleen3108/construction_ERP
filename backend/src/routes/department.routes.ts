import { Router } from 'express';
import {
  listDepartments, createDepartment, getDepartment,
  updateDepartment, toggleDepartmentStatus, updateModules, myDepartment,
} from '../controllers/department.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/me', myDepartment);
router.route('/')
  .get(authorize('SUPER_ADMIN'), listDepartments)
  .post(authorize('SUPER_ADMIN'), createDepartment);

router.route('/:id')
  .get(authorize('SUPER_ADMIN', 'DEPT_ADMIN'), getDepartment)
  .put(authorize('SUPER_ADMIN', 'DEPT_ADMIN'), updateDepartment);

router.put('/:id/toggle', authorize('SUPER_ADMIN'), toggleDepartmentStatus);
router.put('/:id/modules', authorize('SUPER_ADMIN'), updateModules);

export default router;
