import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
  sendPaymentReminderToMember,
  sendMedicalReminderToMember,
  sendPaymentReminderToGroup,
  sendMedicalReminderToGroup,
  sendPaymentReminderToAll,
  sendMedicalReminderToAll,
  getGroupReminderStatus,
  getMemberReminderStatus,
} from '../controllers/reminderController';

const router = express.Router();

// ============================================
// REMINDER ROUTES
// ============================================

/**
 * @route   POST /api/reminders/payment/member/:memberId
 * @desc    Send payment reminder to a specific member
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/payment/member/:memberId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendPaymentReminderToMember
);

/**
 * @route   POST /api/reminders/medical/member/:memberId
 * @desc    Send medical check reminder to a specific member
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/medical/member/:memberId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendMedicalReminderToMember
);

/**
 * @route   POST /api/reminders/payment/group/:groupId
 * @desc    Send payment reminder to all unpaid members in a group
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/payment/group/:groupId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendPaymentReminderToGroup
);

/**
 * @route   POST /api/reminders/medical/group/:groupId
 * @desc    Send medical reminder to all members with invalid medical check in a group
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/medical/group/:groupId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendMedicalReminderToGroup
);

/**
 * @route   POST /api/reminders/payment/all
 * @desc    Send payment reminder to all unpaid members in the club
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/payment/all',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendPaymentReminderToAll
);

/**
 * @route   POST /api/reminders/medical/all
 * @desc    Send medical reminder to all members with invalid medical check in the club
 * @access  Protected (OWNER, COACH)
 */
router.post(
  '/medical/all',
  protect,
  restrictTo(['OWNER', 'COACH']),
  sendMedicalReminderToAll
);

/**
 * @route   GET /api/reminders/status/group/:groupId
 * @desc    Get members with unpaid/invalid status in a group
 * @access  Protected (OWNER, COACH)
 */
router.get(
  '/status/group/:groupId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  getGroupReminderStatus
);

/**
 * @route   GET /api/reminders/status/member/:memberId
 * @desc    Get payment/medical status for a specific member
 * @access  Protected (OWNER, COACH)
 */
router.get(
  '/status/member/:memberId',
  protect,
  restrictTo(['OWNER', 'COACH']),
  getMemberReminderStatus
);

export default router;
