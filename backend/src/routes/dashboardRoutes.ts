import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = express.Router();

// Public route for dashboard stats (no auth required for now)
router.get('/', getDashboardStats);

export default router;
