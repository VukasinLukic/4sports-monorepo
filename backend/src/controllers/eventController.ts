import { Request, Response } from 'express';
import Event from '../models/Event';
import Group from '../models/Group';
import Member from '../models/Member';
import Attendance from '../models/Attendance';

export const createEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { groupId, title, description, type, startTime, endTime, location, isMandatory, notes, equipment, maxParticipants, isRecurring, recurringPattern } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!groupId || !title || !type || !startTime || !endTime) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const group = await Group.findById(groupId);
    if (!group || group.clubId.toString() !== clubId.toString()) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });

    const event = await Event.create({
      clubId,
      groupId,
      title,
      description,
      type,
      startTime,
      endTime,
      location,
      isMandatory,
      notes,
      equipment,
      maxParticipants,
      isRecurring: isRecurring || false,
      recurringPattern,
      createdBy: req.user._id,
    });

    // Auto-create attendance records for all group members
    const members = await Member.findByGroup(groupId);
    const attendanceRecords = members.map(member => ({ eventId: event._id, memberId: member._id, status: 'ABSENT' }));
    if (attendanceRecords.length > 0) await Attendance.insertMany(attendanceRecords);

    return res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    console.error('❌ Create Event Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create event' } });
  }
};

export const getGroupEvents = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { groupId } = req.params;
    const events = await Event.findByGroup(groupId as any);

    return res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    console.error('❌ Get Events Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch events' } });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const event = await Event.findById(id).populate('groupId', 'name').populate('createdBy', 'fullName');

    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    return res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    console.error('❌ Get Event Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch event' } });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const { title, description, type, startTime, endTime, location, isMandatory, status, notes, equipment, maxParticipants } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (type) event.type = type;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (location !== undefined) event.location = location;
    if (isMandatory !== undefined) event.isMandatory = isMandatory;
    if (status) event.status = status;
    if (notes !== undefined) event.notes = notes;
    if (equipment !== undefined) event.equipment = equipment;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;

    await event.save();

    return res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    console.error('❌ Update Event Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update event' } });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    await Event.findByIdAndDelete(id);
    await Attendance.deleteMany({ eventId: id });

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Event Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete event' } });
  }
};

/**
 * Get Club Events with optional group filter
 * @route GET /api/v1/events
 * @access Private
 */
export const getClubEvents = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const { groupId, status, from, to } = req.query;

    const query: any = { clubId };
    if (groupId) query.groupId = groupId;
    if (status) query.status = status;
    if (from || to) {
      query.startTime = {};
      if (from) query.startTime.$gte = new Date(from as string);
      if (to) query.startTime.$lte = new Date(to as string);
    }

    const events = await Event.find(query)
      .populate('groupId', 'name color')
      .populate('createdBy', 'fullName')
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    console.error('❌ Get Club Events Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch events' } });
  }
};

/**
 * Get Event Participants
 * @route GET /api/v1/events/:id/participants
 * @access Private
 */
export const getEventParticipants = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    if (event.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    const participants = await Attendance.find({ eventId: id })
      .populate('memberId', 'fullName profileImage')
      .populate('markedBy', 'fullName')
      .sort({ 'memberId.fullName': 1 });

    // Count stats
    const stats = {
      total: participants.length,
      confirmed: participants.filter(p => p.rsvpStatus === 'CONFIRMED').length,
      declined: participants.filter(p => p.rsvpStatus === 'DECLINED').length,
      pending: participants.filter(p => p.rsvpStatus === 'PENDING').length,
      present: participants.filter(p => p.status === 'PRESENT').length,
      absent: participants.filter(p => p.status === 'ABSENT').length,
    };

    return res.status(200).json({ success: true, data: { participants, stats } });
  } catch (error: any) {
    console.error('❌ Get Participants Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch participants' } });
  }
};

/**
 * RSVP - Confirm or Decline Attendance
 * @route POST /api/v1/events/:id/confirm
 * @access Private (PARENT)
 */
export const confirmAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const { memberId, rsvpStatus } = req.body;

    if (!memberId || !rsvpStatus) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'memberId and rsvpStatus are required' } });
    }

    if (!['CONFIRMED', 'DECLINED'].includes(rsvpStatus)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'rsvpStatus must be CONFIRMED or DECLINED' } });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });

    // Check if event is in the future
    if (new Date(event.startTime) < new Date()) {
      return res.status(400).json({ success: false, error: { code: 'EVENT_STARTED', message: 'Cannot RSVP for past events' } });
    }

    // Check maxParticipants limit
    if (rsvpStatus === 'CONFIRMED' && event.maxParticipants) {
      const confirmedCount = await Attendance.countDocuments({ eventId: id, rsvpStatus: 'CONFIRMED' });
      if (confirmedCount >= event.maxParticipants) {
        return res.status(400).json({ success: false, error: { code: 'MAX_PARTICIPANTS', message: 'Event is full' } });
      }
    }

    const attendance = await Attendance.findOneAndUpdate(
      { eventId: id, memberId },
      { rsvpStatus, rsvpAt: new Date() },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: attendance, message: `RSVP ${rsvpStatus.toLowerCase()} successfully` });
  } catch (error: any) {
    console.error('❌ Confirm Attendance Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to confirm attendance' } });
  }
};

/**
 * QR Check-in
 * @route POST /api/v1/events/:id/checkin
 * @access Private
 */
export const qrCheckin = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { id } = req.params;
    const { memberId, qrCode } = req.body;

    if (!memberId || !qrCode) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'memberId and qrCode are required' } });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });

    // Verify QR code matches
    if (event.qrCode !== qrCode) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_QR', message: 'Invalid QR code' } });
    }

    // Check if event is today (allow check-in within reasonable time window)
    const now = new Date();
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Allow check-in 30 minutes before start until event end
    const checkinWindowStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
    if (now < checkinWindowStart) {
      return res.status(400).json({ success: false, error: { code: 'TOO_EARLY', message: 'Check-in not yet available' } });
    }
    if (now > eventEnd) {
      return res.status(400).json({ success: false, error: { code: 'EVENT_ENDED', message: 'Event has ended' } });
    }

    // Determine if late
    const isLate = now > eventStart;

    const attendance = await Attendance.findOneAndUpdate(
      { eventId: id, memberId },
      {
        status: isLate ? 'LATE' : 'PRESENT',
        checkinTime: now,
        checkinMethod: 'QR',
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      data: attendance,
      message: isLate ? 'Checked in (late)' : 'Checked in successfully',
    });
  } catch (error: any) {
    console.error('❌ QR Checkin Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check in' } });
  }
};

/**
 * Get Event by QR Code
 * @route GET /api/v1/events/qr/:qrCode
 * @access Private
 */
export const getEventByQrCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { qrCode } = req.params;
    const event = await Event.findOne({ qrCode })
      .populate('groupId', 'name')
      .populate('createdBy', 'fullName');

    if (!event) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });

    return res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    console.error('❌ Get Event by QR Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch event' } });
  }
};
