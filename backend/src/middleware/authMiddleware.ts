import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import User, { IUser } from '../models/User';

/**
 * Extend Express Request type to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Auth Middleware - Protect Routes
 * @description Verifies Firebase token and attaches authenticated user to req.user
 *
 * Usage:
 * ```typescript
 * router.get('/protected', protect, controller);
 * ```
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided. Please include Authorization header.',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token format',
        },
      });
    }

    // 2. Verify Firebase token
    let firebaseUid: string;
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      firebaseUid = decodedToken.uid;
    } catch (firebaseError: any) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired Firebase token',
          details: firebaseError.message,
        },
      });
    }

    // 3. Find user in MongoDB
    const user = await User.findOne({ firebaseUid }).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message:
            'User not found in database. Please complete registration.',
        },
      });
    }

    // 4. Attach user to request object
    req.user = user;

    // 5. Continue to next middleware/controller
    next();
  } catch (error: any) {
    console.error('❌ Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Authentication failed',
        details: error.message,
      },
    });
  }
};

/**
 * Role-based middleware
 * @description Checks if authenticated user has required role
 * @param allowedRoles - Array of roles that can access this route
 *
 * Usage:
 * ```typescript
 * router.post('/create', protect, restrictTo(['OWNER', 'COACH']), controller);
 * ```
 */
export const restrictTo = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};
