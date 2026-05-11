import { Router } from 'express';
import { listUsers, getUser, verifyContractor, toggleUserActive, createUser, updatePermissions } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', authorize('DEPT_ADMIN', 'CE', 'EE'), listUsers);
router.post('/', authorize('DEPT_ADMIN'), createUser);
router.get('/:id', getUser);
router.put('/:id/verify', authorize('DEPT_ADMIN'), verifyContractor);
router.put('/:id/toggle', authorize('DEPT_ADMIN'), toggleUserActive);
router.put('/:id/permissions', authorize('DEPT_ADMIN'), updatePermissions);

export default router;
