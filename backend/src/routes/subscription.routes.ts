import { Router } from 'express';
import {
  listSubscriptions, createSubscription, getSubscription, cancelSubscription,
} from '../controllers/subscription.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.route('/').get(listSubscriptions).post(createSubscription);
router.route('/:id').get(getSubscription);
router.put('/:id/cancel', cancelSubscription);

export default router;
