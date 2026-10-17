import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import confetti from "canvas-confetti";
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
} from "../types/finance";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "error";
  title: string;
  message?: string;
}

export interface DatabaseStatus {
  connected: boolean;
  engine: string;
  databaseUrlConfigured: boolean;
  error?: string;
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
  theme: "dark" | "light";
  themePreference: "system" | "dark" | "light";
  toasts: ToastMessage[];
  isLoading: boolean;
  dbStatus: DatabaseStatus;

  // Actions
  setCurrency: (currency: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  useSystemTheme: () => void;
  toggleTheme: () => void;
  showToast: (
    type: "success" | "info" | "error",
    title: string,
    message?: string,
  ) => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;

  // Account actions
  addAccount: (
    account: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  transferFunds: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    date: string,
  ) => Promise<void>;

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget actions
  setBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  clonePreviousMonthBudgets: (
    targetMonth: number,
    targetYear: number,
  ) => Promise<void>;

  // Savings Goal actions
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => Promise<void>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  depositToGoal: (
    goalId: string,
    fromAccountId: string,
    amount: number,
  ) => Promise<void>;
  withdrawFromGoal: (
    goalId: string,
    toAccountId: string,
    amount: number,
  ) => Promise<void>;

  // Recurring actions
  addRecurring: (rec: Omit<RecurringTransaction, "id">) => Promise<void>;
  updateRecurring: (
    id: string,
    rec: Partial<RecurringTransaction>,
  ) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  executeDueRecurring: (id: string) => Promise<void>;

  // Category actions
  addCategory: (cat: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Helpers
  formatCurrency: (amount: number, customCurrency?: string) => string;
  exportToCSV: (filteredTransactions?: Transaction[]) => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => Promise<boolean>;
  clearAllData: (keepCategories?: boolean) => Promise<void>;
}

const THEME_KEY = "altrack_theme_v2";
type Theme = "dark" | "light";
type ThemePreference = "system" | Theme;

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : "system";
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    engine: "Checking database connection...",
    databaseUrlConfigured: false,
  });

  const [currency, setCurrencyState] = useState<string>("USD");

  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredThemePreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme: Theme = themePreference === "system" ? systemTheme : themePreference;

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Keep following device changes only while the user has not selected a theme.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", syncSystemTheme);
    return () => mediaQuery.removeEventListener("change", syncSystemTheme);
  }, []);

  // Theme synchronization and explicit-preference persistence.
  useEffect(() => {
    if (themePreference === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, themePreference);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.remove("bg-slate-50", "text-slate-900");
      document.body.classList.add("bg-slate-950", "text-slate-100");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("bg-slate-950", "text-slate-100");
      document.body.classList.add("bg-slate-50", "text-slate-900");
    }
  }, [theme, themePreference]);

  const setCurrency = async (newCurrency: string) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      });
      if (!res.ok) throw new Error("Failed to save currency setting");
      const settings = await res.json();
      setCurrencyState(settings.currency);
    } catch (err: any) {
      showToast("error", "Currency Update Failed", err.message);
    }
  };

  const setTheme = (newTheme: "dark" | "light") => {
    setThemePreference(newTheme);
  };

  const useSystemTheme = () => setThemePreference("system");

  const toggleTheme = () => {
    setThemePreference(theme === "dark" ? "light" : "dark");
  };

  // Toast notification system
  const showToast = useCallback(
    (type: "success" | "info" | "error", title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch real data from database API endpoints
  const refreshData = useCallback(async () => {
    try {
      const [
        healthRes,
        settingsRes,
        accRes,
        catRes,
        txRes,
        bgtRes,
        goalRes,
        recRes,
      ] = await Promise.allSettled([
        fetch("/api/health").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/transactions").then((r) => r.json()),
        fetch("/api/budgets").then((r) => r.json()),
        fetch("/api/savings-goals").then((r) => r.json()),
        fetch("/api/recurring").then((r) => r.json()),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value) {
        setDbStatus(healthRes.value);
      }

      if (
        settingsRes.status === "fulfilled" &&
        typeof settingsRes.value?.currency === "string"
      ) {
        setCurrencyState(settingsRes.value.currency);
      }

      if (accRes.status === "fulfilled" && Array.isArray(accRes.value)) {
        setAccounts(accRes.value);
      }

      if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
        setCategories(catRes.value);
      }

      if (txRes.status === "fulfilled" && Array.isArray(txRes.value)) {
        setTransactions(txRes.value);
      }

      if (bgtRes.status === "fulfilled" && Array.isArray(bgtRes.value)) {
        setBudgets(bgtRes.value);
      }

      if (goalRes.status === "fulfilled" && Array.isArray(goalRes.value)) {
        setSavingsGoals(goalRes.value);
      }

      if (recRes.status === "fulfilled" && Array.isArray(recRes.value)) {
        setRecurring(recRes.value);
      }
    } catch (err: any) {
      console.error("API synchronization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Account operations
  const addAccount = async (
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountData),
      });
      if (res.ok) {
        const created = await res.json();
        setAccounts((prev) => [created, ...prev]);
        showToast(
          "success",
          "Account Created",
          `${created.name} added to database`,
        );
      } else {
        throw new Error("Failed to create account");
      }
    } catch (err: any) {
      showToast("error", "Database Error", err.message);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a)),
        );
        showToast("success", "Account Updated");
      }
    } catch (err: any) {
      showToast("error", "Update Failed", err.message);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setTransactions((prev) => prev.filter((t) => t.accountId !== id));
        showToast("info", "Account Deleted", "Removed from database");
      }
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  const transferFunds = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    date: string,
  ) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          type: "TRANSFER",
          date,
          description: description || "Account Transfer",
          accountId: fromAccountId,
          toAccountId,
          isRecurring: false,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTransactions((prev) => [created, ...prev]);
        // Update local account balances
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === fromAccountId)
              return { ...acc, balance: acc.balance - amount };
            if (acc.id === toAccountId)
              return { ...acc, balance: acc.balance + amount };
            return acc;
          }),
        );
        showToast(
          "success",
          "Transfer Completed",
          "Balances updated in database",
        );
      }
    } catch (err: any) {
      showToast("error", "Transfer Failed", err.message);
    }
  };

  // Transaction operations
  const addTransaction = async (
    txData: Omit<Transaction, "id" | "createdAt">,
  ) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });

      if (res.ok) {
        const created = await res.json();
        setTransactions((prev) => [created, ...prev]);

        // Immediate balance adjustment
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === txData.accountId) {
              const diff =
                txData.type === "INCOME" ? txData.amount : -txData.amount;
              return { ...acc, balance: acc.balance + diff };
            }
            if (
              txData.type === "TRANSFER" &&
              txData.toAccountId &&
              acc.id === txData.toAccountId
            ) {
              return { ...acc, balance: acc.balance + txData.amount };
            }
            return acc;
          }),
        );

        showToast(
          "success",
          "Transaction Recorded",
          `${created.description} saved to database`,
        );
      }
    } catch (err: any) {
      showToast("error", "Transaction Failed", err.message);
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>,
  ) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      await refreshData();
      showToast("success", "Transaction Updated", "Saved to database");
    } catch (err: any) {
      showToast("error", "Update Failed", err.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const target = transactions.find((t) => t.id === id);
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        if (target) {
          setAccounts((prev) =>
            prev.map((acc) => {
              if (acc.id === target.accountId) {
                const reversal =
                  target.type === "INCOME" ? -target.amount : target.amount;
                return { ...acc, balance: acc.balance + reversal };
              }
              if (
                target.type === "TRANSFER" &&
                target.toAccountId &&
                acc.id === target.toAccountId
              ) {
                return { ...acc, balance: acc.balance - target.amount };
              }
              return acc;
            }),
          );
        }
        showToast("info", "Transaction Deleted", "Reversed from database");
      }
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  // Budget operations
  const setBudget = async (budgetData: Omit<Budget, "id">) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      if (res.ok) {
        const saved = await res.json();
        setBudgets((prev) => {
          const idx = prev.findIndex(
            (b) =>
              b.categoryId === budgetData.categoryId &&
              b.month === budgetData.month &&
              b.year === budgetData.year,
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = saved;
            return updated;
          }
          return [...prev, saved];
        });
        showToast(
          "success",
          "Budget Saved",
          "Category target saved to database",
        );
      }
    } catch (err: any) {
      showToast("error", "Budget Failed", err.message);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        showToast("info", "Budget Removed");
      }
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  const clonePreviousMonthBudgets = async (
    targetMonth: number,
    targetYear: number,
  ) => {
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const previousBudgets = budgets.filter(
      (b) => b.month === prevMonth && b.year === prevYear,
    );

    if (previousBudgets.length === 0) {
      showToast(
        "info",
        "No Prior Budgets",
        `No budget records found for ${prevMonth}/${prevYear}`,
      );
      return;
    }

    for (const b of previousBudgets) {
      await setBudget({
        categoryId: b.categoryId,
        amountLimit: b.amountLimit,
        month: targetMonth,
        year: targetYear,
      });
    }

    showToast(
      "success",
      "Budgets Rolled Over",
      `Copied ${previousBudgets.length} budgets to current month`,
    );
  };

  // Savings Goal operations
  const addSavingsGoal = async (goalData: Omit<SavingsGoal, "id">) => {
    try {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });
      if (res.ok) {
        const created = await res.json();
        setSavingsGoals((prev) => [created, ...prev]);
        showToast(
          "success",
          "Goal Created",
          `${created.name} saved to database`,
        );
      }
    } catch (err: any) {
      showToast("error", "Goal Failed", err.message);
    }
  };

  const updateSavingsGoal = async (
    id: string,
    updates: Partial<SavingsGoal>,
  ) => {
    try {
      const res = await fetch(`/api/savings-goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setSavingsGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, ...updated } : g)),
        );
        showToast("success", "Goal Updated");
      }
    } catch (err: any) {
      showToast("error", "Update Failed", err.message);
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
        showToast("info", "Goal Removed");
      }
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  const depositToGoal = async (
    goalId: string,
    fromAccountId: string,
    amount: number,
  ) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    await updateSavingsGoal(goalId, { currentAmount: newAmount });

    // Deduct from account
    const acc = accounts.find((a) => a.id === fromAccountId);
    if (acc) {
      await updateAccount(fromAccountId, { balance: acc.balance - amount });
    }

    if (newAmount >= goal.targetAmount) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast(
        "success",
        "Goal Completed!",
        `You reached 100% of your target for ${goal.name}!`,
      );
    } else {
      showToast("success", "Deposit Recorded", `Added to ${goal.name}`);
    }
  };

  const withdrawFromGoal = async (
    goalId: string,
    toAccountId: string,
    amount: number,
  ) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Math.max(0, goal.currentAmount - amount);
    await updateSavingsGoal(goalId, { currentAmount: newAmount });

    // Add to account
    const acc = accounts.find((a) => a.id === toAccountId);
    if (acc) {
      await updateAccount(toAccountId, { balance: acc.balance + amount });
    }

    showToast(
      "info",
      "Funds Withdrawn",
      `Transferred back to ${acc?.name || "account"}`,
    );
  };

  // Recurring operations
  const addRecurring = async (recData: Omit<RecurringTransaction, "id">) => {
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recData),
      });
      if (res.ok) {
        const created = await res.json();
        setRecurring((prev) => [created, ...prev]);
        showToast(
          "success",
          "Subscription Saved",
          `${created.description} recorded`,
        );
      }
    } catch (err: any) {
      showToast("error", "Recurring Failed", err.message);
    }
  };

  const updateRecurring = async (
    id: string,
    updates: Partial<RecurringTransaction>,
  ) => {
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update recurring transaction");
      const updated = await res.json();
      setRecurring((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast("success", "Recurring Updated", "Saved to database");
    } catch (err: any) {
      showToast("error", "Update Failed", err.message);
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecurring((prev) => prev.filter((r) => r.id !== id));
        showToast("info", "Recurring Schedule Deleted");
      }
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  const executeDueRecurring = async (id: string) => {
    const item = recurring.find((r) => r.id === id);
    if (!item) return;

    await addTransaction({
      amount: item.amount,
      type: item.type,
      date: new Date().toISOString().split("T")[0],
      description: item.description,
      categoryId: item.categoryId,
      accountId: item.accountId,
      isRecurring: true,
      notes: `Automated recurring payment (${item.frequency.toLowerCase()})`,
    });

    // Advance next due date
    const d = new Date(item.nextDueDate);
    if (item.frequency === "WEEKLY") d.setDate(d.getDate() + 7);
    else if (item.frequency === "MONTHLY") d.setMonth(d.getMonth() + 1);
    else if (item.frequency === "YEARLY") d.setFullYear(d.getFullYear() + 1);

    await updateRecurring(id, { nextDueDate: d.toISOString().split("T")[0] });
    showToast("success", "Payment Recorded", `Logged ${item.description}`);
  };

  // Category operations
  const addCategory = async (catData: Omit<Category, "id">) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        showToast("success", "Category Created");
      }
    } catch (err: any) {
      showToast("error", "Category Failed", err.message);
    }
  };

  const updateCategory = async (id: string, catData: Partial<Category>) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      if (!res.ok) throw new Error("Failed to update category");
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      showToast("error", "Update Failed", err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      await refreshData();
      showToast("info", "Category Deleted");
    } catch (err: any) {
      showToast("error", "Delete Failed", err.message);
    }
  };

  // Helpers
  const formatCurrency = useCallback(
    (amount: number, customCurrency?: string) => {
      const targetCurrency = customCurrency || currency;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: targetCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [currency],
  );

  const exportToCSV = (filteredTransactions?: Transaction[]) => {
    const dataToExport = filteredTransactions || transactions;
    if (dataToExport.length === 0) {
      showToast(
        "info",
        "No Transactions",
        "No transaction logs available to export",
      );
      return;
    }

    const headers = [
      "Date",
      "Description",
      "Type",
      "Amount",
      "Category",
      "Account",
      "Notes",
      "Tags",
    ];
    const rows = dataToExport.map((t) => {
      const cat =
        categories.find((c) => c.id === t.categoryId)?.name || "Uncategorized";
      const acc =
        accounts.find((a) => a.id === t.accountId)?.name || "Unknown Account";
      return [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.amount.toFixed(2),
        `"${cat}"`,
        `"${acc}"`,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(", ")}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `altrack-transactions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast(
      "success",
      "CSV Exported",
      `Downloaded ${dataToExport.length} transactions`,
    );
  };

  const exportBackupJSON = () => {
    const backupData = {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      currency,
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurring,
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `altrack-database-export-${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(
      "success",
      "Backup Exported",
      "Full database snapshot downloaded",
    );
  };

  const importBackupJSON = async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (
        !data.accounts ||
        !data.categories ||
        !data.transactions ||
        !data.budgets ||
        !data.savingsGoals ||
        !data.recurring
      ) {
        throw new Error("Invalid structure");
      }
      const res = await fetch("/api/database/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Database import failed");
      await refreshData();

      showToast(
        "success",
        "Backup Restored",
        "Data imported into the database",
      );
      return true;
    } catch {
      showToast("error", "Restore Failed", "JSON file is invalid or corrupted");
      return false;
    }
  };

  const clearAllData = async (keepCategories = true) => {
    try {
      const res = await fetch("/api/database/clear-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepCategories }),
      });
      if (!res.ok) throw new Error("Failed to clear database");
    } catch (err: any) {
      showToast("error", "Database Clear Failed", err.message);
      return;
    }

    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
    setRecurring([]);
    if (!keepCategories) {
      setCategories([]);
    }

    showToast(
      "info",
      "Database Cleared",
      keepCategories
        ? "All accounts, transactions, and budgets wiped. Standard categories retained."
        : "All records and category taxonomies completely cleared.",
    );
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
        themePreference,
        toasts,
        isLoading,
        dbStatus,
        setCurrency,
        setTheme,
        useSystemTheme,
        toggleTheme,
        showToast,
        removeToast,
        refreshData,
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
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
