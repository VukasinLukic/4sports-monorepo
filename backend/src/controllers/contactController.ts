import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';
import { sendContactEmail } from '../services/emailService';

/**
 * Submit Contact Form
 * @route POST /api/v1/contact
 * @access Public (no auth required)
 */
export const submitContactForm = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, email, subject, message } = req.body;

    // ========================================
    // 1. VALIDATE REQUEST BODY
    // ========================================
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: name, email, subject, message',
        },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
    }

    // ========================================
    // 2. SAVE TO DATABASE
    // ========================================
    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // ========================================
    // 3. SEND EMAIL NOTIFICATION
    // ========================================
    try {
      await sendContactEmail({
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        message: contactMessage.message,
      });
    } catch (emailError) {
      console.error('❌ Failed to send contact email notification:', emailError);
      // Don't fail the request — message is saved in DB
    }

    // ========================================
    // 4. RETURN SUCCESS
    // ========================================
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Contact form error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to send message. Please try again later.',
      },
    });
  }
};
