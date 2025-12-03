import express from 'express';
import { createEvent, getGroupEvents, getEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo(['OWNER', 'COACH']), createEvent);
router.get('/group/:groupId', getGroupEvents);
router.get('/:id', getEvent);
router.put('/:id', restrictTo(['OWNER', 'COACH']), updateEvent);
router.delete('/:id', restrictTo(['OWNER', 'COACH']), deleteEvent);

export default router;
