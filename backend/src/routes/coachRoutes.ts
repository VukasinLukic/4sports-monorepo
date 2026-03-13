import express from 'express';
import { getCoaches, getCoach } from '../controllers/coachController';
import { getCoachStats } from '../controllers/coachStatsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.get('/', protect, getCoaches);
router.get('/:id/stats', protect, getCoachStats);
router.get('/:id', protect, getCoach);

export default router;
