import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  CreditCard,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  onOpenTransactionModal: () => void;
  onOpenTransferModal: () => void;
  onNavigateTab: (tab: string) => void;
  onEditTransaction: (tx: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTransactionModal,
  onOpenTransferModal,
  onNavigateTab,
  onEditTransaction,
}) => {
  const {
    accounts,
    categories,
    transactions,
    budgets,
    recurring,
    formatCurrency,
    executeDueRecurring,
  } = useFinance();

  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);

  // Current date anchor (October 2026 based on mock context or current device)
  const currentDate = new Date('2026-10-09');
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 10

  // 1. Net worth calculation
  const netWorth = useMemo(() => {
    return accounts.reduce((acc, account) => acc + account.balance, 0);
  }, [accounts]);

  // 2. Current month income, expense, and savings rate
  const monthlyMetrics = useMemo(() => {
    const currentMonthPrefix = `2026-10`; // October 2026

    const thisMonthTx = transactions.filter((tx) =>
      tx.date.startsWith(currentMonthPrefix)
    );

    const income = thisMonthTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = thisMonthTx
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

    return { income, expenses, netSavings, savingsRate };
  }, [transactions]);

  // 3. Due recurring transactions (due today or in past/near future)
  const dueRecurringItems = useMemo(() => {
    const todayStr = '2026-10-09';
    return recurring.filter((item) => item.isActive && item.nextDueDate <= '2026-10-15');
  }, [recurring]);

  // 4. Cash Flow Chart Data (Past 6 months: May 2026 - Oct 2026)
  const cashFlowData = useMemo(() => {
    const monthKeys = [
      { key: '2026-05', label: 'May' },
      { key: '2026-06', label: 'Jun' },
      { key: '2026-07', label: 'Jul' },
      { key: '2026-08', label: 'Aug' },
      { key: '2026-09', label: 'Sep' },
      { key: '2026-10', label: 'Oct' },
    ].slice(6 - timeRangeMonths);

    return monthKeys.map(({ key, label }) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTx
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      // Add baseline fallback values for older historical months if no tx recorded
      const displayIncome = income > 0 ? income : (key === '2026-05' ? 7800 : key === '2026-06' ? 8200 : income);
      const displayExpense = expense > 0 ? expense : (key === '2026-05' ? 3200 : key === '2026-06' ? 3400 : expense);

      return {
        month: label,
        income: displayIncome,
        expense: displayExpense,
        net: displayIncome - displayExpense,
      };
    });
  }, [transactions, timeRangeMonths]);

  // 5. Category Breakdown Donut Data for current month
  const categorySpendingData = useMemo(() => {
    const currentMonthPrefix = `2026-10`;
    const thisMonthExpenses = transactions.filter(
      (tx) => tx.type === 'EXPENSE' && tx.date.startsWith(currentMonthPrefix)
    );

    const totalsByCategory: Record<string, number> = {};
    thisMonthExpenses.forEach((tx) => {
      const catId = tx.categoryId || 'uncategorized';
      totalsByCategory[catId] = (totalsByCategory[catId] || 0) + tx.amount;
    });

    const result = Object.entries(totalsByCategory)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Uncategorized',
          value: amount,
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'Tag',
        };
      })
      .sort((a, b) => b.value - a.value);

    return result;
  }, [transactions, categories]);

  // 6. Current Month Budgets Status
  const budgetStatuses = useMemo(() => {
    const currentMonthPrefix = `2026-10`;
    const currentMonthBudgets = budgets.filter(
      (b) => b.month === currentMonth && b.year === currentYear
    );

    return currentMonthBudgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'EXPENSE' &&
            t.categoryId === b.categoryId &&
            t.date.startsWith(currentMonthPrefix)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = Math.round((spent / b.amountLimit) * 100);
      const remaining = b.amountLimit - spent;

      return {
        ...b,
        categoryName: cat?.name || 'Unknown',
        color: cat?.color || '#6366F1',
        icon: cat?.icon || 'Tag',
        spent,
        percent,
        remaining,
        isOver: percent >= 100,
        isWarning: percent >= 80 && percent < 100,
      };
    });
  }, [budgets, categories, transactions, currentMonth, currentYear]);

  // 7. Recent Transactions (last 6)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Financial Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              October 2026
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time cash flow, budget thresholds, and account liquidity overview.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            Transfer
          </button>
          <button
            onClick={onOpenTransactionModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 transition-all shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Due Recurring Transactions Banner (if any) */}
      {dueRecurringItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                {dueRecurringItems.length} Upcoming Scheduled Payments
              </h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-200/70">
                {dueRecurringItems.map((d) => `${d.description} (${formatCurrency(d.amount)})`).join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            {dueRecurringItems.slice(0, 2).map((item) => (
              <button
                key={item.id}
                onClick={() => executeDueRecurring(item.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
              >
                Record {item.description.split(' ')[0]}
              </button>
            ))}
            <button
              onClick={() => onNavigateTab('recurring')}
              className="px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              View all
            </button>
          </div>
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Net Worth (Total Balance)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {formatCurrency(netWorth)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">+4.8%</span>
            <span className="text-slate-400 dark:text-slate-500">across {accounts.length} active accounts</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Monthly Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Monthly Income (Oct)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(monthlyMetrics.income)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">On track</span>
            <span className="text-slate-400 dark:text-slate-500">via salary & freelance</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Monthly Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Monthly Expenses (Oct)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {formatCurrency(monthlyMetrics.expenses)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {formatCurrency(monthlyMetrics.expenses / 9)}/day
            </span>
            <span className="text-slate-400 dark:text-slate-500">average daily run-rate</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Monthly Savings Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Savings Rate</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-sky-600 dark:text-sky-400 flex items-baseline gap-2">
            {monthlyMetrics.savingsRate}%
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({formatCurrency(monthlyMetrics.netSavings)} saved)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 dark:bg-sky-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, monthlyMetrics.savingsRate)}%` }}
            />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* 2. Visual Analytics Section: Cash Flow Area Chart & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Over Time (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Cash Flow Dynamics (Income vs Expense)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trend trajectory over recent billing cycles</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setTimeRangeMonths(3)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    timeRangeMonths === 3
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  3M
                </button>
                <button
                  onClick={() => setTimeRangeMonths(6)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    timeRangeMonths === 6
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  6M
                </button>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                    color: '#F8FAFC'
                  }}
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value) || 0),
                    name === 'income' ? 'Income' : name === 'expense' ? 'Expenses' : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Income Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Expense Outflow</span>
            </div>
          </div>
        </div>

        {/* Expense Category Donut Breakdown (1 Column) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                Expenses by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current month distribution</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
            >
              Budgets <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categorySpendingData.length > 0 ? (
            <>
              <div className="w-full h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpendingData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categorySpendingData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: '#F8FAFC'
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Spent</span>
                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(monthlyMetrics.expenses)}
                  </span>
                </div>
              </div>

              {/* Ranked Category List */}
              <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                {categorySpendingData.slice(0, 4).map((cat) => {
                  const pct = Math.round((cat.value / (monthlyMetrics.expenses || 1)) * 100);
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="text-slate-900 dark:text-slate-200 font-medium">{formatCurrency(cat.value)}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No expenses recorded for this billing cycle yet.
            </div>
          )}
        </div>
      </div>

      {/* 3. Budget Progress Overview Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Smart Budget Overview (October 2026)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time category spending thresholds and limits</p>
          </div>
          <button
            onClick={() => onNavigateTab('budgets')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
          >
            Manage All Budgets <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {budgetStatuses.map((budget) => {
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

            if (budget.isOver) {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
            } else if (budget.isWarning) {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            }

            return (
              <div
                key={budget.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2.5 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${budget.color}20` }}
                    >
                      <CategoryIcon name={budget.icon} color={budget.color} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{budget.categoryName}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badgeBg}`}>
                    {budget.percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, budget.percent)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{formatCurrency(budget.spent)}</span>
                  <span>Limit: {formatCurrency(budget.amountLimit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Accounts Quick Carousel & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linked Accounts Quick Balances */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Active Accounts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total liquid & credit balances</p>
            </div>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{acc.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      {acc.type} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      acc.balance < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenTransferModal}
            className="w-full mt-3 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            Instant Balance Transfer
          </button>
        </div>

        {/* Recent Transactions Feed (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Recent Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest transactions across all accounts</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
            >
              Full Ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {recentTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isIncome = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-2.5 px-1 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isTransfer
                          ? '#0284c725'
                          : isIncome
                          ? '#10b98125'
                          : `${cat?.color || '#ef4444'}20`,
                      }}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      ) : (
                        <CategoryIcon
                          name={cat?.icon || (isIncome ? 'TrendingUp' : 'Tag')}
                          color={isIncome ? '#10B981' : cat?.color || '#EF4444'}
                          className="w-4 h-4"
                        />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="truncate">{acc?.name}</span>
                        {tx.isRecurring && (
                          <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1 rounded">
                            Recurring
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-mono font-bold ${
                        isTransfer
                          ? 'text-sky-600 dark:text-sky-400'
                          : isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{tx.type.toLowerCase()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Showing {recentTransactions.length} recent records</span>
            <button
              onClick={onOpenTransactionModal}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              + Quick Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
