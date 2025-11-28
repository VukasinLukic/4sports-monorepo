import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  uploadProfilePicture as uploadProfilePictureController,
  uploadPostImages as uploadPostImagesController,
  uploadDocument,
  deleteUploadedFile,
} from '../controllers/uploadController';
import {
  uploadProfilePicture as uploadProfilePictureMiddleware,
  uploadPostImages as uploadPostImagesMiddleware,
  uploadSingle,
} from '../middleware/uploadMiddleware';

const router = express.Router();

// ============================================
// UPLOAD ROUTES
// ============================================

/**
 * @route   POST /api/upload/profile-picture
 * @desc    Upload or update user profile picture
 * @access  Protected (All authenticated users)
 * @body    FormData with 'profilePicture' file
 */
router.post('/profile-picture', protect, uploadProfilePictureMiddleware, uploadProfilePictureController);

/**
 * @route   POST /api/upload/post-images
 * @desc    Upload multiple images for a post
 * @access  Protected (All authenticated users)
 * @body    FormData with 'images' files (max 5)
 */
router.post('/post-images', protect, uploadPostImagesMiddleware, uploadPostImagesController);

/**
 * @route   POST /api/upload/document
 * @desc    Upload a document (PDF, DOC, DOCX, images)
 * @access  Protected (All authenticated users)
 * @body    FormData with 'file'
 */
router.post('/document', protect, uploadSingle, uploadDocument);

/**
 * @route   DELETE /api/upload
 * @desc    Delete a file from Firebase Storage
 * @access  Protected (All authenticated users)
 * @body    { fileUrl: string }
 */
router.delete('/', protect, deleteUploadedFile);

export default router;
