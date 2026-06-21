export type TransactionType = 'Income' | 'Expense';

export type IncomeCategory =
  | 'Salary'
  | 'Allowance'
  | 'Freelance'
  | 'Business'
  | 'Scholarship'
  | 'Gift'
  | 'Investment'
  | 'Other';

export type ExpenseCategory =
  | 'Food'
  | 'Transportation'
  | 'Rent'
  | 'Utilities'
  | 'Education'
  | 'Entertainment'
  | 'Shopping'
  | 'Healthcare'
  | 'Savings'
  | 'Subscriptions'
  | 'Tithe'
  | 'Other';

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id?: number;
  amount: number;
  transaction_type: TransactionType;
  category: TransactionCategory;
  note: string;
  date: string; // YYYY-MM-DD format
  created_at: Date;
}

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface RecurringTransaction {
  id?: number;
  name: string;
  amount: number;
  transaction_type: TransactionType;
  category: TransactionCategory;
  frequency: RecurringFrequency;
  start_date: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format (optional)
  is_active: boolean;
  last_processed_date?: string; // YYYY-MM-DD format (to prevent duplicate run)
}

export interface Budget {
  id?: number;
  category: ExpenseCategory; // Budgets are only set for expenses
  monthly_limit: number;
}

export interface MonthlyReport {
  id?: number;
  month: number; // 0-11 for Date compatibility (or 1-12, let's use 1-12)
  year: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number; // percentage
  health_score: number; // 0-100
  assessment: string; // JSON string or text summary
}

export interface MonthlySnapshot {
  id?: number;
  month: number; // 1-12
  year: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  health_score: number;
  recommendations: string[];
}

export interface Settings {
  id?: number;
  currency: string;
  dark_mode: boolean;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  healthScore: number;
}
