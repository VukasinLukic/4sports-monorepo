import { Request, Response } from 'express';
import User from '../models/User';

/**
 * Get All Coaches
 * @route GET /api/v1/coaches
 */
export const getCoaches = async (_req: Request, res: Response) => {
  try {
    console.log('👨‍🏫 Coaches list requested');

    const coaches = await User.find({ role: 'COACH' })
      .select('firstName lastName email phoneNumber clubId createdAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${coaches.length} coaches`);

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
 */
export const getCoach = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`👨‍🏫 Coach details requested for ID: ${id}`);

    const coach = await User.findOne({ _id: id, role: 'COACH' })
      .select('firstName lastName email phoneNumber clubId createdAt');

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
