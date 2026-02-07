import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Member from '../models/Member';
import Group from '../models/Group';
import Event from '../models/Event';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';
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

// Helper: calculate percentage trend (handles division by zero)
function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Get Coach Dashboard V2 (comprehensive financial dashboard)
 * @route GET /api/v1/dashboard/coach/v2
 * @access Private (OWNER, COACH)
 */
export const getCoachDashboardV2 = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const clubObjId = new mongoose.Types.ObjectId(String(clubId));
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based
    const currentYear = now.getFullYear();
    const selectedYear = parseInt(req.query.year as string) || currentYear;

    // Date ranges
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

    // ─── Run all aggregations in parallel ───
    const [
      currentMonthFinance,
      prevMonthFinance,
      unpaidCurrent,
      unpaidPrev,
      monthlyFinanceAgg,
      groups,
      members,
      paymentMethodAgg,
      recentTransactions,
      totalTransactionCount,
      prevMonthTransactionCount,
    ] = await Promise.all([
      // 1. Current month finance totals
      Transaction.aggregate([
        { $match: { clubId: clubObjId, transactionDate: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),

      // 2. Previous month finance totals
      Transaction.aggregate([
        { $match: { clubId: clubObjId, transactionDate: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),

      // 3. Unpaid payments current month
      Payment.countDocuments({
        clubId: clubObjId,
        type: 'MEMBERSHIP',
        'period.month': currentMonth + 1,
        'period.year': currentYear,
        status: { $ne: 'PAID' },
      }),

      // 4. Unpaid payments previous month
      Payment.countDocuments({
        clubId: clubObjId,
        type: 'MEMBERSHIP',
        'period.month': currentMonth === 0 ? 12 : currentMonth,
        'period.year': currentMonth === 0 ? currentYear - 1 : currentYear,
        status: { $ne: 'PAID' },
      }),

      // 5. Monthly finance for selected year
      Transaction.aggregate([
        { $match: { clubId: clubObjId, transactionDate: { $gte: yearStart, $lte: yearEnd } } },
        {
          $group: {
            _id: { month: { $month: '$transactionDate' }, type: '$type' },
            total: { $sum: '$amount' },
          },
        },
      ]),

      // 6. All groups for this club
      Group.find({ clubId: clubObjId, isActive: true }).lean(),

      // 7. All active members for this club
      Member.find({ 'clubs.clubId': clubObjId, 'clubs.status': 'ACTIVE' }).lean(),

      // 8. Payment method breakdown (all PAID payments)
      Payment.aggregate([
        { $match: { clubId: clubObjId, status: 'PAID' } },
        {
          $group: {
            _id: { $ifNull: ['$paymentMethod', 'OTHER'] },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 9. Recent transactions
      Transaction.find({ clubId: clubObjId })
        .sort({ transactionDate: -1 })
        .limit(15)
        .select('type category description amount transactionDate createdAt')
        .lean(),

      // 10. Total transaction count current month
      Transaction.countDocuments({
        clubId: clubObjId,
        transactionDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
      }),

      // 11. Total transaction count previous month
      Transaction.countDocuments({
        clubId: clubObjId,
        transactionDate: { $gte: prevMonthStart, $lte: prevMonthEnd },
      }),
    ]);

    // ─── Process KPI Cards ───
    const curIncome = currentMonthFinance.find((r: any) => r._id === 'INCOME')?.total || 0;
    const curExpense = currentMonthFinance.find((r: any) => r._id === 'EXPENSE')?.total || 0;
    const prevIncome = prevMonthFinance.find((r: any) => r._id === 'INCOME')?.total || 0;
    const prevExpense = prevMonthFinance.find((r: any) => r._id === 'EXPENSE')?.total || 0;

    const kpiCards = {
      totalIncome: curIncome,
      totalExpense: curExpense,
      profit: curIncome - curExpense,
      unpaidCount: unpaidCurrent,
      incomeTrend: calcTrend(curIncome, prevIncome),
      expenseTrend: calcTrend(curExpense, prevExpense),
      profitTrend: calcTrend(curIncome - curExpense, prevIncome - prevExpense),
      unpaidTrend: calcTrend(unpaidCurrent, unpaidPrev),
    };

    // ─── Process Monthly Finance ───
    const monthlyFinance = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));
    for (const row of monthlyFinanceAgg) {
      const idx = (row._id as any).month - 1;
      if ((row._id as any).type === 'INCOME') {
        monthlyFinance[idx].income = (row as any).total;
      } else {
        monthlyFinance[idx].expense = (row as any).total;
      }
    }

    // ─── Process Group Stats ───
    // Build member-to-group mapping
    const groupMemberMap = new Map<string, string[]>();
    for (const group of groups) {
      groupMemberMap.set(group._id.toString(), []);
    }
    for (const member of members) {
      const clubEntry = member.clubs.find(
        (c: any) => c.clubId.toString() === clubObjId.toString() && c.status === 'ACTIVE'
      );
      if (clubEntry) {
        const gid = clubEntry.groupId.toString();
        if (groupMemberMap.has(gid)) {
          groupMemberMap.get(gid)!.push(member._id.toString());
        }
      }
    }

    // Get income per group via Payment aggregation
    const memberIds = members.map((m: any) => m._id);

    const groupPayments = memberIds.length > 0
      ? await Payment.aggregate([
          { $match: { clubId: clubObjId, memberId: { $in: memberIds }, status: 'PAID' } },
          { $group: { _id: '$memberId', totalPaid: { $sum: '$amount' } } },
        ])
      : [];

    const memberPaymentMap = new Map<string, number>();
    for (const gp of groupPayments) {
      memberPaymentMap.set(gp._id.toString(), gp.totalPaid);
    }

    const groupStats = groups.map((group: any) => {
      const gid = group._id.toString();
      const memberIdsInGroup = groupMemberMap.get(gid) || [];
      const totalIncome = memberIdsInGroup.reduce(
        (sum, mid) => sum + (memberPaymentMap.get(mid) || 0),
        0
      );
      return {
        groupId: gid,
        groupName: group.name,
        groupColor: group.color || '#3b82f6',
        memberCount: memberIdsInGroup.length,
        totalIncome,
        totalExpense: 0,
        profit: totalIncome,
      };
    });

    // ─── Process Member Growth ───
    // Count members by joinedAt month for current year
    const memberMonthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      newCount: 0,
      count: 0,
    }));

    // Count new members per month
    for (const member of members) {
      const clubEntry = member.clubs.find(
        (c: any) => c.clubId.toString() === clubObjId.toString()
      );
      const joinDate = clubEntry?.joinedAt || (member as any).createdAt;
      if (joinDate) {
        const d = new Date(joinDate);
        if (d.getFullYear() === selectedYear) {
          memberMonthlyData[d.getMonth()].newCount++;
        }
      }
    }

    // Build cumulative counts
    // Start with members who joined before selected year
    let cumulativeBase = 0;
    for (const member of members) {
      const clubEntry = member.clubs.find(
        (c: any) => c.clubId.toString() === clubObjId.toString()
      );
      const joinDate = clubEntry?.joinedAt || (member as any).createdAt;
      if (joinDate && new Date(joinDate) < yearStart) {
        cumulativeBase++;
      }
    }

    let runningTotal = cumulativeBase;
    for (const monthData of memberMonthlyData) {
      runningTotal += monthData.newCount;
      monthData.count = runningTotal;
    }

    const currentMonthIdx = selectedYear === currentYear ? currentMonth : 11;
    const prevMonthIdx = currentMonthIdx > 0 ? currentMonthIdx - 1 : 0;
    const newThisMonth = memberMonthlyData[currentMonthIdx]?.newCount || 0;
    const newPrevMonth = memberMonthlyData[prevMonthIdx]?.newCount || 0;

    const memberGrowth = {
      totalMembers: members.length,
      memberTrend: calcTrend(
        memberMonthlyData[currentMonthIdx]?.count || 0,
        memberMonthlyData[prevMonthIdx]?.count || members.length
      ),
      newMembersThisMonth: newThisMonth,
      newMembersTrend: calcTrend(newThisMonth, newPrevMonth),
      monthlyData: memberMonthlyData,
    };

    // ─── Process Payment Method Breakdown ───
    const totalBalance = paymentMethodAgg.reduce((s: number, r: any) => s + r.amount, 0);
    const paymentMethodBreakdown = {
      totalBalance,
      methods: paymentMethodAgg.map((r: any) => ({
        method: r._id,
        amount: r.amount,
        count: r.count,
      })),
    };

    // ─── Build Response ───
    const data = {
      kpiCards,
      monthlyFinance,
      groupStats,
      memberGrowth,
      paymentMethodBreakdown,
      recentTransactions: recentTransactions.map((t: any) => ({
        _id: t._id.toString(),
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        transactionDate: t.transactionDate,
        createdAt: t.createdAt,
      })),
      totalTransactionCount,
      transactionCountTrend: calcTrend(totalTransactionCount, prevMonthTransactionCount),
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Dashboard V2 error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch dashboard data' },
    });
  }
};
