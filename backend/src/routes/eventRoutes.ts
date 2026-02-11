import express from 'express';
import {
  createEvent,
  getClubEvents,
  getGroupEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  confirmAttendance,
  qrCheckin,
  getEventByQrCode,
  getUpcomingEvents,
  getMyEvents,
} from '../controllers/eventController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Events CRUD
router.post('/', restrictTo(['OWNER', 'COACH']), createEvent);
router.get('/', getClubEvents); // With optional ?groupId=&status=&from=&to= filters
router.get('/upcoming', getUpcomingEvents); // Upcoming events (all roles)
router.get('/me', restrictTo(['MEMBER']), getMyEvents); // Events for member's group
router.get('/group/:groupId', getGroupEvents);
router.get('/qr/:qrCode', getEventByQrCode);
router.get('/:id', getEvent);
router.put('/:id', restrictTo(['OWNER', 'COACH']), updateEvent);
router.delete('/:id', restrictTo(['OWNER', 'COACH']), deleteEvent);

// Participants & Attendance
router.get('/:id/participants', getEventParticipants);
router.post('/:id/confirm', confirmAttendance); // RSVP
router.post('/:id/checkin', qrCheckin); // QR Check-in

export default router;
