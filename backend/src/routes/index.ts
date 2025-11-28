import express from 'express';
import authRoutes from './authRoutes';
import inviteRoutes from './inviteRoutes';
import groupRoutes from './groupRoutes';
import memberRoutes from './memberRoutes';
import eventRoutes from './eventRoutes';
import attendanceRoutes from './attendanceRoutes';

/**
 * Main Router
 * @description Central router that aggregates all API routes
 */
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/groups', groupRoutes);
router.use('/members', memberRoutes);
router.use('/events', eventRoutes);
router.use('/attendance', attendanceRoutes);

/**
 * Future Routes (Phase 3+)
 */
// router.use('/clubs', clubRoutes);
// router.use('/users', userRoutes);
// router.use('/invites', inviteRoutes);
// router.use('/groups', groupRoutes);
// router.use('/members', memberRoutes);
// router.use('/events', eventRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/medical-checks', medicalRoutes);
// router.use('/finances', financeRoutes);
// router.use('/posts', postRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/upload', uploadRoutes);

export default router;
