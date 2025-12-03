import admin from 'firebase-admin';
import * as path from 'path';

/**
 * Initialize Firebase Admin SDK
 * @description Sets up Firebase Admin for authentication and storage
 */
export const initializeFirebase = (): void => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
      console.warn('⚠️  FIREBASE_STORAGE_BUCKET not set in environment variables');
      return;
    }

    // Load service account key
    const serviceAccountPath = path.join(__dirname, '../../firebase-admin-key.json');
    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📦 Storage Bucket: ${storageBucket}`);

  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error);
    console.error('   Make sure firebase-admin-key.json exists in backend/ folder');
    // Don't exit process - allow server to start without Firebase for now
  }
};

/**
 * Get Firebase Auth instance
 * @returns Firebase Auth instance
 */
export const getAuth = () => {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth();
};

/**
 * Get Firebase Storage instance
 * @returns Firebase Storage instance
 */
export const getStorage = () => {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.storage();
};
