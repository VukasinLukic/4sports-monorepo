import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Member from '../models/Member';

export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId, type, amount, description, dueDate } = req.body;
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!memberId || !type || !amount || !dueDate) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });

    const member = await Member.findById(memberId);
    if (!member || !member.isInClub(clubId)) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found in club' } });

    const payment = await Payment.create({ clubId, memberId, type, amount, description, dueDate, createdBy: req.user._id });
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
