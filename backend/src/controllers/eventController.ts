import { Request, Response } from 'express';
import Event from '../models/Event';
import Group from '../models/Group';
import Member from '../models/Member';
import Attendance from '../models/Attendance';

export const createEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const { groupId, title, description, type, startTime, endTime, location, isMandatory } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!groupId || !title || !type || !startTime || !endTime) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const group = await Group.findById(groupId);
    if (!group || group.clubId.toString() !== clubId.toString()) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } });

    const event = await Event.create({ clubId, groupId, title, description, type, startTime, endTime, location, isMandatory, createdBy: req.user._id });

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
    const { title, description, type, startTime, endTime, location, isMandatory, status } = req.body;

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
