import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Auth with AsyncStorage persistence for React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  // Initialize Storage
  storage = getStorage(app);

  // Initialize Firestore
  db = getFirestore(app);

  console.log('Firebase initialized successfully');
} catch (error: any) {
  // If app is already initialized, get the default app
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase app already initialized, using default app');
    app = initializeApp(firebaseConfig, 'DEFAULT');
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
  } else {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export { app, auth, storage, db };
