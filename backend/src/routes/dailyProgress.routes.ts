import { Router } from 'express';
import {
  createDailyProgress, listDailyProgress, getDailyProgress, verifyDailyProgress,
} from '../controllers/dailyProgress.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .get(listDailyProgress)
  .post(authorize('JE', 'CONTRACTOR', 'DEPT_ADMIN'), createDailyProgress);

router.get('/:id', getDailyProgress);
router.put('/:id/verify', authorize('SDO', 'EE', 'DEPT_ADMIN'), verifyDailyProgress);

export default router;
