import { Request, Response } from 'express';
import {
  uploadFile,
  deleteFile,
  validateFileType,
  validateFileSize,
  FILE_TYPES,
  FILE_SIZE,
} from '../utils/fileUpload';
import User from '../models/User';

// ============================================
// PROFILE PICTURE UPLOAD
// ============================================

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    }

    // Validate file type
    if (!validateFileType(req.file.mimetype, FILE_TYPES.IMAGES)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Only images are allowed.' },
      });
    }

    // Validate file size
    if (!validateFileSize(req.file.size, FILE_SIZE.IMAGE_MAX)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum size is 5MB.' },
      });
    }

    // Upload to Cloudinary
    const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, 'profiles', req.file.mimetype);

    // Update user profile picture
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // Delete old profile picture if exists
    if (user.profileImage) {
      try {
        await deleteFile(user.profileImage);
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error);
      }
    }

    user.profileImage = fileUrl;
    await user.save();

    return res.status(200).json({ success: true, data: { url: fileUrl } });
  } catch (error: any) {
    console.error('❌ Upload Profile Picture Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload file' } });
  }
};

// ============================================
// POST IMAGES UPLOAD
// ============================================

export const uploadPostImages = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No files uploaded' } });
    }

    const files = req.files as Express.Multer.File[];

    // Validate all files
    for (const file of files) {
      if (!validateFileType(file.mimetype, FILE_TYPES.IMAGES)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Only images are allowed.' },
        });
      }

      if (!validateFileSize(file.size, FILE_SIZE.IMAGE_MAX)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum size is 5MB per image.' },
        });
      }
    }

    // Upload all files
    const uploadPromises = files.map((file) => uploadFile(file.buffer, file.originalname, 'posts', file.mimetype));

    const urls = await Promise.all(uploadPromises);

    return res.status(200).json({ success: true, data: { urls } });
  } catch (error: any) {
    console.error('❌ Upload Post Images Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload files' } });
  }
};

// ============================================
// DOCUMENT UPLOAD
// ============================================

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    }

    // Validate file type
    if (!validateFileType(req.file.mimetype, FILE_TYPES.ALL)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Allowed types: images and documents (PDF, DOC, DOCX).' },
      });
    }

    // Validate file size
    if (!validateFileSize(req.file.size, FILE_SIZE.DOCUMENT_MAX)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum size is 10MB.' },
      });
    }

    // Upload to Cloudinary
    const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, 'documents', req.file.mimetype);

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error: any) {
    console.error('❌ Upload Document Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload file' } });
  }
};

// ============================================
// FILE DELETION
// ============================================

export const deleteUploadedFile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'File URL is required' } });
    }

    await deleteFile(fileUrl);

    return res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete File Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete file' } });
  }
};
