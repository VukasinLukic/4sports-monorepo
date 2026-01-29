import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
  createPayment,
  getClubPayments,
  getMemberPayments,
  getMyPayments,
  markPaymentPaid,
} from '../controllers/paymentController';

const router = express.Router();

/**
 * @route   POST /api/payments
 * @desc    Create a new payment for a member
 * @access  Protected (OWNER, COACH)
 */
router.post('/', protect, createPayment);

/**
 * @route   GET /api/payments/club
 * @desc    Get all payments for the club
 * @access  Protected (OWNER, COACH)
 */
router.get('/club', protect, getClubPayments);

/**
 * @route   GET /api/payments/me
 * @desc    Get own payments (for MEMBER role)
 * @access  Protected (MEMBER)
 */
router.get('/me', protect, restrictTo(['MEMBER']), getMyPayments);

/**
 * @route   GET /api/payments/member/:memberId
 * @desc    Get all payments for a specific member
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.get('/member/:memberId', protect, getMemberPayments);

/**
 * @route   PATCH /api/payments/:id/paid
 * @desc    Mark a payment as paid
 * @access  Protected (OWNER, COACH)
 */
router.patch('/:id/paid', protect, markPaymentPaid);

export default router;
