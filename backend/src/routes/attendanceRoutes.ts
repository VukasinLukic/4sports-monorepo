import express from 'express';
import { markAttendance, getEventAttendance, getMemberAttendance, getMyAttendance, bulkMarkAttendance } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/mark', restrictTo(['OWNER', 'COACH']), markAttendance);
router.post('/bulk-mark', restrictTo(['OWNER', 'COACH']), bulkMarkAttendance);
router.get('/event/:eventId', getEventAttendance);
router.get('/me', restrictTo(['MEMBER']), getMyAttendance); // Member's own attendance
router.get('/member/:memberId', getMemberAttendance);

export default router;
