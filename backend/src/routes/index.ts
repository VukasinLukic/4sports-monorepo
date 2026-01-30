import express from 'express';
import authRoutes from './authRoutes';
import inviteRoutes from './inviteRoutes';
import groupRoutes from './groupRoutes';
import memberRoutes from './memberRoutes';
import eventRoutes from './eventRoutes';
import attendanceRoutes from './attendanceRoutes';
import paymentRoutes from './paymentRoutes';
import medicalCheckRoutes from './medicalCheckRoutes';
import financeRoutes from './financeRoutes';
import postRoutes from './postRoutes';
import notificationRoutes from './notificationRoutes';
import uploadRoutes from './uploadRoutes';
import dashboardRoutes from './dashboardRoutes';
import coachRoutes from './coachRoutes';
import settingsRoutes from './settingsRoutes';
import evidenceRoutes from './evidenceRoutes';
import clubRoutes from './clubRoutes';
import chatRoutes from './chatRoutes';

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
router.use('/payments', paymentRoutes);
router.use('/medical-checks', medicalCheckRoutes);
console.log('📦 Registering /finances routes...');
router.use('/finances', financeRoutes);
console.log('✅ /finances routes registered');
router.use('/posts', postRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/coaches', coachRoutes);
router.use('/settings', settingsRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/clubs', clubRoutes);
router.use('/chat', chatRoutes);

/**
 * Future Routes (Phase 3+)
 */
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
