import { Router } from 'express';
import {
  listDivisions, createDivision, getDivision, updateDivision, toggleDivision,
} from '../controllers/division.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .get(listDivisions)
  .post(authorize('DEPT_ADMIN', 'SUPER_ADMIN'), createDivision);

router.route('/:id')
  .get(getDivision)
  .put(authorize('DEPT_ADMIN', 'SUPER_ADMIN'), updateDivision);

router.put('/:id/toggle', authorize('DEPT_ADMIN', 'SUPER_ADMIN'), toggleDivision);

export default router;
