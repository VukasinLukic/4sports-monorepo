import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Member from '../models/Member';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

// Helper: find member's groupId for a given club
function getMemberGroupId(member: any, clubId: mongoose.Types.ObjectId): mongoose.Types.ObjectId | undefined {
  const entry = member.clubs?.find(
    (c: any) => c.clubId.toString() === clubId.toString() && c.status === 'ACTIVE'
  );
  return entry?.groupId;
}

// Helper: auto-create a INCOME transaction linked to a payment
async function createTransactionForPayment(
  payment: any,
  paidAmount: number,
  clubId: mongoose.Types.ObjectId,
  groupId: mongoose.Types.ObjectId | undefined,
  createdBy: mongoose.Types.ObjectId,
  memberName: string,
) {
  await Transaction.create({
    clubId,
    type: 'INCOME',
    category: 'MEMBERSHIP_FEE',
    amount: paidAmount,
    description: `Članarina - ${memberName}`,
    transactionDate: payment.paidDate || new Date(),
    paymentMethod: payment.paymentMethod || undefined,
    groupId: groupId || undefined,
    paymentId: payment._id,
    createdBy,
  });
}

export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { memberId, type, amount, paidAmount: paidAmountInput, description, dueDate, paymentMethod, paymentDate, note, period } = req.body;
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    if (!memberId || !amount) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: memberId and amount are required' } });
    }

    const member = await Member.findById(memberId);
    if (!member || !member.isInClub(clubId)) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found in club' } });

    const now = new Date();
    const hasPaid = !!paymentMethod;
    const actualPaidAmount = hasPaid ? (paidAmountInput || amount) : 0;

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

    // Check if a payment already exists for this member+period (upsert logic)
    const paymentType = type || 'MEMBERSHIP';
    const existingPayment = await Payment.findOne({
      clubId,
      memberId,
      type: paymentType,
      'period.month': periodMonth,
      'period.year': periodYear,
    });

    if (existingPayment && hasPaid) {
      // Update total expected amount if provided (fixes legacy payments with incorrect amount)
      if (amount && amount !== existingPayment.amount) {
        existingPayment.amount = amount;
      }
      // Update existing payment: add to paidAmount
      const newPaidAmount = (existingPayment.paidAmount || 0) + actualPaidAmount;
      existingPayment.paidAmount = Math.min(newPaidAmount, existingPayment.amount);
      existingPayment.status = existingPayment.paidAmount >= existingPayment.amount ? 'PAID' : 'PARTIAL';
      existingPayment.paidDate = paymentDate ? new Date(paymentDate) : now;
      if (paymentMethod) existingPayment.paymentMethod = paymentMethod;
      if (description || note) existingPayment.description = description || note;
      await existingPayment.save();

      // Auto-create Transaction for paid amount
      if (actualPaidAmount > 0) {
        const groupId = getMemberGroupId(member, clubId);
        await createTransactionForPayment(
          existingPayment, actualPaidAmount, clubId, groupId, req.user._id, member.fullName
        );
      }

      return res.status(200).json({ success: true, data: existingPayment });
    }

    // No existing payment — create new
    let status: 'PENDING' | 'PAID' | 'PARTIAL' = 'PENDING';
    if (hasPaid) {
      status = actualPaidAmount >= amount ? 'PAID' : 'PARTIAL';
    }

    const paymentData: any = {
      clubId,
      memberId,
      type: paymentType,
      amount,
      paidAmount: actualPaidAmount,
      description: description || note,
      dueDate: dueDate || now,
      createdBy: req.user._id,
      period: { month: periodMonth, year: periodYear },
      status,
    };

    if (hasPaid) {
      paymentData.paidDate = paymentDate ? new Date(paymentDate) : now;
      paymentData.paymentMethod = paymentMethod;
    }

    const payment = await Payment.create(paymentData);

    // Auto-create Transaction for paid amount
    if (hasPaid && actualPaidAmount > 0) {
      const groupId = getMemberGroupId(member, clubId);
      await createTransactionForPayment(
        payment, actualPaidAmount, clubId, groupId, req.user._id, member.fullName
      );
    }

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
    const { paymentMethod, receiptNumber, notes, paidAmount: paidAmountInput } = req.body;
    const clubId = req.user.clubId;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    if (payment.clubId.toString() !== clubId?.toString()) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });

    // Calculate new paid amount: add to existing paidAmount
    const additionalAmount = paidAmountInput || (payment.amount - (payment.paidAmount || 0));
    const newPaidAmount = (payment.paidAmount || 0) + additionalAmount;

    payment.paidAmount = Math.min(newPaidAmount, payment.amount);
    payment.status = payment.paidAmount >= payment.amount ? 'PAID' : 'PARTIAL';
    payment.paidDate = new Date();
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (receiptNumber) payment.receiptNumber = receiptNumber;
    if (notes) payment.notes = notes;
    await payment.save();

    // Auto-create Transaction for the additional paid amount
    if (additionalAmount > 0 && clubId) {
      const member = await Member.findById(payment.memberId);
      const groupId = member ? getMemberGroupId(member, clubId) : undefined;
      await createTransactionForPayment(
        payment, additionalAmount, clubId, groupId, req.user._id, member?.fullName || 'Član'
      );
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('❌ Mark Payment Paid Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark payment as paid' } });
  }
};
