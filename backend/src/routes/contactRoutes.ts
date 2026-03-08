import express from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = express.Router();

/**
 * @route   POST /api/v1/contact
 * @desc    Submit contact form (sends email + saves to DB)
 * @access  Public (no authentication required)
 */
router.post('/', submitContactForm);

export default router;
