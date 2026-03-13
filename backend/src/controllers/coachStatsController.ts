import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Group from '../models/Group';
import Member from '../models/Member';
import Event from '../models/Event';
import Attendance from '../models/Attendance';
import Payment from '../models/Payment';

/**
 * Get Comprehensive Coach Stats
 * @route GET /api/v1/coaches/:id/stats
 * @access Protected (OWNER, COACH)
 *
 * Returns aggregated statistics for a specific coach:
 * - KPI cards (members, revenue, events, attendance)
 * - Groups with member counts and revenue
 * - Event statistics and upcoming events
 * - Attendance distribution
 * - Members list with group assignment
 */
export const getCoachStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: coachId } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    // Verify coach exists and is in same club
    const coach = await User.findById(coachId).select('fullName email phoneNumber profileImage role clubId createdAt').lean();
    if (!coach) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Coach not found' } });
    }

    if (coach.role !== 'COACH') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'User is not a coach' } });
    }

    const clubId = coach.clubId;
    const coachObjId = new mongoose.Types.ObjectId(coachId);
    const clubObjId = new mongoose.Types.ObjectId(String(clubId));
    const now = new Date();
    
    // Parse query params or fallback to current month/year
    const queryMonth = req.query.month ? parseInt(req.query.month as string) : (now.getMonth() + 1);
    const queryYear = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    
    // Limits for the selected month
    const selectedMonthStart = new Date(queryYear, queryMonth - 1, 1);
    const selectedMonthEnd = new Date(queryYear, queryMonth, 0, 23, 59, 59);

    // ═══ 1. Get coach's groups ═══
    const groups = await Group.find({ coaches: coachObjId, isActive: true })
      .populate('coaches', 'fullName profileImage')
      .lean();
    const groupIds = groups.map(g => g._id);

    // ═══ 2. Get members in coach's groups ═══
    const members = await Member.find({
      'clubs.clubId': clubObjId,
      'clubs.groupId': { $in: groupIds },
      'clubs.status': 'ACTIVE',
    }).lean();
    const memberIds = members.map(m => m._id);

    // ═══ 3. Aggregate data in parallel ═══
    const [
      paymentsCurrentMonth,
      paymentsTotal,
      eventsTotal,
      eventsThisMonth,
      eventsByType,
      upcomingEvents,
      attendanceStats,
    ] = await Promise.all([
      // Selected month payments for coach's members
      Payment.aggregate([
        {
          $match: {
            clubId: clubObjId,
            memberId: { $in: memberIds },
            type: 'MEMBERSHIP',
            'period.month': queryMonth,
            'period.year': queryYear,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalPaid: { $sum: '$paidAmount' },
          },
        },
      ]),

      // Total payments (all time) for coach's members
      Payment.aggregate([
        {
          $match: {
            clubId: clubObjId,
            memberId: { $in: memberIds },
            type: 'MEMBERSHIP',
          },
        },
        {
          $group: {
            _id: null,
            totalExpected: { $sum: '$amount' },
            totalPaid: { $sum: '$paidAmount' },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
            totalCount: { $sum: 1 },
          },
        },
      ]),

      // Total events in coach's groups
      Event.countDocuments({
        clubId: clubObjId,
        groupId: { $in: groupIds },
        status: { $ne: 'CANCELLED' },
      }),

      // Events in selected month
      Event.countDocuments({
        clubId: clubObjId,
        groupId: { $in: groupIds },
        startTime: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
        status: { $ne: 'CANCELLED' },
      }),

      // Events by type
      Event.aggregate([
        {
          $match: {
            clubId: clubObjId,
            groupId: { $in: groupIds },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),

      // Events list (from selected month, limited)
      Event.find({
        clubId: clubObjId,
        groupId: { $in: groupIds },
        startTime: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
        status: { $ne: 'CANCELLED' },
      })
        .populate('groupId', 'name color')
        .sort({ startTime: -1 })
        .limit(10)
        .lean(),

      // Attendance stats for events in selected month
      Attendance.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
        {
          $match: {
            'event.clubId': clubObjId,
            'event.groupId': { $in: groupIds },
            'event.status': { $ne: 'CANCELLED' },
            'event.startTime': { $gte: selectedMonthStart, $lte: selectedMonthEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // ═══ 4. Process data ═══

    // 4a. Group stats with member counts and revenue
    const groupMemberMap = new Map<string, any[]>();
    for (const member of members) {
      const clubEntry = member.clubs.find(
        (c: any) => c.clubId.toString() === clubObjId.toString() && c.status === 'ACTIVE'
      );
      if (clubEntry && clubEntry.groupId) {
        const gid = clubEntry.groupId.toString();
        if (!groupMemberMap.has(gid)) groupMemberMap.set(gid, []);
        groupMemberMap.get(gid)!.push(member);
      }
    }

    // Get per-group payment stats for selected month
    const groupPaymentStats = await Payment.aggregate([
      {
        $match: {
          clubId: clubObjId,
          memberId: { $in: memberIds },
          type: 'MEMBERSHIP',
          'period.month': queryMonth,
          'period.year': queryYear,
        },
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      {
        $addFields: {
          memberGroupId: {
            $let: {
              vars: {
                matchingClub: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$member.clubs',
                        as: 'c',
                        cond: { $eq: ['$$c.clubId', clubObjId] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: '$$matchingClub.groupId',
            },
          },
        },
      },
      {
        $group: {
          _id: '$memberGroupId',
          totalExpected: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const groupPaymentMap = new Map<string, any>();
    for (const gp of groupPaymentStats) {
      if (gp._id) groupPaymentMap.set(gp._id.toString(), gp);
    }

    const groupsData = groups.map((group: any) => {
      const gid = group._id.toString();
      const groupMembers = groupMemberMap.get(gid) || [];
      const paymentInfo = groupPaymentMap.get(gid);
      const fee = group.membershipFee || 3000;

      return {
        _id: gid,
        name: group.name,
        color: group.color || '#3b82f6',
        ageGroup: group.ageGroup,
        membershipFee: fee,
        memberCount: groupMembers.length,
        coaches: (group.coaches || []).map((c: any) => ({
          _id: c._id?.toString() || c.toString(),
          fullName: c.fullName || 'Unknown',
          profileImage: c.profileImage,
        })),
        payments: {
          expected: paymentInfo?.totalExpected || fee * groupMembers.length,
          paid: paymentInfo?.totalPaid || 0,
          paidCount: paymentInfo?.paidCount || 0,
          totalCount: paymentInfo?.totalCount || groupMembers.length,
          collectionRate: paymentInfo && paymentInfo.totalExpected > 0
            ? Math.round((paymentInfo.totalPaid / paymentInfo.totalExpected) * 100)
            : 0,
        },
      };
    });

    // 4b. KPI summary
    const totalMembers = members.length;
    const totalPaymentsData = paymentsTotal[0] || { totalExpected: 0, totalPaid: 0, paidCount: 0, totalCount: 0 };
    const currentMonthExpected = paymentsCurrentMonth.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    const currentMonthPaid = paymentsCurrentMonth.reduce((sum: number, p: any) => sum + p.totalPaid, 0);
    const unpaidThisMonth = totalMembers - (paymentsCurrentMonth.find((p: any) => p._id === 'PAID')?.count || 0);

    // Attendance KPI
    const totalAttendance = attendanceStats.reduce((sum: number, a: any) => sum + a.count, 0);
    const presentCount = attendanceStats
      .filter((a: any) => a._id === 'PRESENT' || a._id === 'LATE')
      .reduce((sum: number, a: any) => sum + a.count, 0);
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Attendance distribution
    const attendanceDistribution = {
      present: attendanceStats.find((a: any) => a._id === 'PRESENT')?.count || 0,
      late: attendanceStats.find((a: any) => a._id === 'LATE')?.count || 0,
      absent: attendanceStats.find((a: any) => a._id === 'ABSENT')?.count || 0,
      excused: attendanceStats.find((a: any) => a._id === 'EXCUSED')?.count || 0,
      total: totalAttendance,
    };

    // Event type breakdown
    const eventTypeMap: Record<string, number> = {};
    for (const et of eventsByType) {
      eventTypeMap[et._id] = et.count;
    }

    // Upcoming events with participant counts
    const upcomingEventsData = await Promise.all(
      upcomingEvents.map(async (event: any) => {
        const attendees = await Attendance.countDocuments({ eventId: event._id, rsvpStatus: 'CONFIRMED' });
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
          confirmedCount: attendees,
        };
      })
    );

    // Members list with group info
    const membersData = members.map((m: any) => {
      const clubEntry = m.clubs.find(
        (c: any) => c.clubId.toString() === clubObjId.toString() && c.status === 'ACTIVE'
      );
      return {
        _id: m._id.toString(),
        fullName: m.fullName,
        profileImage: m.profileImage,
        position: m.position,
        jerseyNumber: m.jerseyNumber,
        groupId: clubEntry?.groupId?.toString(),
      };
    });

    // ═══ 5. Build response ═══
    const data = {
      coach: {
        _id: coach._id.toString(),
        fullName: coach.fullName,
        email: coach.email,
        phoneNumber: coach.phoneNumber,
        profileImage: coach.profileImage,
        role: coach.role,
        createdAt: coach.createdAt,
      },
      kpi: {
        totalMembers,
        totalGroups: groups.length,
        monthlyRevenue: currentMonthPaid,
        monthlyExpected: currentMonthExpected,
        unpaidThisMonth: Math.max(0, unpaidThisMonth),
        attendanceRate,
        eventsThisMonth,
        eventsTotal,
        totalRevenue: totalPaymentsData.totalPaid,
        collectionRate: totalPaymentsData.totalExpected > 0
          ? Math.round((totalPaymentsData.totalPaid / totalPaymentsData.totalExpected) * 100)
          : 0,
      },
      groups: groupsData,
      attendance: attendanceDistribution,
      events: {
        total: eventsTotal,
        thisMonth: eventsThisMonth,
        byType: eventTypeMap,
        upcoming: upcomingEventsData,
      },
      members: membersData,
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Get Coach Stats Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch coach statistics' },
    });
  }
};
