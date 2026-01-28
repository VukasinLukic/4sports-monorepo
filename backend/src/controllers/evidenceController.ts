import { Request, Response } from 'express';
import Member from '../models/Member';
import Payment from '../models/Payment';

/**
 * Get Membership Evidence by Group
 * @route GET /api/v1/evidence/membership
 * @access Private (OWNER, COACH)
 */
export const getMembershipEvidence = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const { groupId, month, year } = req.query;

    // Get current month/year if not specified
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    // Build query for members
    let membersQuery: any = { 'clubs.clubId': clubId, 'clubs.status': 'ACTIVE' };
    if (groupId) {
      membersQuery['clubs.groupId'] = groupId;
    }

    const members = await Member.find(membersQuery)
      .populate('clubs.groupId', 'name color')
      .sort({ fullName: 1 });

    // Get payments for the target period
    const payments = await Payment.find({
      clubId,
      type: 'MEMBERSHIP',
      'period.month': targetMonth,
      'period.year': targetYear,
    });

    // Create a map of memberId -> payment
    const paymentMap = new Map(payments.map(p => [p.memberId.toString(), p]));

    // Build evidence list
    const evidence = members.map(member => {
      const payment = paymentMap.get(member._id.toString());
      const activeClub = member.clubs.find(c => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE');

      return {
        memberId: member._id,
        memberName: member.fullName,
        profileImage: member.profileImage,
        group: activeClub?.groupId,
        period: { month: targetMonth, year: targetYear },
        status: payment?.status || 'NOT_CREATED',
        payment: payment ? {
          _id: payment._id,
          amount: payment.amount,
          dueDate: payment.dueDate,
          paidDate: payment.paidDate,
          status: payment.status,
        } : null,
      };
    });

    // Stats
    const stats = {
      total: evidence.length,
      paid: evidence.filter(e => e.status === 'PAID').length,
      pending: evidence.filter(e => e.status === 'PENDING').length,
      overdue: evidence.filter(e => e.status === 'OVERDUE').length,
      notCreated: evidence.filter(e => e.status === 'NOT_CREATED').length,
    };

    return res.status(200).json({
      success: true,
      data: {
        period: { month: targetMonth, year: targetYear },
        evidence,
        stats,
      },
    });
  } catch (error: any) {
    console.error('❌ Get Membership Evidence Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch membership evidence' } });
  }
};

/**
 * Get Medical Evidence by Group
 * @route GET /api/v1/evidence/medical
 * @access Private (OWNER, COACH)
 */
export const getMedicalEvidence = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const { groupId } = req.query;

    // Build query for members
    let membersQuery: any = { 'clubs.clubId': clubId, 'clubs.status': 'ACTIVE' };
    if (groupId) {
      membersQuery['clubs.groupId'] = groupId;
    }

    const members = await Member.find(membersQuery)
      .populate('clubs.groupId', 'name color')
      .sort({ fullName: 1 });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Build evidence list
    const evidence = members.map(member => {
      const activeClub = member.clubs.find(c => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE');
      const expiryDate = member.medicalInfo?.expiryDate;

      let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_SET' = 'NOT_SET';
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        if (expiry < now) {
          status = 'EXPIRED';
        } else if (expiry < thirtyDaysFromNow) {
          status = 'EXPIRING_SOON';
        } else {
          status = 'VALID';
        }
      }

      return {
        memberId: member._id,
        memberName: member.fullName,
        profileImage: member.profileImage,
        group: activeClub?.groupId,
        medicalInfo: {
          lastCheckDate: member.medicalInfo?.lastCheckDate,
          expiryDate: member.medicalInfo?.expiryDate,
          bloodType: member.medicalInfo?.bloodType,
        },
        status,
      };
    });

    // Stats
    const stats = {
      total: evidence.length,
      valid: evidence.filter(e => e.status === 'VALID').length,
      expiringSoon: evidence.filter(e => e.status === 'EXPIRING_SOON').length,
      expired: evidence.filter(e => e.status === 'EXPIRED').length,
      notSet: evidence.filter(e => e.status === 'NOT_SET').length,
    };

    return res.status(200).json({
      success: true,
      data: { evidence, stats },
    });
  } catch (error: any) {
    console.error('❌ Get Medical Evidence Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch medical evidence' } });
  }
};

