import { Request, Response } from 'express';
import MedicalCheck from '../models/MedicalCheck';
import Member from '../models/Member';

export const createMedicalCheck = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId, issueDate, validUntil, examinationDate, documentUrl, doctorName, notes, note } = req.body;

    // Support both formats:
    // 1. Original: { memberId, issueDate, validUntil }
    // 2. Mobile app: { memberId, examinationDate, note } - calculates validUntil as 6 months
    const actualIssueDate = issueDate || examinationDate;
    if (!memberId || !actualIssueDate) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: memberId and issueDate/examinationDate are required' } });
    }

    // Calculate validUntil as 6 months from issue date if not provided
    const issueDateObj = new Date(actualIssueDate);
    const actualValidUntil = validUntil || new Date(issueDateObj.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    const actualNotes = notes || note;

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Check if user has access (parent, member, or club staff)
    if (req.user.role === 'PARENT' && (!member.parentId || member.parentId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    if (req.user.role === 'MEMBER' && (!member.userId || member.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const status = new Date(actualValidUntil) > new Date() ? 'VALID' : 'EXPIRED';
    const medicalCheck = await MedicalCheck.create({
      memberId,
      issueDate: actualIssueDate,
      validUntil: actualValidUntil,
      documentUrl,
      doctorName,
      notes: actualNotes,
      status,
      uploadedBy: req.user._id,
    });

    // Also update the member's medicalInfo
    member.medicalInfo = {
      ...member.medicalInfo,
      expiryDate: new Date(actualValidUntil),
    };
    await member.save();

    return res.status(201).json({ success: true, data: medicalCheck });
  } catch (error: any) {
    console.error('❌ Create Medical Check Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create medical check' } });
  }
};

export const getMemberMedicalChecks = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Check access
    if (req.user.role === 'PARENT' && (!member.parentId || member.parentId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    if (req.user.role === 'MEMBER' && (!member.userId || member.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const medicalChecks = await MedicalCheck.findByMember(memberId as any);
    return res.status(200).json({ success: true, data: medicalChecks });
  } catch (error: any) {
    console.error('❌ Get Medical Checks Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch medical checks' } });
  }
};

export const getExpiringSoon = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { days } = req.query;
    const medicalChecks = await MedicalCheck.getExpiringSoon(days ? parseInt(days as string) : 30);
    return res.status(200).json({ success: true, data: medicalChecks });
  } catch (error: any) {
    console.error('❌ Get Expiring Medical Checks Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch expiring medical checks' } });
  }
};
