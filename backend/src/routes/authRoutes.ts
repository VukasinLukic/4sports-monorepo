import express from 'express';
import {
  register,
  login,
  getCurrentUser,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (OWNER, COACH, or PARENT)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with Firebase token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

export default router;
