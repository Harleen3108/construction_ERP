import { Router } from 'express';
import {
  listInvoices, createInvoice, getInvoice, markPaid, cancelInvoice,
} from '../controllers/invoice.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .get(listInvoices)
  .post(authorize('SUPER_ADMIN'), createInvoice);

router.get('/:id', getInvoice);
router.put('/:id/paid', authorize('SUPER_ADMIN'), markPaid);
router.put('/:id/cancel', authorize('SUPER_ADMIN'), cancelInvoice);

export default router;