/**
 * Mark Membership as Paid
 * @route POST /api/v1/evidence/membership/:memberId
 * @access Private (OWNER, COACH)
 */
export const markMembershipPaid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const { memberId } = req.params;
    const { month, year, amount, paymentMethod } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'month and year are required' } });
    }

    // Verify member exists and is in club
    const member = await Member.findById(memberId);
    if (!member || !member.clubs.some(c => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE')) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }

    // Check if payment already exists for this period
    let payment = await Payment.findOne({
      clubId,
      memberId,
      type: 'MEMBERSHIP',
      'period.month': month,
      'period.year': year,
    });

    if (payment) {
      // Update existing payment
      payment.status = 'PAID';
      payment.paidDate = new Date();
      if (paymentMethod) payment.paymentMethod = paymentMethod;
      await payment.save();
    } else {
      // Create new payment
      payment = await Payment.create({
        clubId,
        memberId,
        type: 'MEMBERSHIP',
        amount: amount || 0,
        dueDate: new Date(year, month - 1, 1),
        paidDate: new Date(),
        status: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        period: { month, year },
        createdBy: req.user._id,
      });
    }

    return res.status(200).json({ success: true, data: payment, message: 'Membership marked as paid' });
  } catch (error: any) {
    console.error('❌ Mark Membership Paid Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark membership as paid' } });
  }
};

/**
 * Update Medical Info
 * @route POST /api/v1/evidence/medical/:memberId
 * @access Private (OWNER, COACH)
 */
export const updateMedicalInfo = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const { memberId } = req.params;
    const { lastCheckDate, expiryDate, bloodType, allergies, medications, conditions } = req.body;

    // Verify member exists and is in club
    const member = await Member.findById(memberId);
    if (!member || !member.clubs.some(c => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE')) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }

    // Update medical info
    if (!member.medicalInfo) {
      member.medicalInfo = {};
    }

    if (lastCheckDate !== undefined) member.medicalInfo.lastCheckDate = lastCheckDate;
    if (expiryDate !== undefined) member.medicalInfo.expiryDate = expiryDate;
    if (bloodType !== undefined) member.medicalInfo.bloodType = bloodType;
    if (allergies !== undefined) member.medicalInfo.allergies = allergies;
    if (medications !== undefined) member.medicalInfo.medications = medications;
    if (conditions !== undefined) member.medicalInfo.conditions = conditions;

    await member.save();

    return res.status(200).json({ success: true, data: member, message: 'Medical info updated' });
  } catch (error: any) {
    console.error('❌ Update Medical Info Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update medical info' } });
  }
};

/**
 * Create Membership Payments for Group (bulk)
 * @route POST /api/v1/evidence/membership/create-bulk
 * @access Private (OWNER, COACH)
 */
export const createBulkMembershipPayments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const clubId = req.user.clubId;
    if (!clubId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    }

    const { groupId, month, year, amount, dueDate } = req.body;

    if (!groupId || !month || !year || !amount) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'groupId, month, year, and amount are required' } });
    }

    // Get all members in the group
    const members = await Member.find({
      'clubs.groupId': groupId,
      'clubs.status': 'ACTIVE',
    });

    // Check which members already have payments for this period
    const existingPayments = await Payment.find({
      clubId,
      memberId: { $in: members.map(m => m._id) },
      type: 'MEMBERSHIP',
      'period.month': month,
      'period.year': year,
    });

    const existingMemberIds = new Set(existingPayments.map(p => p.memberId.toString()));

    // Create payments for members who don't have one
    const newPayments = members
      .filter(m => !existingMemberIds.has(m._id.toString()))
      .map(member => ({
        clubId,
        memberId: member._id,
        type: 'MEMBERSHIP',
        amount,
        dueDate: dueDate ? new Date(dueDate) : new Date(year, month - 1, 15),
        status: 'PENDING',
        period: { month, year },
        createdBy: req.user!._id,
      }));

    if (newPayments.length > 0) {
      await Payment.insertMany(newPayments);
    }

    return res.status(201).json({
      success: true,
      message: `Created ${newPayments.length} new payment records`,
      data: {
        created: newPayments.length,
        skipped: existingPayments.length,
        total: members.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Create Bulk Payments Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create payments' } });
  }
};
