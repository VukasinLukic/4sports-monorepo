import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Event from '../models/Event';
import Member from '../models/Member';

export const markAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { eventId, memberId, status, notes } = req.body;

    if (!eventId || !memberId || !status) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    const attendance = await Attendance.findOneAndUpdate(
      { eventId, memberId },
      { status, markedBy: req.user._id, markedAt: new Date(), notes },
      { new: true, upsert: true }
    ).populate('memberId', 'fullName');

    return res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('❌ Mark Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark attendance' } });
  }
};

export const getEventAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    const attendance = await Attendance.findByEvent(eventId as any);

    return res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('❌ Get Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch attendance' } });
  }
};

export const getMemberAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { memberId } = req.params;
    const attendance = await Attendance.findByMember(memberId as any);
    const rate = await Attendance.getAttendanceRate(memberId as any);

    return res.status(200).json({ success: true, data: { attendance, attendanceRate: rate } });
  } catch (error: any) {
    console.error('❌ Get Member Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch attendance' } });
  }
};

/**
 * Get last attendance (training) for a member
 */
export const getLastMemberAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { memberId } = req.params;

    // Find the most recent attendance where member was PRESENT or LATE
    const lastAttendance = await Attendance.findOne({
      memberId,
      status: { $in: ['PRESENT', 'LATE'] },
    })
      .sort({ markedAt: -1 })
      .populate('eventId', 'title startTime type');

    if (!lastAttendance) {
      return res.status(200).json({ success: true, data: null });
    }

    const event = lastAttendance.eventId as any;

    return res.status(200).json({
      success: true,
      data: {
        eventId: event?._id,
        eventTitle: event?.title,
        eventDate: event?.startTime,
        eventType: event?.type,
        status: lastAttendance.status,
        markedAt: lastAttendance.markedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Get Last Member Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch last attendance' } });
  }
};

/**
 * Get own attendance (for MEMBER role users)
 */
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // Find member linked to this user
    const member = await Member.findOne({ userId: req.user._id });
    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });
    }

    const attendance = await Attendance.findByMember(member._id);
    const rate = await Attendance.getAttendanceRate(member._id);

    return res.status(200).json({ success: true, data: { attendance, attendanceRate: rate } });
  } catch (error: any) {
    console.error('❌ Get My Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch attendance' } });
  }
};

/**
 * QR Check-in endpoint for PARENT and MEMBER roles
 * @route POST /api/v1/attendance/check-in
 * @access Private (PARENT, MEMBER)
 */
export const checkIn = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { eventId, memberId } = req.body;

    if (!eventId || !memberId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'eventId and memberId are required' } });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    // Verify member exists and belongs to the same club
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }

    // Check if user has permission to check in this member
    // PARENT can check in their children
    // MEMBER can check in themselves
    const isParent = req.user.role === 'PARENT' && member.parentId?.toString() === req.user._id.toString();
    const isSelf = req.user.role === 'MEMBER' && member.userId?.toString() === req.user._id.toString();

    if (!isParent && !isSelf) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only check in yourself or your children' } });
    }

    // Check if event is today
    const now = new Date();
    const eventStart = new Date(event.startTime);

    // Get start and end of event day (00:00:00 - 23:59:59)
    const eventDayStart = new Date(eventStart);
    eventDayStart.setHours(0, 0, 0, 0);

    const eventDayEnd = new Date(eventStart);
    eventDayEnd.setHours(23, 59, 59, 999);

    // Allow check-in only on the same day as the event
    if (now < eventDayStart) {
      const eventDateStr = eventStart.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' });
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_EARLY',
          message: `Check-in je moguć samo na dan događaja (${eventDateStr})`
        }
      });
    }
    if (now > eventDayEnd) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_ENDED',
          message: 'Događaj je prošao. Check-in više nije moguć.'
        }
      });
    }

    // Determine if late
    const isLate = now > eventStart;

    // Update attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { eventId, memberId },
      {
        status: isLate ? 'LATE' : 'PRESENT',
        checkinTime: now,
        checkinMethod: 'QR',
        markedBy: req.user._id,
        markedAt: now,
      },
      { new: true, upsert: true }
    ).populate('memberId', 'fullName');

    return res.status(200).json({
      success: true,
      data: {
        attendance,
        event: { _id: event._id, title: event.title },
      },
      message: isLate ? 'Checked in (late)' : 'Checked in successfully',
    });
  } catch (error: any) {
    console.error('❌ Check-in Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check in' } });
  }
};

export const bulkMarkAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { eventId, attendances } = req.body;

    if (!eventId || !Array.isArray(attendances)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    const bulkOps = attendances.map((att: any) => ({
      updateOne: {
        filter: { eventId, memberId: att.memberId },
        update: { status: att.status, markedBy: req.user!._id, markedAt: new Date(), notes: att.notes },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (error: any) {
    console.error('❌ Bulk Mark Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark attendance' } });
  }
};
