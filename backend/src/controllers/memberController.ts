import { Request, Response } from 'express';
import Member from '../models/Member';
import Group from '../models/Group';
import Club from '../models/Club';
import Payment from '../models/Payment';

export const createMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { fullName, dateOfBirth, gender, groupId, medicalInfo, emergencyContact } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!fullName || !dateOfBirth || !gender || !groupId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const group = await Group.findById(groupId);
    if (!group || group.clubId.toString() !== clubId.toString()) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } });

    if (!club.canAddMembers(1)) return res.status(400).json({ success: false, error: { code: 'MEMBER_LIMIT_REACHED', message: 'Club has reached member limit' } });

    const member = await Member.create({
      fullName,
      dateOfBirth,
      gender,
      parentId: req.user._id,
      clubs: [{ clubId, groupId, joinedAt: new Date(), status: 'ACTIVE' }],
      medicalInfo,
      emergencyContact,
    });

    await club.incrementMembers(1);

    return res.status(201).json({ success: true, data: member });
  } catch (error: any) {
    console.error('❌ Create Member Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create member' } });
  }
};

export const getParentMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const members = await Member.findByParent(req.user._id);

    return res.status(200).json({ success: true, data: members });
  } catch (error: any) {
    console.error('❌ Get Members Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch members' } });
  }
};

/**
 * Get own member profile (for MEMBER role users)
 * @description Returns the member entity linked to the authenticated user
 */
export const getMyMemberProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // Find member linked to this user
    const member = await Member.findOne({ userId: req.user._id })
      .populate('clubs.clubId', 'name')
      .populate('clubs.groupId', 'name ageGroup color');

    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });
    }

    // Compute enriched data
    const memberObj = member.toObject();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate age if dateOfBirth is set
    let age = null;
    if (member.dateOfBirth) {
      const birthDate = new Date(member.dateOfBirth);
      age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Get current month payment status
    const clubId = req.user.clubId;
    let paymentStatus = 'UNPAID';
    let lastPaymentDate = null;

    if (clubId) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const currentPayment = await Payment.findOne({
        clubId,
        memberId: member._id,
        type: 'MEMBERSHIP',
        'period.month': currentMonth,
        'period.year': currentYear,
      });

      if (currentPayment) {
        paymentStatus = currentPayment.status === 'PAID' ? 'PAID' : currentPayment.status === 'OVERDUE' ? 'UNPAID' : 'PARTIAL';
      }

      // Get last payment date
      const lastPayment = await Payment.findOne({
        clubId,
        memberId: member._id,
        status: 'PAID',
      }).sort({ paidDate: -1 });

      if (lastPayment) {
        lastPaymentDate = lastPayment.paidDate;
      }
    }

    // Medical status
    let medicalCheckStatus = 'EXPIRED';
    let medicalCheckExpiryDate = null;
    const expiryDate = member.medicalInfo?.expiryDate;
    if (expiryDate) {
      medicalCheckExpiryDate = expiryDate;
      const expiry = new Date(expiryDate);
      if (expiry > thirtyDaysFromNow) {
        medicalCheckStatus = 'VALID';
      } else if (expiry > now) {
        medicalCheckStatus = 'EXPIRING_SOON';
      }
    }

    // Get group info for this club
    const activeClub = member.clubs.find(c => c.clubId?.toString() === clubId?.toString() && c.status === 'ACTIVE');

    const enrichedMember = {
      ...memberObj,
      age,
      paymentStatus,
      lastPaymentDate,
      medicalCheckStatus,
      medicalCheckExpiryDate,
      groupId: activeClub?.groupId,
    };

    return res.status(200).json({ success: true, data: enrichedMember });
  } catch (error: any) {
    console.error('❌ Get My Member Profile Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch member profile' } });
  }
};

/**
 * Update own member profile (for MEMBER role users)
 * @description Allows MEMBER users to update their own profile
 */
export const updateMyMemberProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { fullName, dateOfBirth, gender, medicalInfo, emergencyContact } = req.body;

    const member = await Member.findOne({ userId: req.user._id });

    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });
    }

    // Update fields
    if (fullName) member.fullName = fullName;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;
    if (medicalInfo) member.medicalInfo = medicalInfo;
    if (emergencyContact) member.emergencyContact = emergencyContact;

    await member.save();

    return res.status(200).json({ success: true, data: member });
  } catch (error: any) {
    console.error('❌ Update My Member Profile Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update member profile' } });
  }
};

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    console.log('👥 Club members list requested for club:', clubId);

    // Get members for this club
    const members = await Member.find({
      'clubs.clubId': clubId,
      'clubs.status': 'ACTIVE',
    })
      .populate('parentId', 'fullName email phoneNumber')
      .populate('clubs.groupId', 'name ageGroup color')
      .sort({ fullName: 1 });

    // Get current month payments
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const payments = await Payment.find({
      clubId,
      memberId: { $in: members.map(m => m._id) },
      type: 'MEMBERSHIP',
      'period.month': currentMonth,
      'period.year': currentYear,
    });

    const paymentMap = new Map(payments.map(p => [p.memberId.toString(), p]));

    // Compute statuses for each member
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const enrichedMembers = members.map(member => {
      const memberObj = member.toObject();

      // Calculate age if dateOfBirth is set
      let age = null;
      if (member.dateOfBirth) {
        const birthDate = new Date(member.dateOfBirth);
        age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Payment status
      const payment = paymentMap.get(member._id.toString());
      let paymentStatus = 'UNPAID';
      if (payment) {
        paymentStatus = payment.status === 'PAID' ? 'PAID' : payment.status === 'OVERDUE' ? 'UNPAID' : 'PARTIAL';
      }

      // Medical status
      let medicalCheckStatus = 'EXPIRED';
      const expiryDate = member.medicalInfo?.expiryDate;
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        if (expiry > thirtyDaysFromNow) {
          medicalCheckStatus = 'VALID';
        } else if (expiry > now) {
          medicalCheckStatus = 'EXPIRING_SOON';
        }
      }

      // Get group info
      const activeClub = member.clubs.find(c => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE');

      return {
        ...memberObj,
        age,
        paymentStatus,
        medicalCheckStatus,
        groupId: activeClub?.groupId,
      };
    });

    console.log(`✅ Found ${enrichedMembers.length} members`);
    return res.status(200).json({ success: true, data: enrichedMembers });
  } catch (error: any) {
    console.error('❌ Get Members Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch members' } });
  }
};

