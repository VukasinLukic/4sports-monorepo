import express from 'express';
import { markAttendance, getEventAttendance, getMemberAttendance, bulkMarkAttendance } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/mark', restrictTo(['OWNER', 'COACH']), markAttendance);
router.post('/bulk-mark', restrictTo(['OWNER', 'COACH']), bulkMarkAttendance);
router.get('/event/:eventId', getEventAttendance);
router.get('/member/:memberId', getMemberAttendance);

export default router;
