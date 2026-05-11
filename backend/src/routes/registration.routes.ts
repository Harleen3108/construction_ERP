import { Router } from 'express';
import {
  applyRegistration, listRegistrations, getRegistration,
  approveRegistration, rejectRegistration, resendActivation,
} from '../controllers/registration.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// PUBLIC
router.post('/apply', applyRegistration);

// SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));
router.get('/', listRegistrations);
router.get('/:id', getRegistration);
router.put('/:id/approve', approveRegistration);
router.put('/:id/reject', rejectRegistration);
router.post('/:id/resend-activation', resendActivation);

export default router;
