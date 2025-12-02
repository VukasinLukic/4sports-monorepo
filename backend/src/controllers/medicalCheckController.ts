import { Request, Response } from 'express';
import MedicalCheck from '../models/MedicalCheck';
import Member from '../models/Member';

export const createMedicalCheck = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId, issueDate, validUntil, documentUrl, doctorName, notes } = req.body;
    if (!memberId || !issueDate || !validUntil) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

    // Check if user has access (parent or club staff)
    if (req.user.role === 'PARENT' && member.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const status = new Date(validUntil) > new Date() ? 'VALID' : 'EXPIRED';
    const medicalCheck = await MedicalCheck.create({ memberId, issueDate, validUntil, documentUrl, doctorName, notes, status, uploadedBy: req.user._id });
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
    if (req.user.role === 'PARENT' && member.parentId.toString() !== req.user._id.toString()) {
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
