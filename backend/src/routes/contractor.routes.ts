import { Router } from 'express';
import {
  listContractors, getContractor, getContractorPerformance,
  verifyContractor, blacklistContractor, updateContractorProfile,
} from '../controllers/contractor.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', listContractors);
router.put('/profile/me', authorize('CONTRACTOR'), updateContractorProfile);
router.get('/:id', getContractor);
router.get('/:id/performance', getContractorPerformance);
router.put('/:id/verify', authorize('DEPT_ADMIN', 'SUPER_ADMIN'), verifyContractor);
router.put('/:id/blacklist', authorize('DEPT_ADMIN', 'SUPER_ADMIN'), blacklistContractor);

export default router;
