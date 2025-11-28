import express from 'express';
import {
  generateInviteCode,
  getClubInviteCodes,
  deactivateInviteCode,
} from '../controllers/inviteController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * All routes require authentication
 */
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
