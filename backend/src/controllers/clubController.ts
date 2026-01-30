import { Request, Response } from 'express';
import Club from '../models/Club';

/**
 * Get club by ID
 * @route GET /api/v1/clubs/:id
 * @access Protected
 */
export const getClubById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const club = await Club.findById(id).select('-__v');

    if (!club) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLUB_NOT_FOUND',
          message: 'Club not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error: any) {
    console.error('❌ Get Club Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch club',
      },
    });
  }
};
