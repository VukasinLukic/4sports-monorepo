import express from 'express';
import { markAttendance, getEventAttendance, getMemberAttendance, getLastMemberAttendance, getMyAttendance, bulkMarkAttendance, checkIn } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/mark', restrictTo(['OWNER', 'COACH']), markAttendance);
router.post('/bulk-mark', restrictTo(['OWNER', 'COACH']), bulkMarkAttendance);
router.post('/check-in', restrictTo(['PARENT', 'MEMBER']), checkIn); // QR check-in for parents and members
router.get('/event/:eventId', getEventAttendance);
router.get('/me', restrictTo(['MEMBER']), getMyAttendance); // Member's own attendance
router.get('/member/:memberId/last', getLastMemberAttendance); // Last attendance for a member
router.get('/member/:memberId', getMemberAttendance);

export default router;
