import { Router } from 'express';
import {
  createTender, listTenders, getTender,
  openBidding, closeBidding, updateTender,
} from '../controllers/tender.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .post(authorize('EE', 'CE', 'DEPT_ADMIN'), createTender)
  .get(listTenders);
router.route('/:id')
  .get(getTender)
  .put(authorize('EE', 'CE', 'DEPT_ADMIN'), updateTender);
router.put('/:id/open-bidding', authorize('EE', 'CE', 'DEPT_ADMIN'), openBidding);
router.put('/:id/close-bidding', authorize('EE', 'CE', 'DEPT_ADMIN'), closeBidding);

export default router;
