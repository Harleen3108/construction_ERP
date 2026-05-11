import { Router } from 'express';
import { releasePayment, listPayments, getPayment } from '../controllers/payment.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.post('/release', authorize('ACCOUNTANT', 'DEPT_ADMIN'), releasePayment);
router.get('/', listPayments);
router.get('/:id', getPayment);

export default router;
