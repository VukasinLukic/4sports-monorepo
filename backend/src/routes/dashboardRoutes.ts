import express from 'express';
import { getDashboardStats, getCoachDashboardStats, getCoachDashboardV2 } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public route for dashboard stats (no auth required for now)
router.get('/', getDashboardStats);

// Coach dashboard stats (requires auth)
router.get('/coach', protect, getCoachDashboardStats);

// Coach dashboard V2 - comprehensive financial dashboard
router.get('/coach/v2', protect, getCoachDashboardV2);

export default router;
