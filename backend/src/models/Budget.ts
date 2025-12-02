import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategoryBudget {
  category: 'MEMBERSHIP_FEE' | 'EVENT_FEE' | 'EQUIPMENT' | 'SALARY' | 'RENT' | 'UTILITIES' | 'SPONSORSHIP' | 'OTHER';
  plannedAmount: number;
  actualAmount: number;
}

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  totalPlannedIncome: number;
  totalPlannedExpense: number;
  totalActualIncome: number;
  totalActualExpense: number;
  incomeCategories: ICategoryBudget[];
  expenseCategories: ICategoryBudget[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetModel extends Model<IBudget> {
  findByClub(clubId: mongoose.Types.ObjectId): Promise<IBudget[]>;
  getActiveBudget(clubId: mongoose.Types.ObjectId): Promise<IBudget | null>;
  updateActuals(budgetId: mongoose.Types.ObjectId): Promise<IBudget | null>;
}

const categoryBudgetSchema = new Schema<ICategoryBudget>(
  {
    category: {
      type: String,
      enum: ['MEMBERSHIP_FEE', 'EVENT_FEE', 'EQUIPMENT', 'SALARY', 'RENT', 'UTILITIES', 'SPONSORSHIP', 'OTHER'],
      required: true,
    },
    plannedAmount: { type: Number, required: true, min: 0 },
    actualAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const budgetSchema = new Schema<IBudget, IBudgetModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPlannedIncome: { type: Number, default: 0, min: 0 },
    totalPlannedExpense: { type: Number, default: 0, min: 0 },
    totalActualIncome: { type: Number, default: 0, min: 0 },
    totalActualExpense: { type: Number, default: 0, min: 0 },
    incomeCategories: [categoryBudgetSchema],
    expenseCategories: [categoryBudgetSchema],
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'COMPLETED'], default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

budgetSchema.index({ clubId: 1, status: 1 });
budgetSchema.index({ clubId: 1, startDate: -1 });

budgetSchema.statics.findByClub = async function (clubId: mongoose.Types.ObjectId): Promise<IBudget[]> {
  return this.find({ clubId }).sort({ startDate: -1 }).populate('createdBy', 'firstName lastName');
};

budgetSchema.statics.getActiveBudget = async function (clubId: mongoose.Types.ObjectId): Promise<IBudget | null> {
  const now = new Date();
  return this.findOne({
    clubId,
    status: 'ACTIVE',
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

budgetSchema.statics.updateActuals = async function (budgetId: mongoose.Types.ObjectId): Promise<IBudget | null> {
  const budget = await this.findById(budgetId);
  if (!budget) return null;

  const Transaction = mongoose.model('Transaction');

  const transactions = await Transaction.find({
    clubId: budget.clubId,
    transactionDate: { $gte: budget.startDate, $lte: budget.endDate },
  });

  budget.totalActualIncome = 0;
  budget.totalActualExpense = 0;

  budget.incomeCategories.forEach((cat: ICategoryBudget) => {
    cat.actualAmount = 0;
  });
  budget.expenseCategories.forEach((cat: ICategoryBudget) => {
    cat.actualAmount = 0;
  });

  transactions.forEach((transaction: any) => {
    if (transaction.type === 'INCOME') {
      budget.totalActualIncome += transaction.amount;
      const category = budget.incomeCategories.find((cat: ICategoryBudget) => cat.category === transaction.category);
      if (category) {
        category.actualAmount += transaction.amount;
      }
    } else {
      budget.totalActualExpense += transaction.amount;
      const category = budget.expenseCategories.find((cat: ICategoryBudget) => cat.category === transaction.category);
      if (category) {
        category.actualAmount += transaction.amount;
      }
    }
  });

  await budget.save();
  return budget;
};

const Budget = mongoose.model<IBudget, IBudgetModel>('Budget', budgetSchema);
export default Budget;
