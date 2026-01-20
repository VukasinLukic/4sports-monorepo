import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Budget from '../models/Budget';

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

export const createTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { type, category, amount, description, transactionDate, paymentId, receiptUrl, notes } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!type || !category || !amount || !description || !transactionDate) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    const transaction = await Transaction.create({
      clubId,
      type,
      category,
      amount,
      description,
      transactionDate,
      paymentId,
      receiptUrl,
      notes,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('❌ Create Transaction Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create transaction' } });
  }
};

export const getClubTransactions = async (req: Request, res: Response) => {
  console.log('💰 getClubTransactions controller called');
  try {
    if (!req.user) {
      console.log('💰 No user found');
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const clubId = req.user.clubId;
    console.log('💰 User clubId:', clubId);
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const transactions = await Transaction.findByClub(clubId);
    console.log('💰 Found transactions:', transactions.length);
    return res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('❌ Get Transactions Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch transactions' } });
  }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
  console.log('💰 getFinancialSummary controller called');
  try {
    if (!req.user) {
      console.log('💰 No user found in summary');
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const summary = await Transaction.getFinancialSummary(clubId, start, end);
    return res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    console.error('❌ Get Financial Summary Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch financial summary' } });
  }
};

export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'year and month are required' } });
    }

    const report = await Transaction.getMonthlyReport(clubId, parseInt(year as string), parseInt(month as string));
    return res.status(200).json({ success: true, data: report });
  } catch (error: any) {
    console.error('❌ Get Monthly Report Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch monthly report' } });
  }
};

// ============================================
// BUDGET MANAGEMENT
// ============================================

export const createBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { name, startDate, endDate, incomeCategories, expenseCategories, notes } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    const totalPlannedIncome = incomeCategories?.reduce((sum: number, cat: any) => sum + cat.plannedAmount, 0) || 0;
    const totalPlannedExpense = expenseCategories?.reduce((sum: number, cat: any) => sum + cat.plannedAmount, 0) || 0;

    const budget = await Budget.create({
      clubId,
      name,
      startDate,
      endDate,
      totalPlannedIncome,
      totalPlannedExpense,
      incomeCategories: incomeCategories || [],
      expenseCategories: expenseCategories || [],
      createdBy: req.user._id,
      notes,
    });

    return res.status(201).json({ success: true, data: budget });
  } catch (error: any) {
    console.error('❌ Create Budget Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create budget' } });
  }
};

export const getClubBudgets = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const budgets = await Budget.findByClub(clubId);
    return res.status(200).json({ success: true, data: budgets });
  } catch (error: any) {
    console.error('❌ Get Budgets Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch budgets' } });
  }
};

export const getActiveBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const budget = await Budget.getActiveBudget(clubId);
    if (!budget) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No active budget found' } });

    return res.status(200).json({ success: true, data: budget });
  } catch (error: any) {
    console.error('❌ Get Active Budget Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch active budget' } });
  }
};

export const updateBudgetActuals = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const budget = await Budget.updateActuals(id as any);
    if (!budget) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Budget not found' } });

    return res.status(200).json({ success: true, data: budget });
  } catch (error: any) {
    console.error('❌ Update Budget Actuals Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update budget actuals' } });
  }
};

export const updateBudgetStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['DRAFT', 'ACTIVE', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } });
    }

    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Budget not found' } });

    if (budget.clubId.toString() !== req.user.clubId?.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    budget.status = status;
    await budget.save();

    return res.status(200).json({ success: true, data: budget });
  } catch (error: any) {
    console.error('❌ Update Budget Status Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update budget status' } });
  }
};

// ============================================
// TRANSACTION UPDATE & DELETE
// ============================================

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });

    if (transaction.clubId.toString() !== clubId.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const { type, category, amount, description, transactionDate, notes } = req.body;

    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (amount !== undefined) transaction.amount = amount;
    if (description) transaction.description = description;
    if (transactionDate) transaction.transactionDate = transactionDate;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    return res.status(200).json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('❌ Update Transaction Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update transaction' } });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });

    if (transaction.clubId.toString() !== clubId.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    // Only allow deletion of manual entries (not linked to payments)
    if (transaction.paymentId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot delete system-generated transactions' } });
    }

    await Transaction.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Transaction Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete transaction' } });
  }
};
