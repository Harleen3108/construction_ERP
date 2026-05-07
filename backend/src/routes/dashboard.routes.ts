import { Router } from 'express';
import { myDashboard } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/me', myDashboard);

export default router;
