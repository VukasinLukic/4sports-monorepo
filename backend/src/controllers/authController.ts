import { Request, Response } from 'express';
import { getAuth } from '../config/firebase';
import User from '../models/User';
import Club from '../models/Club';
import Member from '../models/Member';
import InviteCode from '../models/InviteCode';
import { validateInviteCode } from './inviteController';

/**
 * Register New User
 * @route POST /api/v1/auth/register
 * @access Public
 *
 * @description
 * - OWNER: Creates new user AND new club automatically (role required in body)
 * - COACH/PARENT: Requires valid invite code, role is derived from invite type
 * - Verifies Firebase token before registration
 * - Checks club member limit for PARENT role
 * - Returns groupId for PARENT to know which group to add children to
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
      role: bodyRole, // Role from body (required for OWNER, optional for others)
      inviteCode,
    } = req.body;

    // ========================================
    // 1. VALIDATE REQUEST BODY
    // ========================================
    if (!firebaseToken || !email || !fullName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: firebaseToken, email, fullName',
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
    // 4. DETERMINE ROLE AND CLUB
    // ========================================
    let role: string;
    let clubId: any;
    let groupId: any = null;
    let clubName: string | null = null;

    // If inviteCode is provided, derive role from it
    if (inviteCode) {
      // Validate invite code
      const validation = await validateInviteCode(inviteCode);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INVITE_CODE',
            message: validation.error || 'Invalid invite code',
          },
        });
      }

      const invite = validation.inviteCode;

      // Derive role from invite type
      // COACH invite type → COACH role
      // MEMBER invite type → MEMBER role (self-registered member)
      role = invite.type === 'COACH' ? 'COACH' : 'MEMBER';

      // Get club info
      const club = await Club.findById(invite.clubId);
      if (!club) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CLUB_NOT_FOUND',
            message: 'Club associated with invite code not found',
          },
        });
      }

      clubName = club.name;

      // Check if club has space for new members (MEMBER only)
      if (role === 'MEMBER') {
        if (!club.canAddMembers(1)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MEMBER_LIMIT_REACHED',
              message: 'Club has reached member limit',
            },
          });
        }
      }

      clubId = invite.clubId;

      // Get groupId from invite (for PARENT to know which group to add children)
      // Fetch fresh from DB to get groupId (validation doesn't always populate it)
      const freshInvite = await InviteCode.findById(invite._id);
      if (freshInvite && freshInvite.groupId) {
        groupId = freshInvite.groupId;
      }
    } else if (bodyRole === 'OWNER') {
      // OWNER registration - no invite code needed
      role = 'OWNER';

      // Auto-create new club
      const newClub = await Club.create({
        name: `${fullName}'s Club`,
        subscriptionPlan: 'FREE',
        // ownerId will be set after user creation
      });

      clubId = newClub._id;
      clubName = newClub.name;
    } else {
      // No invite code and not OWNER - error
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invite code is required for COACH and PARENT registration',
        },
      });
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
    // 6.5 CREATE MEMBER ENTITY (if MEMBER)
    // ========================================
    let memberId = null;
    if (role === 'MEMBER' && clubId && groupId) {
      const newMember = await Member.create({
        fullName,
        userId: newUser._id, // Link to user account
        clubs: [
          {
            clubId,
            groupId,
            joinedAt: new Date(),
            status: 'ACTIVE',
          },
        ],
      });
      memberId = newMember._id;

      // Increment club member count
      await Club.findByIdAndUpdate(clubId, { $inc: { currentMembers: 1 } });
    }

    // ========================================
    // 7. INCREMENT INVITE CODE USAGE (if COACH/MEMBER)
    // ========================================
    if (role !== 'OWNER' && inviteCode) {
      const validation = await validateInviteCode(inviteCode);
      if (validation.valid && validation.inviteCode) {
        await validation.inviteCode.incrementUsage();
      }
    }

    // ========================================
    // 8. RETURN SUCCESS RESPONSE
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
        clubName, // Club name for display
        groupId, // Group ID for reference
        memberId, // Member ID for MEMBER role users
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
    // 2. FETCH USER DATA
    // ========================================
    const user = await User.findById(req.user._id).select('-__v').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Convert MongoDB ObjectId to string for frontend
    const userData = {
      ...user,
      _id: user._id.toString(),
      clubId: user.clubId ? user.clubId.toString() : undefined,
    };

    console.log('📤 Returning user data:', {
      _id: userData._id,
      email: userData.email,
      clubId: userData.clubId,
      clubIdType: typeof userData.clubId
    });

    // ========================================
    // 3. RETURN SUCCESS RESPONSE
    // ========================================
    return res.status(200).json({
      success: true,
      data: userData,
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
