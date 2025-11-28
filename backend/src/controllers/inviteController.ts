import { Request, Response } from 'express';
import InviteCode from '../models/InviteCode';
import Club from '../models/Club';

/**
 * Generate Invite Code
 * @route POST /api/v1/invites/generate
 * @access Private (OWNER, COACH)
 */
export const generateInviteCode = async (req: Request, res: Response) => {
  try {
    const { type, maxUses = 1, expiresInDays = 7 } = req.body;

    // Validation
    if (!type || !['COACH', 'MEMBER'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be COACH or MEMBER',
        },
      });
    }

    // Verify user belongs to a club
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You must be associated with a club to generate invite codes',
        },
      });
    }

    // OWNER can generate both COACH and MEMBER codes
    // COACH can only generate MEMBER codes
    if (req.user.role === 'COACH' && type === 'COACH') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only OWNER can generate COACH invite codes',
        },
      });
    }

    // For MEMBER invites, check if club has space
    if (type === 'MEMBER') {
      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Club not found',
          },
        });
      }

      if (!club.canAddMembers(maxUses)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MEMBER_LIMIT_REACHED',
            message: `Club has reached member limit. Cannot generate invite for ${maxUses} members.`,
          },
        });
      }
    }

    // Generate invite code
    const inviteCode = await InviteCode.generateCode(
      clubId,
      req.user._id,
      type,
      maxUses,
      expiresInDays
    );

    return res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        type: inviteCode.type,
        expiresAt: inviteCode.expiresAt,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        isActive: inviteCode.isActive,
      },
    });
  } catch (error: any) {
    console.error('❌ Generate Invite Code Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to generate invite code',
      },
    });
  }
};

/**
 * Get Club Invite Codes
 * @route GET /api/v1/invites
 * @access Private (OWNER, COACH)
 */
export const getClubInviteCodes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You must be associated with a club',
        },
      });
    }

    // Get all invite codes for the club
    const inviteCodes = await InviteCode.find({ clubId })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: inviteCodes.map((code) => ({
        _id: code._id,
        code: code.code,
        type: code.type,
        expiresAt: code.expiresAt,
        maxUses: code.maxUses,
        usedCount: code.usedCount,
        isActive: code.isActive,
        isValid: code.isValid(),
        createdBy: code.createdBy,
        createdAt: code.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('❌ Get Invite Codes Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch invite codes',
      },
    });
  }
};

/**
 * Deactivate Invite Code
 * @route DELETE /api/v1/invites/:code
 * @access Private (OWNER only)
 */
export const deactivateInviteCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { code } = req.params;
    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You must be associated with a club',
        },
      });
    }

    // Find invite code
    const inviteCode = await InviteCode.findOne({ code, clubId });

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invite code not found',
        },
      });
    }

    // Deactivate
    inviteCode.isActive = false;
    await inviteCode.save();

    return res.status(200).json({
      success: true,
      message: 'Invite code deactivated successfully',
    });
  } catch (error: any) {
    console.error('❌ Deactivate Invite Code Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to deactivate invite code',
      },
    });
  }
};

/**
 * Validate Invite Code (Internal use for registration)
 * @description Validates invite code and returns club/type info
 */
export const validateInviteCode = async (
  code: string
): Promise<{
  valid: boolean;
  inviteCode?: any;
  error?: string;
}> => {
  try {
    // Find invite code
    const inviteCode = await InviteCode.findOne({
      code: code.toUpperCase(),
    }).populate('clubId');

    if (!inviteCode) {
      return {
        valid: false,
        error: 'Invalid invite code',
      };
    }

    // Check if valid
    if (!inviteCode.isValid()) {
      return {
        valid: false,
        error: 'Invite code is expired or no longer valid',
      };
    }

    return {
      valid: true,
      inviteCode,
    };
  } catch (error) {
    console.error('❌ Validate Invite Code Error:', error);
    return {
      valid: false,
      error: 'Failed to validate invite code',
    };
  }
};
