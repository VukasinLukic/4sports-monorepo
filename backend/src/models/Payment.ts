import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  type: 'MEMBERSHIP' | 'EVENT' | 'EQUIPMENT' | 'OTHER';
  amount: number;
  currency: string;
  description?: string;
  dueDate: Date;
  paidDate?: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  receiptNumber?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentModel extends Model<IPayment> {
  findByMember(memberId: mongoose.Types.ObjectId): Promise<IPayment[]>;
  findByClub(clubId: mongoose.Types.ObjectId): Promise<IPayment[]>;
  getPendingPayments(clubId: mongoose.Types.ObjectId): Promise<IPayment[]>;
}

const paymentSchema = new Schema<IPayment, IPaymentModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    type: { type: String, enum: ['MEMBERSHIP', 'EVENT', 'EQUIPMENT', 'OTHER'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'RSD' },
    description: { type: String, trim: true, maxlength: 500 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'], default: 'PENDING' },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'] },
    receiptNumber: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ clubId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ memberId: 1, status: 1 });

paymentSchema.statics.findByMember = async function (memberId: mongoose.Types.ObjectId): Promise<IPayment[]> {
  return this.find({ memberId }).sort({ dueDate: -1 });
};

paymentSchema.statics.findByClub = async function (clubId: mongoose.Types.ObjectId): Promise<IPayment[]> {
  return this.find({ clubId }).populate('memberId', 'fullName').sort({ dueDate: -1 });
};

paymentSchema.statics.getPendingPayments = async function (clubId: mongoose.Types.ObjectId): Promise<IPayment[]> {
  return this.find({ clubId, status: { $in: ['PENDING', 'OVERDUE'] } }).populate('memberId', 'fullName').sort({ dueDate: 1 });
};

const Payment = mongoose.model<IPayment, IPaymentModel>('Payment', paymentSchema);
export default Payment;
