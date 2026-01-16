import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getClubSettings,
  updateClubSettings,
  getUserProfile,
  updateUserProfile,
  getSubscription,
} from '../controllers/settingsController';

const router = express.Router();

// ============================================
// CLUB SETTINGS ROUTES
// ============================================

/**
 * @route   GET /api/v1/settings/club
 * @desc    Get club settings
 * @access  Protected (OWNER, COACH)
 */
router.get('/club', protect, getClubSettings);

/**
 * @route   PUT /api/v1/settings/club
 * @desc    Update club settings
 * @access  Protected (OWNER only)
 */
router.put('/club', protect, updateClubSettings);

// ============================================
// USER PROFILE ROUTES
// ============================================

/**
 * @route   GET /api/v1/settings/profile
 * @desc    Get user profile
 * @access  Protected
 */
router.get('/profile', protect, getUserProfile);

/**
 * @route   PUT /api/v1/settings/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put('/profile', protect, updateUserProfile);

// ============================================
// SUBSCRIPTION ROUTES
// ============================================

/**
 * @route   GET /api/v1/settings/subscription
 * @desc    Get subscription details
 * @access  Protected (OWNER, COACH)
 */
router.get('/subscription', protect, getSubscription);

export default router;
