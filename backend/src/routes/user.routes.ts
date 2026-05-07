import { Router } from 'express';
import { listUsers, getUser, verifyContractor, toggleUserActive } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', authorize('ADMIN', 'CE', 'EE', 'TENDER_OFFICER'), listUsers);
router.get('/:id', listUsers);
router.put('/:id/verify', authorize('ADMIN'), verifyContractor);
router.put('/:id/toggle', authorize('ADMIN'), toggleUserActive);
router.get('/:id/details', getUser);

export default router;
