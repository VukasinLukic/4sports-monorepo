import { FIREBASE_ENABLED } from '@/config/firebase';
import { AlertCircle } from 'lucide-react';

export const DevModeBanner = () => {
  if (FIREBASE_ENABLED) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <AlertCircle size={16} />
        <span>
          <strong>DEV MODE:</strong> Firebase not configured - using mock authentication
        </span>
      </div>
    </div>
  );
};
