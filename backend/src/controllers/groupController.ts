import { Request, Response } from 'express';
import Group from '../models/Group';
import User from '../models/User';
import Member from '../models/Member';
import Payment from '../models/Payment';

/**
 * Create Group
 * @route POST /api/v1/groups
 * @access Private (OWNER, COACH)
 */
export const createGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { name, coaches, color, membershipFee } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You must be associated with a club' },
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Group name is required' },
      });
    }

    // Default coaches to current user if COACH role
    let coachIds = coaches || [];
    if (coachIds.length === 0 && req.user.role === 'COACH') {
      coachIds = [req.user._id];
    }

    // Verify coaches if provided
    if (coachIds.length > 0) {
      const coachUsers = await User.find({
        _id: { $in: coachIds },
        role: 'COACH',
        clubId,
      });

      if (coachUsers.length !== coachIds.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_COACHES', message: 'One or more coaches are invalid' },
        });
      }
    }

    // Create group
    const groupData: any = {
      clubId,
      name,
      color,
      coaches: coachIds,
    };
    if (membershipFee !== undefined) {
      groupData.membershipFee = membershipFee;
    }

    const group = await Group.create(groupData);

    return res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('❌ Create Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create group' },
    });
  }
};

/**
 * Get Club Groups
 * @route GET /api/v1/groups
 * @access Private (OWNER, COACH, PARENT)
 */
export const getClubGroups = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You must be associated with a club' },
      });
    }

    // Filter groups based on user role
    let groups;
    if (req.user.role === 'COACH') {
      // Coaches only see groups they are assigned to
      groups = await Group.findByCoach(req.user._id);
    } else {
      // OWNER and PARENT see all club groups
      groups = await Group.findByClub(clubId);
    }

    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await Member.countDocuments({
          'clubs.groupId': group._id,
          'clubs.status': 'ACTIVE',
        });
        return {
          ...group.toObject(),
          memberCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: groupsWithCounts,
    });
  } catch (error: any) {
    console.error('❌ Get Groups Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch groups' },
    });
  }
};

/**
 * Get Single Group
 * @route GET /api/v1/groups/:id
 * @access Private (OWNER, COACH, PARENT)
 */
export const getGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const group = await Group.findById(id)
      .populate('coaches', 'fullName email')
      .populate('clubId', 'name');

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access (must be in same club)
    if (group.clubId._id.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    return res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('❌ Get Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch group' },
    });
  }
};

/**
 * Update Group
 * @route PUT /api/v1/groups/:id
 * @access Private (OWNER, COACH)
 */
export const updateGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { name, color, coaches, membershipFee } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access
    if (group.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    // Save old membershipFee BEFORE updating
    const oldMembershipFee = group.membershipFee;

    // Update fields
    if (name) group.name = name;
    if (color !== undefined) group.color = color;
    if (membershipFee !== undefined) group.membershipFee = membershipFee;

    // Update coaches if provided
    if (coaches !== undefined) {
      if (coaches.length > 0) {
        const coachUsers = await User.find({
          _id: { $in: coaches },
          role: 'COACH',
          clubId: req.user.clubId,
        });
        if (coachUsers.length !== coaches.length) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_COACHES', message: 'One or more coaches are invalid' },
          });
        }
      }
      group.coaches = coaches;
    }

    // Track if membershipFee changed
    const membershipFeeChanged = membershipFee !== undefined && oldMembershipFee !== membershipFee;

    await group.save();

    // If membershipFee changed, update upcoming payments for all members in this group
    if (membershipFeeChanged && membershipFee !== undefined) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Update membershipFee for all group members and their payments
      const members = await Member.find({ 'clubs.groupId': group._id, 'clubs.status': 'ACTIVE' });
      for (const member of members) {
        // Update member's membershipFee if it matches old group fee or is not set
        if (!member.membershipFee || member.membershipFee === oldMembershipFee) {
          member.membershipFee = membershipFee;
          await member.save();
        }

        // Update existing payment for next month if it exists (don't create new ones)
        const existingPayment = await Payment.findOne({
          clubId: req.user.clubId,
          memberId: member._id,
          type: 'MEMBERSHIP',
          'period.month': nextMonth.getMonth() + 1,
          'period.year': nextMonth.getFullYear(),
        });

        if (existingPayment) {
          // Update existing payment with new amount
          existingPayment.amount = membershipFee;
          await existingPayment.save();
        }
      }
    }

    const populated = await Group.findById(group._id).populate('coaches', 'fullName email');

    return res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error: any) {
    console.error('❌ Update Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update group' },
    });
  }
};

/**
 * Delete Group
 * @route DELETE /api/v1/groups/:id
 * @access Private (OWNER only)
 */
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access
    if (group.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    await Group.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Delete Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete group' },
    });
  }
};

/**
 * Get Group Members
 * @route GET /api/v1/groups/:id/members
 * @access Private (OWNER, COACH, PARENT)
 */
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access (must be in same club)
    if (group.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    const members = await Member.findByGroup(group._id);

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    console.error('❌ Get Group Members Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch group members' },
    });
  }
};

/**
 * Add Member to Group
 * @route POST /api/v1/groups/:id/members
 * @access Private (OWNER, COACH)
 */
export const addMemberToGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Member ID is required' },
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access (must be in same club)
    if (group.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
      });
    }

    // Check if member is already in this group
    if (member.isInGroup(group._id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_IN_GROUP', message: 'Member is already in this group' },
      });
    }

    // Add member to the group
    await member.addToClub(group.clubId, group._id);

    // Assign group's membershipFee to member if group has one
    if (group.membershipFee && !member.membershipFee) {
      member.membershipFee = group.membershipFee;
      await member.save();
    }

    // Auto-generate payment record for next month if group has membershipFee
    if (group.membershipFee) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Check if payment already exists for next month
      const existingPayment = await Payment.findOne({
        clubId: group.clubId,
        memberId: member._id,
        type: 'MEMBERSHIP',
        'period.month': nextMonth.getMonth() + 1,
        'period.year': nextMonth.getFullYear(),
      });

      if (!existingPayment) {
        await Payment.create({
          clubId: group.clubId,
          memberId: member._id,
          type: 'MEMBERSHIP',
          amount: group.membershipFee,
          paidAmount: 0,
          status: 'PENDING',
          dueDate: nextMonth,
          createdBy: req.user._id,
          period: {
            month: nextMonth.getMonth() + 1,
            year: nextMonth.getFullYear(),
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Member added to group successfully',
      data: member,
    });
  } catch (error: any) {
    console.error('❌ Add Member to Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add member to group' },
    });
  }
};

/**
 * Remove Member from Group
 * @route DELETE /api/v1/groups/:id/members/:memberId
 * @access Private (OWNER, COACH)
 */
export const removeMemberFromGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id, memberId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
      });
    }

    // Verify access (must be in same club)
    if (group.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
      });
    }

    // Check if member is in this group
    if (!member.isInGroup(group._id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_IN_GROUP', message: 'Member is not in this group' },
      });
    }

    // Remove member from the club (sets status to INACTIVE)
    await member.removeFromClub(group.clubId);

    return res.status(200).json({
      success: true,
      message: 'Member removed from group successfully',
    });
  } catch (error: any) {
    console.error('❌ Remove Member from Group Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to remove member from group' },
    });
  }
};
