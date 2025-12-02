import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createTransaction,
  getClubTransactions,
  getFinancialSummary,
  getMonthlyReport,
  createBudget,
  getClubBudgets,
  getActiveBudget,
  updateBudgetActuals,
  updateBudgetStatus,
} from '../controllers/financeController';

const router = express.Router();

// ============================================
// TRANSACTION ROUTES
// ============================================

/**
 * @route   POST /api/finances/transactions
 * @desc    Create a new transaction (income or expense)
 * @access  Protected (OWNER, COACH)
 */
router.post('/transactions', protect, createTransaction);

/**
 * @route   GET /api/finances/transactions
 * @desc    Get all transactions for the club
 * @access  Protected (OWNER, COACH)
 */
router.get('/transactions', protect, getClubTransactions);

/**
 * @route   GET /api/finances/summary
 * @desc    Get financial summary for a date range
 * @access  Protected (OWNER, COACH)
 * @query   startDate, endDate
 */
router.get('/summary', protect, getFinancialSummary);

/**
 * @route   GET /api/finances/monthly
 * @desc    Get monthly financial report
 * @access  Protected (OWNER, COACH)
 * @query   year, month
 */
router.get('/monthly', protect, getMonthlyReport);

// ============================================
// BUDGET ROUTES
// ============================================

/**
 * @route   POST /api/finances/budgets
 * @desc    Create a new budget
 * @access  Protected (OWNER)
 */
router.post('/budgets', protect, createBudget);

/**
 * @route   GET /api/finances/budgets
 * @desc    Get all budgets for the club
 * @access  Protected (OWNER, COACH)
 */
router.get('/budgets', protect, getClubBudgets);

/**
 * @route   GET /api/finances/budgets/active
 * @desc    Get the currently active budget
 * @access  Protected (OWNER, COACH)
 */
router.get('/budgets/active', protect, getActiveBudget);

/**
 * @route   PATCH /api/finances/budgets/:id/actuals
 * @desc    Update budget with actual amounts from transactions
 * @access  Protected (OWNER, COACH)
 */
router.patch('/budgets/:id/actuals', protect, updateBudgetActuals);

/**
 * @route   PATCH /api/finances/budgets/:id/status
 * @desc    Update budget status (DRAFT, ACTIVE, COMPLETED)
 * @access  Protected (OWNER)
 */
router.patch('/budgets/:id/status', protect, updateBudgetStatus);

export default router;
