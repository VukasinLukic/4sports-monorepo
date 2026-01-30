import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getClubById } from '../controllers/clubController';

const router = express.Router();

/**
 * @route   GET /api/v1/clubs/:id
 * @desc    Get club by ID
 * @access  Protected
 */
router.get('/:id', protect, getClubById);

export default router;
