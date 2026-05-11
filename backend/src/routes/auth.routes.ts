import { Router } from 'express';
import {
  register, login, me, updateProfile,
  verifyToken, setPassword, forgotPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-token/:token', verifyToken);
router.post('/set-password', setPassword);

// Protected
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);

export default router;
