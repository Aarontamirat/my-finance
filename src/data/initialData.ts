import { Account, Category, Transaction, Budget, SavingsGoal, RecurringTransaction } from '../types/finance';

// Standard Category Taxonomies (Database Seed Catalog)
export const INITIAL_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-housing', name: 'Housing & Rent', type: 'EXPENSE', icon: 'Home', color: '#6366F1' },
  { id: 'cat-groceries', name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#10B981' },
  { id: 'cat-dining', name: 'Dining & Drinks', type: 'EXPENSE', icon: 'Utensils', color: '#F59E0B' },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'EXPENSE', icon: 'Zap', color: '#EC4899' },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8B5CF6' },
  { id: 'cat-shopping', name: 'Shopping & Gear', type: 'EXPENSE', icon: 'ShoppingBag', color: '#14B8A6' },
  { id: 'cat-health', name: 'Health & Fitness', type: 'EXPENSE', icon: 'HeartPulse', color: '#EF4444' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#F97316' },
  { id: 'cat-education', name: 'Education & Books', type: 'EXPENSE', icon: 'BookOpen', color: '#06B6D4' },
  { id: 'cat-travel', name: 'Travel & Vacations', type: 'EXPENSE', icon: 'Plane', color: '#84CC16' },

  // Income Categories
  { id: 'cat-salary', name: 'Primary Salary', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', type: 'INCOME', icon: 'Laptop', color: '#3B82F6' },
  { id: 'cat-investments', name: 'Dividends & Interest', type: 'INCOME', icon: 'TrendingUp', color: '#8B5CF6' },
  { id: 'cat-refunds', name: 'Refunds & Gifts', type: 'INCOME', icon: 'Gift', color: '#EC4899' },
];

// Pure Real Data Mode: No mock accounts, no fake transactions, no demo sessions
export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];
export const INITIAL_RECURRING: RecurringTransaction[] = [];
