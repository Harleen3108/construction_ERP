import { Router } from 'express';
import { myPendingApprovals, actOnApproval, getApprovalsForEntity } from '../controllers/approval.controller';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/pending', myPendingApprovals);
router.put('/:id/action', actOnApproval);
router.get('/entity/:entityType/:entityId', getApprovalsForEntity);

export default router;
