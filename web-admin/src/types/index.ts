// Dashboard Types
export interface DashboardStats {
  currentRevenue: number;
  newMembersPercentage: number;
  totalMembers: number;
  totalTransactions: number;
  memberGrowth: MonthlyData[];
  balanceData: BalanceData;
  quarterlyRevenue: QuarterlyData[];
  monthlyFinance: MonthlyFinanceData[];
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface BalanceData {
  income: number;
  expense: number;
}

export interface QuarterlyData {
  quarter: string;
  amount: number;
}

export interface MonthlyFinanceData {
  month: string;
  revenue: number;
  expenses: number;
}

// Member Types
export interface Member {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  groupId: string;
  groupName: string;
  parentId?: string;
  gender: 'MALE' | 'FEMALE';
  height?: number;
  weight?: number;
  position?: string;
  paymentStatus: 'PAID' | 'UNPAID';
  medicalStatus: 'VALID' | 'EXPIRED';
  profileImage?: string;
}

export interface CreateMemberData {
  fullName: string;
  dateOfBirth: string;
  groupId: string;
  parentId?: string;
  gender: 'MALE' | 'FEMALE';
  height?: number;
  weight?: number;
  position?: string;
}

// Coach Types
export interface Coach {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  groupsCount: number;
  contractExpiryDate: string;
  isExpiringSoon: boolean;
}

export interface InviteCode {
  code: string;
  type: 'COACH' | 'PARENT';
  expiresAt: string;
}

// Finance Types
export interface FinanceEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  recordedBy: string;
  isManual: boolean;
  invoiceUrl?: string;
  createdAt: string;
}

export interface CreateFinanceEntryData {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  invoiceUrl?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
}
