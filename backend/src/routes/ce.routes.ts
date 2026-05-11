import { Router } from 'express';
import {
  ceDashboard, highValueApprovals, riskDashboard,
  engineerPerformance, financialMonitoring,
  projectMonitor, tenderOversight, approvalHistory,
} from '../controllers/ce.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('CE', 'DEPT_ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', ceDashboard);
router.get('/high-value-approvals', highValueApprovals);
router.get('/risk', riskDashboard);
router.get('/engineer-performance', engineerPerformance);
router.get('/financial', financialMonitoring);
router.get('/projects', projectMonitor);
router.get('/tenders', tenderOversight);
router.get('/approval-history', approvalHistory);

export default router;
