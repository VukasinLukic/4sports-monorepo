import { Request, Response } from 'express';
import Member from '../models/Member';
import Group from '../models/Group';
import Event from '../models/Event';
import Payment from '../models/Payment';

/**
 * Get Dashboard Statistics
 * @route GET /api/v1/dashboard
 */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    console.log('📊 Dashboard stats requested');

    // Get counts from database
    const [totalMembers, totalGroups, totalEvents, recentPayments] = await Promise.all([
      Member.countDocuments(),
      Group.countDocuments(),
      Event.countDocuments(),
      Payment.find().sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate total revenue from payments
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentRevenue = totalRevenue[0]?.total || 0;

    const stats = {
      currentRevenue,
      totalRevenue: currentRevenue,
      newMembersPercentage: 12.5, // TODO: Calculate from last month
      totalMembers,
      totalTransactions: recentPayments.length,
      totalGroups,
      totalEvents,
      memberGrowth: [], // TODO: Implement monthly growth data
      balanceData: {
        income: currentRevenue,
        expenses: 0,
        balance: currentRevenue
      },
      quarterlyRevenue: [], // TODO: Implement quarterly data
      monthlyFinance: [] // TODO: Implement monthly finance data
    };

    console.log('✅ Dashboard stats:', stats);

    return res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch dashboard statistics'
    });
  }
};
