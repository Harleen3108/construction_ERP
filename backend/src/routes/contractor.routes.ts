import { Router } from 'express';
import { listContractors, getContractor, updateContractorProfile } from '../controllers/contractor.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.get('/', listContractors);
router.get('/:id', getContractor);
router.put('/profile/me', authorize('CONTRACTOR'), updateContractorProfile);

export default router;
