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
router.put('/:id/technical-evaluation', authorize('TENDER_OFFICER', 'EE', 'CE', 'ADMIN'), technicalEvaluation);
router.post('/financial-evaluation/:tenderId', authorize('TENDER_OFFICER', 'EE', 'CE', 'ADMIN'), financialEvaluation);
router.get('/tender/:tenderId', getBidsForTender);
router.get('/my', authorize('CONTRACTOR'), getMyBids);

export default router;
