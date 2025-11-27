import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * @description Sets up Firebase Admin for authentication and storage
 *
 * TODO: Before production, add firebase-admin-key.json to backend/ folder
 * and update this to use credential: admin.credential.cert()
 */
export const initializeFirebase = (): void => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !storageBucket) {
      console.warn('⚠️  Firebase environment variables not set (will be needed later)');
      console.warn('   FIREBASE_PROJECT_ID:', projectId ? '✓' : '✗');
      console.warn('   FIREBASE_STORAGE_BUCKET:', storageBucket ? '✓' : '✗');
      return;
    }

    // TODO: When you have firebase-admin-key.json, replace this with:
    // const serviceAccount = require('../../firebase-admin-key.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    //   storageBucket: storageBucket
    // });

    // For now, using placeholder initialization
    // This will be replaced when firebase-admin-key.json is added
    console.log('⚠️  Firebase Admin initialized with placeholder config');
    console.log('   Add firebase-admin-key.json before using authentication');

  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error);
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
