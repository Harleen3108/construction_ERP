import { Router } from 'express';
import {
  awardTender, listWorkOrders, getWorkOrder, acceptWorkOrder,
} from '../controllers/workOrder.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.post('/award/:tenderId', authorize('EE', 'CE', 'DEPT_ADMIN'), awardTender);
router.get('/', listWorkOrders);
router.get('/:id', getWorkOrder);
router.put('/:id/accept', authorize('CONTRACTOR'), acceptWorkOrder);

export default router;
