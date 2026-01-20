import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createMedicalCheck,
  getMemberMedicalChecks,
  getExpiringSoon,
} from '../controllers/medicalCheckController';

const router = express.Router();

/**
 * @route   POST /api/medical-checks
 * @desc    Create/upload a new medical check for a member
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.post('/', protect, createMedicalCheck);

/**
 * @route   GET /api/medical-checks/member/:memberId
 * @desc    Get all medical checks for a specific member
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.get('/member/:memberId', protect, getMemberMedicalChecks);

/**
 * @route   GET /api/medical-checks/expiring
 * @desc    Get medical checks expiring soon (default 30 days)
 * @access  Protected (OWNER, COACH)
 */
router.get('/expiring', protect, getExpiringSoon);

export default router;
