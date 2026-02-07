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
  clubId?: string;
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
  groupId?: string;
  invoiceUrl?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
}

// Dashboard V2 Types
export interface DashboardV2Data {
  kpiCards: DashboardKPICards;
  monthlyFinance: MonthlyFinanceEntry[];
  groupStats: GroupStatEntry[];
  memberGrowth: MemberGrowthData;
  paymentMethodBreakdown: PaymentMethodBreakdown;
  recentTransactions: RecentTransaction[];
  totalTransactionCount: number;
  transactionCountTrend: number;
}

export interface DashboardKPICards {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  unpaidCount: number;
  incomeTrend: number;
  expenseTrend: number;
  profitTrend: number;
  unpaidTrend: number;
}

export interface MonthlyFinanceEntry {
  month: number;
  income: number;
  expense: number;
}

export interface GroupStatEntry {
  groupId: string;
  groupName: string;
  groupColor: string;
  memberCount: number;
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

export interface MemberGrowthData {
  totalMembers: number;
  memberTrend: number;
  newMembersThisMonth: number;
  newMembersTrend: number;
  monthlyData: Array<{
    month: number;
    count: number;
    newCount: number;
  }>;
}

export interface PaymentMethodBreakdown {
  totalBalance: number;
  methods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

export interface RecentTransaction {
  _id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  transactionDate: string;
  createdAt: string;
}

// Settings Types
export interface ClubSettings {
  id: string;
  clubName: string;
  address: string;
  phoneNumber: string;
  email: string;
  logoUrl?: string;
}

export interface UpdateClubSettingsData {
  clubName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  logoUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  role: 'ADMIN' | 'COACH';
}

export interface UpdateUserProfileData {
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface Subscription {
  plan: 'FREE' | 'BASIC' | 'PRO';
  memberLimit: number;
  currentMembersCount: number;
  validUntil?: string;
}
