import express from 'express';
import authRoutes from './authRoutes';

/**
 * Main Router
 * @description Central router that aggregates all API routes
 */
const router = express.Router();

/**
 * Authentication Routes
 * @route /api/v1/auth/*
 */
router.use('/auth', authRoutes);

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
