import { Request, Response } from 'express';
import { getAuth } from '../config/firebase';
import User from '../models/User';
import Club from '../models/Club';

/**
 * Register New User
 * @route POST /api/v1/auth/register
 * @access Public
 *
 * @description
 * - OWNER: Creates new user AND new club automatically
 * - COACH/PARENT: Requires valid invite code
 * - Verifies Firebase token before registration
 * - Checks club member limit for PARENT role
 */
export const register = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      firebaseToken,
      email,
      fullName,
      phoneNumber,
      role,
      inviteCode,
    } = req.body;

    // ========================================
    // 1. VALIDATE REQUEST BODY
    // ========================================
    if (!firebaseToken || !email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: firebaseToken, email, fullName, role',
        },
      });
    }

    // ========================================
    // 2. VERIFY FIREBASE TOKEN
    // ========================================
    let firebaseUid: string;
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(firebaseToken);
      firebaseUid = decodedToken.uid;
    } catch (firebaseError: any) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Firebase token',
          details: firebaseError.message,
        },
      });
    }

    // ========================================
    // 3. CHECK IF USER ALREADY EXISTS
    // ========================================
    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'User already registered with this email or Firebase UID',
        },
      });
    }

    // ========================================
    // 4. HANDLE ROLE-SPECIFIC LOGIC
    // ========================================
    let clubId: any;

    if (role === 'OWNER') {
      // ========================================
      // OWNER: Auto-create new club
      // ========================================
      const newClub = await Club.create({
        name: `${fullName}'s Club`,
        subscriptionPlan: 'FREE',
        // ownerId will be set after user creation
      });

      clubId = newClub._id;
    } else {
      // ========================================
      // COACH/PARENT: Validate invite code
      // ========================================
      if (!inviteCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invite code is required for COACH and PARENT roles',
          },
        });
      }

      // TODO: Phase 3 - Implement InviteCode validation
      // For now, return error since InviteCode model doesn't exist yet
      return res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message:
            'Invite code validation will be implemented in Phase 3. For now, only OWNER registration is supported.',
        },
      });

      // FUTURE CODE (Phase 3):
      // const invite = await InviteCode.findOne({
      //   code: inviteCode,
      //   isActive: true,
      // });
      //
      // if (!invite || invite.expiresAt < new Date()) {
      //   return res.status(400).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_CODE',
      //       message: 'Invalid or expired invite code',
      //     },
      //   });
      // }
      //
      // // Validate invite type
      // if (role === 'COACH' && invite.type !== 'COACH') {
      //   return res.status(400).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_CODE_TYPE',
      //       message: 'This invite code is not valid for COACH role',
      //     },
      //   });
      // }
      //
      // if (role === 'PARENT' && invite.type !== 'MEMBER') {
      //   return res.status(400).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_CODE_TYPE',
      //       message: 'This invite code is not valid for PARENT role',
      //     },
      //   });
      // }
      //
      // clubId = invite.clubId;
      //
      // // Check club member limit for PARENT role
      // if (role === 'PARENT') {
      //   const club = await Club.findById(clubId);
      //   if (!club) {
      //     return res.status(404).json({
      //       success: false,
      //       error: {
      //         code: 'CLUB_NOT_FOUND',
      //         message: 'Associated club not found',
      //       },
      //     });
      //   }
      //
      //   if (!club.canAddMembers()) {
      //     return res.status(403).json({
      //       success: false,
      //       error: {
      //         code: 'MEMBER_LIMIT_REACHED',
      //         message: `Club has reached its member limit of ${club.memberLimit}`,
      //       },
      //     });
      //   }
      // }
      //
      // // Increment invite code usage
      // invite.usedCount += 1;
      // await invite.save();
    }

    // ========================================
    // 5. CREATE USER
    // ========================================
    const newUser = await User.create({
      firebaseUid,
      email: email.toLowerCase(),
      fullName,
      phoneNumber,
      role,
      clubId,
    });

    // ========================================
    // 6. UPDATE CLUB OWNER (if OWNER)
    // ========================================
    if (role === 'OWNER') {
      await Club.findByIdAndUpdate(clubId, { ownerId: newUser._id });
    }

    // ========================================
    // 7. RETURN SUCCESS RESPONSE
    // ========================================
    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: newUser._id,
          firebaseUid: newUser.firebaseUid,
          email: newUser.email,
          fullName: newUser.fullName,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
          clubId: newUser.clubId,
          createdAt: newUser.createdAt,
        },
        token: firebaseToken, // Return same Firebase token
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('❌ Register Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Registration failed',
        details: error.message,
      },
    });
  }
};

/**
 * Login User
 * @route POST /api/v1/auth/login
 * @access Public
 *
 * @description
 * - Verifies Firebase token
 * - Finds user in MongoDB
 * - Returns user data with populated club info
 */
export const login = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { firebaseToken } = req.body;

    // ========================================
    // 1. VALIDATE REQUEST BODY
    // ========================================
    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Firebase token is required',
        },
      });
    }

    // ========================================
    // 2. VERIFY FIREBASE TOKEN
    // ========================================
    let firebaseUid: string;
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(firebaseToken);
      firebaseUid = decodedToken.uid;
    } catch (firebaseError: any) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Firebase token',
          details: firebaseError.message,
        },
      });
    }

    // ========================================
    // 3. FIND USER IN DATABASE
    // ========================================
    const user = await User.findOne({ firebaseUid })
      .populate('clubId', 'name subscriptionPlan memberLimit currentMembers')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found. Please register first.',
        },
      });
    }

    // ========================================
    // 4. RETURN SUCCESS RESPONSE
    // ========================================
    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          clubId: user.clubId,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
        token: firebaseToken,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('❌ Login Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Login failed',
        details: error.message,
      },
    });
  }
};

/**
 * Get Current User
 * @route GET /api/v1/auth/me
 * @access Private (requires authentication)
 *
 * @description
 * - Returns currently authenticated user
 * - req.user is attached by protect middleware
 * - Populates club information
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // ========================================
    // 1. CHECK IF USER EXISTS (from middleware)
    // ========================================
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // ========================================
    // 2. FETCH USER WITH POPULATED DATA
    // ========================================
    const user = await User.findById(req.user._id)
      .populate(
        'clubId',
        'name subscriptionPlan memberLimit currentMembers address phoneNumber email'
      )
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // ========================================
    // 3. RETURN SUCCESS RESPONSE
    // ========================================
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('❌ Get Current User Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch current user',
        details: error.message,
      },
    });
  }
};
