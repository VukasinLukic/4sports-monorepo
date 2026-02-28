import { Request, Response } from 'express';
import Club, { SUBSCRIPTION_LIMITS } from '../models/Club';
import User from '../models/User';
import Member from '../models/Member';

// ============================================
// CLUB SETTINGS
// ============================================

/**
 * Get club settings
 */
export const getClubSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } });

    return res.status(200).json({
      success: true,
      data: {
        id: club._id,
        name: club.name,
        address: club.address || '',
        phoneNumber: club.phoneNumber || '',
        email: club.email || '',
        subscriptionPlan: club.subscriptionPlan,
        memberLimit: club.memberLimit,
        currentMembers: club.currentMembers,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Get Club Settings Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch club settings' } });
  }
};

/**
 * Update club settings
 */
export const updateClubSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // Only OWNER can update club settings
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only club owner can update settings' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const { name, address, phoneNumber, email } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } });

    if (name) club.name = name;
    if (address !== undefined) club.address = address;
    if (phoneNumber !== undefined) club.phoneNumber = phoneNumber;
    if (email !== undefined) club.email = email;

    await club.save();

    return res.status(200).json({
      success: true,
      data: {
        id: club._id,
        name: club.name,
        address: club.address || '',
        phoneNumber: club.phoneNumber || '',
        email: club.email || '',
        subscriptionPlan: club.subscriptionPlan,
        memberLimit: club.memberLimit,
        currentMembers: club.currentMembers,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Update Club Settings Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update club settings' } });
  }
};

// ============================================
// USER PROFILE
// ============================================

/**
 * Get user profile
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profileImage || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Get User Profile Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch user profile' } });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { fullName, phoneNumber, profileImage } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });

    if (fullName) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    // Sync profileImage to linked Member document (if user is a member)
    if (profileImage !== undefined) {
      await Member.findOneAndUpdate(
        { userId: req.user._id },
        { profileImage },
        { new: false }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profileImage || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Update User Profile Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update user profile' } });
  }
};

// ============================================
// SUBSCRIPTION
// ============================================

/**
 * Get subscription details
 */
export const getSubscription = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } });

    const planDetails = SUBSCRIPTION_LIMITS[club.subscriptionPlan];

    return res.status(200).json({
      success: true,
      data: {
        plan: club.subscriptionPlan,
        memberLimit: planDetails.memberLimit,
        price: planDetails.price,
        currentMembers: club.currentMembers,
        membersRemaining: planDetails.memberLimit - club.currentMembers,
        usagePercentage: Math.round((club.currentMembers / planDetails.memberLimit) * 100),
        features: getFeaturesByPlan(club.subscriptionPlan),
        availablePlans: [
          {
            name: 'FREE',
            memberLimit: SUBSCRIPTION_LIMITS.FREE.memberLimit,
            price: SUBSCRIPTION_LIMITS.FREE.price,
            features: getFeaturesByPlan('FREE'),
          },
          {
            name: 'BASIC',
            memberLimit: SUBSCRIPTION_LIMITS.BASIC.memberLimit,
            price: SUBSCRIPTION_LIMITS.BASIC.price,
            features: getFeaturesByPlan('BASIC'),
          },
          {
            name: 'PRO',
            memberLimit: SUBSCRIPTION_LIMITS.PRO.memberLimit,
            price: SUBSCRIPTION_LIMITS.PRO.price,
            features: getFeaturesByPlan('PRO'),
          },
        ],
      },
    });
  } catch (error: any) {
    console.error('❌ Get Subscription Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch subscription' } });
  }
};

/**
 * Helper function to get features by plan
 */
function getFeaturesByPlan(plan: string): string[] {
  const features: Record<string, string[]> = {
    FREE: [
      'Do 50 članova',
      'Osnovni izveštaji',
      'Email podrška',
    ],
    BASIC: [
      'Do 100 članova',
      'Napredni izveštaji',
      'Finansijsko praćenje',
      'Prioritetna podrška',
    ],
    PRO: [
      'Do 500 članova',
      'Svi izveštaji i analitika',
      'Napredne finansije i budžetiranje',
      'API pristup',
      'Dedicirana podrška',
      'Custom branding',
    ],
  };

  return features[plan] || features.FREE;
}
