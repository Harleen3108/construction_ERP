import { Router } from 'express';
import { listAuditLogs, auditSummary } from '../controllers/audit.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', authorize('CE', 'EE', 'DEPT_ADMIN', 'ACCOUNTANT'), listAuditLogs);
router.get('/summary', authorize('CE', 'EE', 'DEPT_ADMIN'), auditSummary);

export default router;
