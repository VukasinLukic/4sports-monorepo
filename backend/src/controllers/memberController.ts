import { Request, Response } from 'express';
import Member from '../models/Member';
import Group from '../models/Group';
import Club from '../models/Club';

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

export const getAllMembers = async (_req: Request, res: Response) => {
  try {
    console.log('👥 All members list requested');
    const members = await Member.find()
      .populate('parentId', 'firstName lastName email')
      .populate('clubs.groupId', 'name ageGroup')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${members.length} members`);
    return res.status(200).json({ status: 'success', results: members.length, data: members });
  } catch (error: any) {
    console.error('❌ Get Members Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch members' });
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
    const member = await Member.findById(id).populate('parentId', 'fullName email phoneNumber').populate('clubs.clubId', 'name').populate('clubs.groupId', 'name ageGroup');

    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Access control: PARENT can only see their own children, OWNER/COACH can see club members
    if (req.user.role === 'PARENT' && member.parentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    if (req.user.role !== 'PARENT' && !member.isInClub(req.user.clubId!)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    return res.status(200).json({ success: true, data: member });
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

    // Only parent can update
    if (member.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only parent can update member' } });
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

    // Only parent can delete
    if (member.parentId.toString() !== req.user._id.toString()) {
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
