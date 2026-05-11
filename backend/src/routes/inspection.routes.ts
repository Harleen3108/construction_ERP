import { Router } from 'express';
import {
  listInspections, createInspection, getInspection,
  updateInspection, completeInspection,
} from '../controllers/inspection.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .get(listInspections)
  .post(authorize('CE', 'EE', 'SDO', 'DEPT_ADMIN'), createInspection);

router.route('/:id')
  .get(getInspection)
  .put(authorize('CE', 'EE', 'SDO', 'DEPT_ADMIN'), updateInspection);

router.put('/:id/complete', authorize('CE', 'EE', 'SDO', 'DEPT_ADMIN'), completeInspection);

export default router;
