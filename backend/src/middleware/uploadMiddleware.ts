import multer from 'multer';
import { FILE_SIZE } from '../utils/fileUpload';

/**
 * Multer configuration for file uploads
 * Stores files in memory as Buffer for Firebase Storage upload
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * @param _req - Express request (unused)
 * @param _file - Uploaded file (unused)
 * @param cb - Callback function
 */
const fileFilter = (_req: any, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept all files - validation will be done in controller
  cb(null, true);
};

/**
 * Multer upload middleware
 * Limits file size and accepts single or multiple files
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE.DOCUMENT_MAX, // 10MB max (supports both images and documents)
  },
});

/**
 * Single file upload middleware
 * Field name: 'file'
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware
 * Field name: 'files'
 * Max count: 10 files
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Profile picture upload middleware
 * Field name: 'profilePicture'
 */
export const uploadProfilePicture = upload.single('profilePicture');

/**
 * Post images upload middleware
 * Field name: 'images'
 * Max count: 5 images
 */
export const uploadPostImages = upload.array('images', 5);

/**
 * Chat images upload middleware
 * Field name: 'file' (single image)
 */
export const uploadChatImage = upload.single('file');
