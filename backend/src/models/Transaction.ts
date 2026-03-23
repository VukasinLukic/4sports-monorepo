import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  type: 'INCOME' | 'EXPENSE';
  category: 'MEMBERSHIP_FEE' | 'EVENT_FEE' | 'EQUIPMENT' | 'SALARY' | 'RENT' | 'UTILITIES' | 'SPONSORSHIP' | 'BALANCE_ADJUSTMENT' | 'OTHER';
  amount: number;
  currency: string;
  description: string;
  transactionDate: Date;
  paymentMethod?: 'CASH' | 'CARD';
  groupId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  receiptUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionModel extends Model<ITransaction> {
  findByClub(clubId: mongoose.Types.ObjectId): Promise<ITransaction[]>;
  getFinancialSummary(
    clubId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalIncome: number; totalExpense: number; balance: number; byCategory: any }>;
  getMonthlyReport(clubId: mongoose.Types.ObjectId, year: number, month: number): Promise<ITransaction[]>;
}

const transactionSchema = new Schema<ITransaction, ITransactionModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    category: {
      type: String,
      enum: ['MEMBERSHIP_FEE', 'EVENT_FEE', 'EQUIPMENT', 'SALARY', 'RENT', 'UTILITIES', 'SPONSORSHIP', 'BALANCE_ADJUSTMENT', 'OTHER'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'CARD'] },
    currency: { type: String, default: 'RSD' },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    transactionDate: { type: Date, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    receiptUrl: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

transactionSchema.index({ clubId: 1, transactionDate: -1 });
transactionSchema.index({ clubId: 1, type: 1, category: 1 });
transactionSchema.index({ clubId: 1, paymentMethod: 1 });

transactionSchema.statics.findByClub = async function (clubId: mongoose.Types.ObjectId): Promise<ITransaction[]> {
  return this.find({ clubId }).sort({ transactionDate: -1 }).populate('createdBy', 'fullName');
};

transactionSchema.statics.getFinancialSummary = async function (
  clubId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<{ totalIncome: number; totalExpense: number; balance: number; byCategory: any }> {
  const transactions = await this.find({
    clubId,
    transactionDate: { $gte: startDate, $lte: endDate },
  });

  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: {} as any,
  };

  transactions.forEach((transaction: ITransaction) => {
    if (transaction.type === 'INCOME') {
      summary.totalIncome += transaction.amount;
    } else {
      summary.totalExpense += transaction.amount;
    }

    if (!summary.byCategory[transaction.category]) {
      summary.byCategory[transaction.category] = { income: 0, expense: 0 };
    }

    if (transaction.type === 'INCOME') {
      summary.byCategory[transaction.category].income += transaction.amount;
    } else {
      summary.byCategory[transaction.category].expense += transaction.amount;
    }
  });

  summary.balance = summary.totalIncome - summary.totalExpense;

  return summary;
};

transactionSchema.statics.getMonthlyReport = async function (
  clubId: mongoose.Types.ObjectId,
  year: number,
  month: number
): Promise<ITransaction[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.find({
    clubId,
    transactionDate: { $gte: startDate, $lte: endDate },
  })
    .sort({ transactionDate: -1 })
    .populate('createdBy', 'fullName');
};

const Transaction = mongoose.model<ITransaction, ITransactionModel>('Transaction', transactionSchema);
export default Transaction;
