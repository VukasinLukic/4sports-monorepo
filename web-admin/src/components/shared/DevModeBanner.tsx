import { FIREBASE_ENABLED } from '@/config/firebase';

export const DevModeBanner = () => {
  if (!FIREBASE_ENABLED) {
    console.log('🔧 DEV MODE: Firebase not configured - using mock authentication');
  }

  return null;
};
