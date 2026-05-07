import { Router } from 'express';
import {
  createTender, listTenders, getTender,
  openBidding, closeBidding, updateTender,
} from '../controllers/tender.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .post(authorize('TENDER_OFFICER', 'EE', 'ADMIN'), createTender)
  .get(listTenders);
router.route('/:id')
  .get(getTender)
  .put(authorize('TENDER_OFFICER', 'EE', 'ADMIN'), updateTender);
router.put('/:id/open-bidding', authorize('TENDER_OFFICER', 'EE', 'ADMIN'), openBidding);
router.put('/:id/close-bidding', authorize('TENDER_OFFICER', 'EE', 'ADMIN'), closeBidding);

export default router;
