import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Member from '../models/Member';

export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId, type, amount, description, dueDate, paymentMethod, paymentDate, note, period } = req.body;
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    // Support both "create pending payment" and "record completed payment" flows
    if (!memberId || !amount) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: memberId and amount are required' } });
    }

    const member = await Member.findById(memberId);
    if (!member || !member.isInClub(clubId)) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found in club' } });

    // If paymentMethod is provided, this is a "record payment" (already paid)
    const isPaid = !!paymentMethod;
    const now = new Date();

    // Use explicit period if provided, otherwise derive from paymentDate or current date
    let periodMonth: number;
    let periodYear: number;
    if (period && period.month && period.year) {
      periodMonth = period.month;
      periodYear = period.year;
    } else {
      const periodDate = paymentDate ? new Date(paymentDate) : now;
      periodMonth = periodDate.getMonth() + 1;
      periodYear = periodDate.getFullYear();
    }

    const paymentData: any = {
      clubId,
      memberId,
      type: type || 'MEMBERSHIP',
      amount,
      description: description || note,
      dueDate: dueDate || now,
      createdBy: req.user._id,
      period: { month: periodMonth, year: periodYear },
    };

    if (isPaid) {
      paymentData.status = 'PAID';
      paymentData.paidDate = paymentDate ? new Date(paymentDate) : now;
      paymentData.paymentMethod = paymentMethod;
    }

    const payment = await Payment.create(paymentData);
    return res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('❌ Create Payment Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create payment' } });
  }
};

export const getClubPayments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    const payments = await Payment.findByClub(clubId);
    return res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    console.error('❌ Get Payments Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch payments' } });
  }
};

export const getMemberPayments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId } = req.params;
    const payments = await Payment.findByMember(memberId as any);
    return res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    console.error('❌ Get Member Payments Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch payments' } });
  }
};

/**
 * Get own payments (for MEMBER role users)
 */
export const getMyPayments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // Find member linked to this user
    const member = await Member.findOne({ userId: req.user._id });
    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });
    }

    const payments = await Payment.findByMember(member._id);
    return res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    console.error('❌ Get My Payments Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch payments' } });
  }
};

export const markPaymentPaid = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;
    const { paymentMethod, receiptNumber, notes } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    if (payment.clubId.toString() !== req.user.clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    payment.status = 'PAID';
    payment.paidDate = new Date();
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (receiptNumber) payment.receiptNumber = receiptNumber;
    if (notes) payment.notes = notes;
    await payment.save();

    return res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('❌ Mark Payment Paid Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark payment as paid' } });
  }
};
