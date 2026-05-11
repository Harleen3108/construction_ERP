import { Router } from 'express';
import {
  submitTechnicalBid, submitFinancialBid, technicalEvaluation,
  financialEvaluation, getBidsForTender, getMyBids,
} from '../controllers/bid.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.post('/technical', authorize('CONTRACTOR'), submitTechnicalBid);
router.put('/:id/financial', authorize('CONTRACTOR'), submitFinancialBid);
router.put('/:id/technical-evaluation', authorize('EE', 'CE', 'DEPT_ADMIN'), technicalEvaluation);
router.post('/financial-evaluation/:tenderId', authorize('EE', 'CE', 'DEPT_ADMIN'), financialEvaluation);
router.get('/tender/:tenderId', getBidsForTender);
router.get('/my', authorize('CONTRACTOR'), getMyBids);

export default router;
