import admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase immediately
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

try {
  if (admin.apps.length === 0) {
    if (!storageBucket) {
      console.warn('⚠️  FIREBASE_STORAGE_BUCKET not set in environment variables');
    } else {
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
    }
  }
} catch (error) {
  console.error('❌ Firebase Initialization Error:', error);
  console.error('   Make sure firebase-admin-key.json exists in backend/ folder');
}

/**
 * Initialize Firebase Admin SDK (legacy function for backwards compatibility)
 * @description Sets up Firebase Admin for authentication and storage
 */
export const initializeFirebase = (): void => {
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin already initialized');
    return;
  }
  console.warn('⚠️  Firebase should be auto-initialized on import');
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

/**
 * Get Firebase Firestore instance
 * @returns Firebase Firestore instance
 */
export const getFirestore = () => {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore();
};

/**
 * Get Firebase Cloud Messaging instance
 * @returns Firebase Cloud Messaging instance
 */
export const getMessaging = () => {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.messaging();
};

/**
 * Export storage getter (for compatibility)
 */
let storageInstance: any = null;
export const storage = new Proxy({} as any, {
  get: (_target, prop) => {
    if (!storageInstance) {
      storageInstance = admin.storage();
    }
    return (storageInstance as any)[prop];
  }
});
