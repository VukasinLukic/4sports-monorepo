import express from 'express';
import { getDashboardStats, getCoachDashboardStats } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public route for dashboard stats (no auth required for now)
router.get('/', getDashboardStats);

// Coach dashboard stats (requires auth)
router.get('/coach', protect, getCoachDashboardStats);

export default router;
