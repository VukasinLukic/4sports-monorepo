import express from 'express';
import { getCoaches, getCoach } from '../controllers/coachController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.get('/', protect, getCoaches);
router.get('/:id', protect, getCoach);

export default router;
