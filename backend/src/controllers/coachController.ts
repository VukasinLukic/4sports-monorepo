import { Request, Response } from 'express';
import User from '../models/User';

/**
 * Get All Coaches
 * @route GET /api/v1/coaches
 * @access Protected - returns only coaches from the user's club
 */
export const getCoaches = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('👨‍🏫 Coaches list requested by:', user?.email, 'clubId:', user?.clubId);

    if (!user?.clubId) {
      return res.status(400).json({
        status: 'error',
        message: 'User has no club associated'
      });
    }

    const coaches = await User.find({ role: 'COACH', clubId: user.clubId })
      .select('firstName lastName fullName email phoneNumber profileImage clubId createdAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${coaches.length} coaches for club ${user.clubId}`);

    return res.status(200).json({
      status: 'success',
      results: coaches.length,
      data: coaches
    });
  } catch (error: any) {
    console.error('❌ Get coaches error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch coaches'
    });
  }
};

/**
 * Get Single Coach
 * @route GET /api/v1/coaches/:id
 * @access Protected - can only view coaches from own club
 */
export const getCoach = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    console.log(`👨‍🏫 Coach details requested for ID: ${id} by user: ${user?.email}`);

    if (!user?.clubId) {
      return res.status(400).json({
        status: 'error',
        message: 'User has no club associated'
      });
    }

    const coach = await User.findOne({ _id: id, role: 'COACH', clubId: user.clubId })
      .select('firstName lastName fullName email phoneNumber profileImage clubId createdAt');

    if (!coach) {
      return res.status(404).json({
        status: 'error',
        message: 'Coach not found'
      });
    }

    console.log('✅ Coach found:', coach.email);

    return res.status(200).json({
      status: 'success',
      data: coach
    });
  } catch (error: any) {
    console.error('❌ Get coach error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch coach'
    });
  }
};
