import { Router } from 'express';
import {
  listMaterialRequests, createMaterialRequest, getMaterialRequest,
  approveMaterialRequest, rejectMaterialRequest, markDelivered,
} from '../controllers/materialRequest.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.route('/')
  .get(listMaterialRequests)
  .post(authorize('CONTRACTOR', 'JE', 'SDO'), createMaterialRequest);

router.get('/:id', getMaterialRequest);
router.put('/:id/approve', authorize('EE', 'SDO', 'DEPT_ADMIN'), approveMaterialRequest);
router.put('/:id/reject', authorize('EE', 'SDO', 'DEPT_ADMIN'), rejectMaterialRequest);
router.put('/:id/delivered', authorize('CONTRACTOR', 'JE', 'SDO', 'EE'), markDelivered);

export default router;
