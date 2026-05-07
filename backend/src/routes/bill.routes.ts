import { Router } from 'express';
import { createBill, listBills, getBill, calculateDeductions } from '../controllers/bill.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.post('/', authorize('CONTRACTOR'), createBill);
router.get('/', listBills);
router.get('/:id', getBill);
router.post('/calculate', calculateDeductions);

export default router;
