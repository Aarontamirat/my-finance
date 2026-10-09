import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  AccountType,
  TransactionType,
  Frequency
} from '../types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_RECURRING
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
}

interface FinanceContextType {
  // Data
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurring: RecurringTransaction[];
  currency: string;
  theme: 'dark' | 'light';
  toasts: ToastMessage[];

  // Actions
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  showToast: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // Account actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, description: string, date: string) => void;

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budget actions
  setBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  clonePreviousMonthBudgets: (targetMonth: number, targetYear: number) => void;

  // Savings Goal actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  depositToGoal: (goalId: string, fromAccountId: string, amount: number) => void;
  withdrawFromGoal: (goalId: string, toAccountId: string, amount: number) => void;

  // Recurring actions
  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurring: (id: string, rec: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  executeDueRecurring: (id: string) => void;

  // Category actions
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Helpers
  formatCurrency: (amount: number, customCurrency?: string) => string;
  exportToCSV: (filteredTransactions?: Transaction[]) => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => boolean;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'auraledger_state_v1';
const THEME_KEY = 'auraledger_theme_v1';
const CURRENCY_KEY = 'auraledger_currency_v1';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_budgets`);
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  const [recurring, setRecurring] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_recurring`);
    return saved ? JSON.parse(saved) : INITIAL_RECURRING;
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem(CURRENCY_KEY) || 'USD';
  });

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_budgets`, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_recurring`, JSON.stringify(recurring));
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
  }, [theme]);

  // Toast helper
  const showToast = (type: 'success' | 'info' | 'error', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    showToast('info', 'Currency updated', `Display currency changed to ${c}`);
  };

  const formatCurrency = (amount: number, customCurrency?: string) => {
    const cur = customCurrency || currency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ---------------- ACCOUNTS ----------------
  const addAccount = (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...data,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    showToast('success', 'Account created', `Added "${newAccount.name}"`);
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...data, updatedAt: new Date().toISOString() } : acc))
    );
    showToast('success', 'Account updated');
  };

  const deleteAccount = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast('info', 'Account deleted', `Removed "${target.name}"`);
  };

  const transferFunds = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    date: string
  ) => {
    if (fromAccountId === toAccountId) {
      showToast('error', 'Transfer invalid', 'Source and destination accounts must be different');
      return;
    }
    if (amount <= 0) {
      showToast('error', 'Invalid amount', 'Transfer amount must be greater than zero');
      return;
    }

    // Adjust balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: acc.balance - amount, updatedAt: new Date().toISOString() };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount, updatedAt: new Date().toISOString() };
        }
        return acc;
      })
    );

    // Record transfer transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount,
      type: 'TRANSFER',
      date: date || new Date().toISOString().split('T')[0],
      description: description || 'Account Transfer',
      accountId: fromAccountId,
      toAccountId,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast('success', 'Transfer complete', `${formatCurrency(amount)} transferred successfully`);
  };

  // ---------------- TRANSACTIONS ----------------
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update account balances based on type
    setAccounts((prev) =>
      prev.map((acc) => {
        if (data.type === 'INCOME' && acc.id === data.accountId) {
          return { ...acc, balance: acc.balance + data.amount, updatedAt: new Date().toISOString() };
        }
        if (data.type === 'EXPENSE' && acc.id === data.accountId) {
          return { ...acc, balance: acc.balance - data.amount, updatedAt: new Date().toISOString() };
        }
        if (data.type === 'TRANSFER') {
          if (acc.id === data.accountId) {
            return { ...acc, balance: acc.balance - data.amount, updatedAt: new Date().toISOString() };
          }
          if (acc.id === data.toAccountId) {
            return { ...acc, balance: acc.balance + data.amount, updatedAt: new Date().toISOString() };
          }
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    showToast('success', 'Transaction saved', `${data.description} (${formatCurrency(data.amount)})`);
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const merged = { ...oldTx, ...updated };

    // Revert old transaction effect on balances
    let balanceDeltas: Record<string, number> = {};
    if (oldTx.type === 'INCOME') {
      balanceDeltas[oldTx.accountId] = (balanceDeltas[oldTx.accountId] || 0) - oldTx.amount;
    } else if (oldTx.type === 'EXPENSE') {
      balanceDeltas[oldTx.accountId] = (balanceDeltas[oldTx.accountId] || 0) + oldTx.amount;
    } else if (oldTx.type === 'TRANSFER') {
      balanceDeltas[oldTx.accountId] = (balanceDeltas[oldTx.accountId] || 0) + oldTx.amount;
      if (oldTx.toAccountId) {
        balanceDeltas[oldTx.toAccountId] = (balanceDeltas[oldTx.toAccountId] || 0) - oldTx.amount;
      }
    }

    // Apply new transaction effect on balances
    if (merged.type === 'INCOME') {
      balanceDeltas[merged.accountId] = (balanceDeltas[merged.accountId] || 0) + merged.amount;
    } else if (merged.type === 'EXPENSE') {
      balanceDeltas[merged.accountId] = (balanceDeltas[merged.accountId] || 0) - merged.amount;
    } else if (merged.type === 'TRANSFER') {
      balanceDeltas[merged.accountId] = (balanceDeltas[merged.accountId] || 0) - merged.amount;
      if (merged.toAccountId) {
        balanceDeltas[merged.toAccountId] = (balanceDeltas[merged.toAccountId] || 0) + merged.amount;
      }
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        const delta = balanceDeltas[acc.id] || 0;
        return delta !== 0
          ? { ...acc, balance: acc.balance + delta, updatedAt: new Date().toISOString() }
          : acc;
      })
    );

    setTransactions((prev) => prev.map((t) => (t.id === id ? merged : t)));
    showToast('success', 'Transaction updated');
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Revert impact on balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (tx.type === 'INCOME' && acc.id === tx.accountId) {
          return { ...acc, balance: acc.balance - tx.amount, updatedAt: new Date().toISOString() };
        }
        if (tx.type === 'EXPENSE' && acc.id === tx.accountId) {
          return { ...acc, balance: acc.balance + tx.amount, updatedAt: new Date().toISOString() };
        }
        if (tx.type === 'TRANSFER') {
          if (acc.id === tx.accountId) {
            return { ...acc, balance: acc.balance + tx.amount, updatedAt: new Date().toISOString() };
          }
          if (acc.id === tx.toAccountId) {
            return { ...acc, balance: acc.balance - tx.amount, updatedAt: new Date().toISOString() };
          }
        }
        return acc;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Transaction deleted');
  };

  // ---------------- BUDGETS ----------------
  const setBudget = (budgetData: Omit<Budget, 'id'>) => {
    setBudgets((prev) => {
      const existingIndex = prev.findIndex(
        (b) =>
          b.categoryId === budgetData.categoryId &&
          b.month === budgetData.month &&
          b.year === budgetData.year
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...budgetData };
        return copy;
      }
      return [...prev, { ...budgetData, id: `bgt-${Date.now()}` }];
    });
    showToast('success', 'Budget configured', `Limit set to ${formatCurrency(budgetData.amountLimit)}`);
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    showToast('info', 'Budget removed');
  };

  const clonePreviousMonthBudgets = (targetMonth: number, targetYear: number) => {
    let sourceMonth = targetMonth - 1;
    let sourceYear = targetYear;
    if (sourceMonth === 0) {
      sourceMonth = 12;
      sourceYear = targetYear - 1;
    }

    const sourceBudgets = budgets.filter((b) => b.month === sourceMonth && b.year === sourceYear);
    if (sourceBudgets.length === 0) {
      showToast('info', 'No prior budgets found', `No budgets recorded for ${sourceMonth}/${sourceYear}`);
      return;
    }

    setBudgets((prev) => {
      // Remove any existing budgets in target month
      const filtered = prev.filter((b) => !(b.month === targetMonth && b.year === targetYear));
      const cloned = sourceBudgets.map((b) => ({
        ...b,
        id: `bgt-${Date.now()}-${b.categoryId}`,
        month: targetMonth,
        year: targetYear,
      }));
      return [...filtered, ...cloned];
    });

    showToast('success', 'Budgets rolled over', `Copied ${sourceBudgets.length} budgets from previous month`);
  };

  // ---------------- SAVINGS GOALS ----------------
  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    showToast('success', 'Savings Goal created', `Target: ${formatCurrency(newGoal.targetAmount)}`);
  };

  const updateSavingsGoal = (id: string, goalData: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...goalData } : g))
    );
    showToast('success', 'Goal updated');
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    showToast('info', 'Goal deleted');
  };

  const depositToGoal = (goalId: string, fromAccountId: string, amount: number) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    const account = accounts.find((a) => a.id === fromAccountId);
    if (!goal || !account) return;

    if (amount <= 0) {
      showToast('error', 'Invalid deposit', 'Amount must be greater than zero');
      return;
    }

    // Deduct from account
    setAccounts((prev) =>
      prev.map((a) => (a.id === fromAccountId ? { ...a, balance: a.balance - amount, updatedAt: new Date().toISOString() } : a))
    );

    // Add to goal
    const updatedCurrent = goal.currentAmount + amount;
    const reachedGoal = updatedCurrent >= goal.targetAmount && goal.currentAmount < goal.targetAmount;

    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, currentAmount: updatedCurrent } : g))
    );

    // Record as transfer transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      description: `Savings Deposit: ${goal.name}`,
      accountId: fromAccountId,
      notes: `Allocated to savings goal "${goal.name}"`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (reachedGoal) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast('success', '🎉 Target Reached!', `You fully funded "${goal.name}"! Outstanding job!`);
    } else {
      showToast('success', 'Deposit saved', `Added ${formatCurrency(amount)} to "${goal.name}"`);
    }
  };

  const withdrawFromGoal = (goalId: string, toAccountId: string, amount: number) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    if (amount <= 0 || amount > goal.currentAmount) {
      showToast('error', 'Invalid amount', 'Cannot withdraw more than current saved balance');
      return;
    }

    // Add to account
    setAccounts((prev) =>
      prev.map((a) => (a.id === toAccountId ? { ...a, balance: a.balance + amount, updatedAt: new Date().toISOString() } : a))
    );

    // Deduct from goal
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, currentAmount: g.currentAmount - amount } : g))
    );

    // Record transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount,
      type: 'INCOME',
      date: new Date().toISOString().split('T')[0],
      description: `Savings Withdrawal: ${goal.name}`,
      accountId: toAccountId,
      notes: `Withdrawn from savings goal "${goal.name}"`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast('info', 'Withdrawal recorded', `${formatCurrency(amount)} returned to account`);
  };

  // ---------------- RECURRING ----------------
  const addRecurring = (recData: Omit<RecurringTransaction, 'id'>) => {
    const newRec: RecurringTransaction = {
      ...recData,
      id: `rec-${Date.now()}`,
    };
    setRecurring((prev) => [...prev, newRec]);
    showToast('success', 'Recurring transaction registered', `"${newRec.description}" (${newRec.frequency})`);
  };

  const updateRecurring = (id: string, recData: Partial<RecurringTransaction>) => {
    setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, ...recData } : r)));
    showToast('success', 'Recurring item updated');
  };

  const deleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'Recurring item removed');
  };

  const advanceNextDueDate = (currentDateStr: string, frequency: Frequency): string => {
    const d = new Date(currentDateStr);
    if (frequency === 'WEEKLY') {
      d.setDate(d.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
      d.setMonth(d.getMonth() + 1);
    } else if (frequency === 'YEARLY') {
      d.setFullYear(d.getFullYear() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const executeDueRecurring = (id: string) => {
    const item = recurring.find((r) => r.id === id);
    if (!item) return;

    // Add transaction
    addTransaction({
      amount: item.amount,
      type: item.type,
      date: new Date().toISOString().split('T')[0],
      description: `${item.description} (Auto-recurring)`,
      categoryId: item.categoryId,
      accountId: item.accountId,
      isRecurring: true,
      notes: `Executed from recurring rule (${item.frequency})`,
    });

    // Advance next due date
    const nextDate = advanceNextDueDate(item.nextDueDate, item.frequency);
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, nextDueDate: nextDate } : r))
    );

    showToast('success', 'Recurring bill logged', `Next due date scheduled for ${nextDate}`);
  };

  // ---------------- CATEGORIES ----------------
  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast('success', 'Category added', newCat.name);
  };

  const updateCategory = (id: string, catData: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...catData } : c)));
    showToast('success', 'Category modified');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('info', 'Category removed');
  };

  // ---------------- EXPORTS & IMPORTS ----------------
  const exportToCSV = (filteredTransactions?: Transaction[]) => {
    const txList = filteredTransactions || transactions;
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category', 'Account', 'To Account', 'Recurring', 'Notes'];

    const rows = txList.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId)?.name || 'Uncategorized';
      const acc = accounts.find((a) => a.id === tx.accountId)?.name || 'Unknown';
      const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId)?.name || '' : '';
      return [
        tx.id,
        tx.date,
        tx.type,
        tx.amount.toFixed(2),
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${cat.replace(/"/g, '""')}"`,
        `"${acc.replace(/"/g, '""')}"`,
        `"${toAcc.replace(/"/g, '""')}"`,
        tx.isRecurring ? 'Yes' : 'No',
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auraledger-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'CSV exported', `Exported ${txList.length} transaction rows`);
  };

  const exportBackupJSON = () => {
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurring,
      currency,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auraledger-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('success', 'Backup exported', 'Full database snapshot saved');
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.accounts || !data.transactions) {
        throw new Error('Invalid structure');
      }
      setAccounts(data.accounts);
      if (data.categories) setCategories(data.categories);
      setTransactions(data.transactions);
      if (data.budgets) setBudgets(data.budgets);
      if (data.savingsGoals) setSavingsGoals(data.savingsGoals);
      if (data.recurring) setRecurring(data.recurring);
      if (data.currency) setCurrencyState(data.currency);

      showToast('success', 'Backup restored successfully');
      return true;
    } catch {
      showToast('error', 'Restore failed', 'Provided JSON file is invalid or corrupted');
      return false;
    }
  };

  const resetDemoData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setRecurring(INITIAL_RECURRING);
    showToast('info', 'Demo data reset', 'Restored default sample finance records');
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        budgets,
        savingsGoals,
        recurring,
        currency,
        theme,
        toasts,
        setCurrency,
        setTheme,
        toggleTheme,
        showToast,
        removeToast,
        addAccount,
        updateAccount,
        deleteAccount,
        transferFunds,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setBudget,
        deleteBudget,
        clonePreviousMonthBudgets,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        depositToGoal,
        withdrawFromGoal,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        executeDueRecurring,
        addCategory,
        updateCategory,
        deleteCategory,
        formatCurrency,
        exportToCSV,
        exportBackupJSON,
        importBackupJSON,
        resetDemoData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
