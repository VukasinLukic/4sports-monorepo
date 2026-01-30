import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('🔧 Cloudinary Config Debug:');
console.log('   Cloud Name:', cloudName || '(not set)');
console.log('   API Key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '(not set)');
console.log('   API Secret:', apiSecret ? `${apiSecret.substring(0, 4)}...` : '(not set)');

try {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️  Cloudinary credentials not set in environment variables');
    console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
  } else {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Use HTTPS URLs
    });

    console.log('✅ Cloudinary initialized successfully');
    console.log(`☁️  Cloud Name: ${cloudName}`);
  }
} catch (error) {
  console.error('❌ Cloudinary Initialization Error:', error);
}

/**
 * Get Cloudinary instance
 * @returns Cloudinary v2 instance
 */
export const getCloudinary = () => {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary not configured');
  }
  return cloudinary;
};

export default cloudinary;
