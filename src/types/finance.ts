export type AccountType = 'CASH' | 'BANK' | 'SAVINGS' | 'CREDIT';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type Frequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  isDefault?: boolean;
  institution?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO string YYYY-MM-DD or full ISO
  description: string;
  categoryId?: string;
  accountId: string;
  toAccountId?: string; // used when type === 'TRANSFER'
  isRecurring?: boolean;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amountLimit: number;
  month: number; // 1-12
  year: number;  // e.g. 2026
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO string
  color: string;
  category?: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  frequency: Frequency;
  nextDueDate: string; // YYYY-MM-DD
  description: string;
  categoryId?: string;
  accountId: string;
  isActive: boolean;
}

export interface MonthlySummary {
  month: string; // e.g. "2026-10"
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}
