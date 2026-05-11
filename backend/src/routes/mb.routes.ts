import { Router } from 'express';
import { createMB, listMBs, getMB, updateMB } from '../controllers/mb.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.route('/')
  .post(authorize('JE', 'DEPT_ADMIN'), createMB)
  .get(listMBs);
router.route('/:id')
  .get(getMB)
  .put(authorize('JE', 'DEPT_ADMIN'), updateMB);

export default router;
