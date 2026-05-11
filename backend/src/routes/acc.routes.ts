import { Router } from 'express';
import {
  accDashboard, billVerificationQueue, deductionsReport,
  budgetMonitoring, contractorPayments,
} from '../controllers/acc.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('ACCOUNTANT', 'DEPT_ADMIN', 'CE', 'SUPER_ADMIN'));

router.get('/dashboard', accDashboard);
router.get('/bill-queue', billVerificationQueue);
router.get('/deductions', deductionsReport);
router.get('/budget', budgetMonitoring);
router.get('/contractor-payments', contractorPayments);

export default router;
