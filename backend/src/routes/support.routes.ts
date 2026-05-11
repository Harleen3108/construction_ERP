import { Router } from 'express';
import {
  listTickets, createTicket, getTicket, respondToTicket, updateTicketStatus,
} from '../controllers/support.controller';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.route('/').get(listTickets).post(createTicket);
router.get('/:id', getTicket);
router.post('/:id/respond', respondToTicket);
router.put('/:id/status', updateTicketStatus);

export default router;
