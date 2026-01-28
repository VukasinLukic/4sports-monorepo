import { Request, Response } from 'express';
import Member from '../models/Member';
import Group from '../models/Group';
import Event from '../models/Event';
import Payment from '../models/Payment';
import Attendance from '../models/Attendance';

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

/**
 * Get Coach Dashboard Statistics (Club-specific)
 * @route GET /api/v1/dashboard/coach
 * @access Private (OWNER, COACH)
 */
export const getCoachDashboardStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    console.log('📊 Coach dashboard stats requested for club:', clubId);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Current month for payment status
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get all members for this club
    const members = await Member.find({
      'clubs.clubId': clubId,
      'clubs.status': 'ACTIVE',
    });

    // Get counts in parallel
    const [
      totalGroups,
      eventsToday,
      unpaidPayments,
      upcomingEventsRaw,
    ] = await Promise.all([
      // Total groups in club
      Group.countDocuments({ clubId }),

      // Events today
      Event.countDocuments({
        clubId,
        startTime: { $gte: today, $lt: tomorrow },
        status: { $ne: 'CANCELLED' },
      }),

      // Unpaid payments for current month
      Payment.countDocuments({
        clubId,
        type: 'MEMBERSHIP',
        'period.month': currentMonth,
        'period.year': currentYear,
        status: { $ne: 'PAID' },
      }),

      // Upcoming events (next 7 days)
      Event.find({
        clubId,
        startTime: { $gte: today },
        status: 'SCHEDULED',
      })
        .populate('groupId', 'name color')
        .sort({ startTime: 1 })
        .limit(5),
    ]);

    // Count members with expired or expiring medical checks
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    let medicalDueCount = 0;
    for (const member of members) {
      const expiryDate = member.medicalInfo?.expiryDate;
      if (!expiryDate || new Date(expiryDate) <= thirtyDaysFromNow) {
        medicalDueCount++;
      }
    }

    // Get participant stats for upcoming events
    const upcomingEvents = await Promise.all(
      upcomingEventsRaw.map(async (event) => {
        const attendance = await Attendance.find({ eventId: event._id });
        const confirmedCount = attendance.filter(a => a.rsvpStatus === 'CONFIRMED').length;
        const pendingCount = attendance.filter(a => !a.rsvpStatus || a.rsvpStatus === 'PENDING').length;

        const groupInfo = event.groupId as any;
        return {
          _id: event._id.toString(),
          title: event.title,
          type: event.type,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          groupName: groupInfo?.name || 'Unknown',
          groupColor: groupInfo?.color,
          confirmedCount,
          pendingCount,
          totalParticipants: attendance.length,
        };
      })
    );

    // Calculate total revenue for club
    const revenueResult = await Payment.aggregate([
      { $match: { clubId, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const stats = {
      totalMembers: members.length,
      eventsToday,
      unpaidCount: unpaidPayments,
      medicalDueCount,
      totalGroups,
      totalEvents: await Event.countDocuments({ clubId }),
      totalRevenue,
      upcomingEvents,
    };

    console.log('✅ Coach dashboard stats:', stats);

    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('❌ Coach dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch dashboard statistics' },
    });
  }
};
