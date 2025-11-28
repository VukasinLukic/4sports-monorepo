import { storage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Firebase Storage
 * @param file - File buffer
 * @param fileName - Original file name
 * @param folder - Storage folder (e.g., 'profiles', 'posts', 'documents')
 * @param contentType - MIME type
 * @returns Public URL of the uploaded file
 */
export const uploadFile = async (
  file: Buffer,
  fileName: string,
  folder: string,
  contentType: string
): Promise<string> => {
  try {
    const bucket = storage.bucket();
    const uniqueFileName = `${folder}/${uuidv4()}-${fileName}`;
    const fileUpload = bucket.file(uniqueFileName);

    await fileUpload.save(file, {
      metadata: {
        contentType,
      },
      public: true,
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
    return publicUrl;
  } catch (error: any) {
    console.error('❌ Firebase Upload Error:', error);
    throw new Error('File upload failed');
  }
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - Public URL of the file
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const bucket = storage.bucket();
    const fileName = extractFileNameFromUrl(fileUrl, bucket.name);

    if (!fileName) {
      throw new Error('Invalid file URL');
    }

    const file = bucket.file(fileName);
    await file.delete();
  } catch (error: any) {
    console.error('❌ Firebase Delete Error:', error);
    throw new Error('File deletion failed');
  }
};

/**
 * Extract file name from Firebase Storage URL
 * @param url - Public URL of the file
 * @param bucketName - Firebase Storage bucket name
 * @returns File name in storage
 */
const extractFileNameFromUrl = (url: string, bucketName: string): string | null => {
  try {
    const prefix = `https://storage.googleapis.com/${bucketName}/`;
    if (url.startsWith(prefix)) {
      return url.replace(prefix, '');
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Validate file type
 * @param mimetype - MIME type of the file
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns true if valid, false otherwise
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// File type configurations
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// File size configurations (in bytes)
export const FILE_SIZE = {
  IMAGE_MAX: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX: 10 * 1024 * 1024, // 10MB
};
