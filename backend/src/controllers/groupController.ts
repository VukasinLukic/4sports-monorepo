import { Request, Response } from 'express';
import Group from '../models/Group';
import User from '../models/User';

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

    const { name, ageGroup, sport, description, coaches } = req.body;
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

    if (coachIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'At least one coach is required' },
      });
    }

    // Verify all coaches exist and belong to the club
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

    // Create group
    const group = await Group.create({
      clubId,
      name,
      ageGroup,
      sport,
      description,
      coaches: coachIds,
    });

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

    const groups = await Group.findByClub(clubId);

    return res.status(200).json({
      success: true,
      data: groups,
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
    const { name, ageGroup, sport, description } = req.body;

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

    // Update fields
    if (name) group.name = name;
    if (ageGroup !== undefined) group.ageGroup = ageGroup;
    if (sport !== undefined) group.sport = sport;
    if (description !== undefined) group.description = description;

    await group.save();

    return res.status(200).json({
      success: true,
      data: group,
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