export const getClubMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const members = await Member.findByClub(clubId);

    return res.status(200).json({ success: true, data: members });
  } catch (error: any) {
    console.error('❌ Get Club Members Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch members' } });
  }
};

export const getMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const member = await Member.findById(id).populate('parentId', 'fullName email phoneNumber').populate('clubs.clubId', 'name').populate('clubs.groupId', 'name ageGroup color');

    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Access control:
    // - PARENT can only see their own children
    // - MEMBER can only see their own profile
    // - OWNER/COACH can see club members
    if (req.user.role === 'PARENT') {
      const parentIdRaw = member.parentId as any;
      const parentId = parentIdRaw && typeof parentIdRaw === 'object' && '_id' in parentIdRaw
        ? parentIdRaw._id.toString()
        : parentIdRaw?.toString();
      if (parentId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
    } else if (req.user.role === 'MEMBER') {
      // MEMBER can only see their own profile
      const userIdRaw = member.userId as any;
      const userId = userIdRaw && typeof userIdRaw === 'object' && '_id' in userIdRaw
        ? userIdRaw._id.toString()
        : userIdRaw?.toString();
      if (userId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
    } else {
      // OWNER or COACH - check if member belongs to their club
      const clubId = req.user.clubId;
      if (!clubId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
      }
      if (!member.isInClub(clubId)) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Member not in your club' } });
      }
    }

    // Compute enriched data for the response
    const memberObj = member.toObject();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate age if dateOfBirth is set
    let age = null;
    if (member.dateOfBirth) {
      const birthDate = new Date(member.dateOfBirth);
      age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Get current month payment status
    const clubId = req.user.clubId;
    let paymentStatus = 'UNPAID';
    let lastPaymentDate = null;

    if (clubId) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const currentPayment = await Payment.findOne({
        clubId,
        memberId: member._id,
        type: 'MEMBERSHIP',
        'period.month': currentMonth,
        'period.year': currentYear,
      });

      if (currentPayment) {
        paymentStatus = currentPayment.status === 'PAID' ? 'PAID' : currentPayment.status === 'OVERDUE' ? 'UNPAID' : 'PARTIAL';
      }

      // Get last payment date
      const lastPayment = await Payment.findOne({
        clubId,
        memberId: member._id,
        status: 'PAID',
      }).sort({ paidDate: -1 });

      if (lastPayment) {
        lastPaymentDate = lastPayment.paidDate;
      }
    }

    // Medical status
    let medicalCheckStatus = 'EXPIRED';
    let medicalCheckExpiryDate = null;
    const expiryDate = member.medicalInfo?.expiryDate;
    if (expiryDate) {
      medicalCheckExpiryDate = expiryDate;
      const expiry = new Date(expiryDate);
      if (expiry > thirtyDaysFromNow) {
        medicalCheckStatus = 'VALID';
      } else if (expiry > now) {
        medicalCheckStatus = 'EXPIRING_SOON';
      }
    }

    // Get group info for this club
    const activeClub = member.clubs.find(c => c.clubId?.toString() === clubId?.toString() && c.status === 'ACTIVE');

    const enrichedMember = {
      ...memberObj,
      age,
      paymentStatus,
      lastPaymentDate,
      medicalCheckStatus,
      medicalCheckExpiryDate,
      groupId: activeClub?.groupId,
    };

    return res.status(200).json({ success: true, data: enrichedMember });
  } catch (error: any) {
    console.error('❌ Get Member Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch member' } });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const { fullName, dateOfBirth, gender, medicalInfo, emergencyContact } = req.body;

    const member = await Member.findById(id);

    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Only parent (for children) or the member themselves can update
    const isParent = member.parentId && member.parentId.toString() === req.user._id.toString();
    const isSelf = member.userId && member.userId.toString() === req.user._id.toString();
    if (!isParent && !isSelf) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    if (fullName) member.fullName = fullName;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;
    if (medicalInfo) member.medicalInfo = medicalInfo;
    if (emergencyContact) member.emergencyContact = emergencyContact;

    await member.save();

    return res.status(200).json({ success: true, data: member });
  } catch (error: any) {
    console.error('❌ Update Member Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update member' } });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const member = await Member.findById(id);

    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Only parent can delete children (self-registered members cannot delete themselves here)
    const isParent = member.parentId && member.parentId.toString() === req.user._id.toString();
    if (!isParent) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only parent can delete member' } });
    }

    // Decrement club member counts
    for (const clubMembership of member.clubs) {
      if (clubMembership.status === 'ACTIVE') {
        const club = await Club.findById(clubMembership.clubId);
        if (club) await club.decrementMembers(1);
      }
    }

    await Member.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Member Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete member' } });
  }
};
