import express from 'express';
import {
  generateInviteCode,
  getClubInviteCodes,
  deactivateInviteCode,
  validateInviteCodePublic,
} from '../controllers/inviteController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @route   GET /api/v1/invites/validate/:code
 * @desc    Validate invite code and get club/group info for registration
 * @access  Public
 */
router.get('/validate/:code', validateInviteCodePublic);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================
router.use(protect);

/**
 * @route   POST /api/v1/invites/generate
 * @desc    Generate new invite code
 * @access  Private (OWNER, COACH)
 */
router.post('/generate', restrictTo(['OWNER', 'COACH']), generateInviteCode);

/**
 * @route   GET /api/v1/invites
 * @desc    Get all invite codes for club
 * @access  Private (OWNER, COACH)
 */
router.get('/', restrictTo(['OWNER', 'COACH']), getClubInviteCodes);

/**
 * @route   DELETE /api/v1/invites/:code
 * @desc    Deactivate invite code
 * @access  Private (OWNER only)
 */
router.delete('/:code', restrictTo(['OWNER']), deactivateInviteCode);

export default router;
