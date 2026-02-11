import cloudinary from '../config/cloudinary';
import { randomUUID } from 'crypto';

/**
 * Upload a file to Cloudinary
 * @param file - File buffer
 * @param fileName - Original file name
 * @param folder - Storage folder (e.g., 'profiles', 'posts', 'documents')
 * @param _contentType - MIME type (unused - Cloudinary auto-detects)
 * @returns Public URL of the uploaded file
 */
export const uploadFile = async (
  file: Buffer,
  fileName: string,
  folder: string,
  _contentType: string
): Promise<string> => {
  try {
    // Create a unique public_id for the file
    const publicId = `${folder}/${randomUUID()}-${fileName.replace(/\.[^/.]+$/, '')}`;

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          resource_type: 'auto', // Automatically detect resource type
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Write buffer to stream
      uploadStream.end(file);
    });

    // Return secure URL
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary Upload Error:', error);
    throw new Error('File upload failed');
  }
};

/**
 * Delete a file from Cloudinary
 * @param fileUrl - Public URL of the file
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const publicId = extractPublicIdFromUrl(fileUrl);

    if (!publicId) {
      throw new Error('Invalid file URL');
    }

    // Determine resource type from URL
    const resourceType = fileUrl.includes('/image/') ? 'image' :
                        fileUrl.includes('/video/') ? 'video' :
                        fileUrl.includes('/raw/') ? 'raw' : 'image';

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error: any) {
    console.error('❌ Cloudinary Delete Error:', error);
    throw new Error('File deletion failed');
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param url - Public URL of the file
 * @returns Public ID in Cloudinary
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
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
