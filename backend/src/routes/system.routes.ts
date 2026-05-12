import { Router } from 'express';
import { platformStats, emailDiagnostics, sendTestEmail } from '../controllers/system.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect, authorize('SUPER_ADMIN'));

router.get('/stats', platformStats);
router.get('/email-diagnostics', emailDiagnostics);
router.post('/test-email', sendTestEmail);

export default router;
