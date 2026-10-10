import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types/finance';
import {
  Target,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  DollarSign
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  onOpenBudgetModal: (budget?: Budget) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenBudgetModal }) => {
  const {
    budgets,
    categories,
    transactions,
    deleteBudget,
    clonePreviousMonthBudgets,
    formatCurrency,
  } = useFinance();

  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Filter budgets for active month/year
  const activeBudgets = useMemo(() => {
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthlyBudgets = budgets.filter(
      (b) => b.month === currentMonth && b.year === currentYear
    );

    return monthlyBudgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'EXPENSE' &&
            t.categoryId === b.categoryId &&
            t.date.startsWith(monthKey)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = Math.round((spent / b.amountLimit) * 100);
      const remaining = b.amountLimit - spent;

      return {
        ...b,
        category: cat,
        spent,
        percent,
        remaining,
        isOver: percent >= 100,
        isWarning: percent >= 80 && percent < 100,
      };
    });
  }, [budgets, categories, transactions, currentMonth, currentYear]);

  // Totals
  const totalBudgeted = activeBudgets.reduce((s, b) => s + b.amountLimit, 0);
  const totalSpent = activeBudgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const overspentCount = activeBudgets.filter((b) => b.isOver).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Header with Month Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Smart Budgeting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor limits, prevent overspending, and track real-time category allowances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month selector controls */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-slate-800 dark:text-slate-200 min-w-28 text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => clonePreviousMonthBudgets(currentMonth, currentYear)}
            title="Copy budgets from previous month"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            <Copy className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            Rollover
          </button>
          <button
            onClick={() => onOpenBudgetModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 transition-all shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Budgeted</p>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(totalBudgeted)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Spent in Categories</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Safe-to-Spend Balance</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalRemaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Over-Budget Alerts</p>
            <p
              className={`text-xl font-bold font-mono mt-1 ${
                overspentCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {overspentCount} categories
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Overall Budget Consumption</span>
            <span>{overallPercent}% used</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                overallPercent >= 100
                  ? 'bg-rose-500'
                  : overallPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeBudgets.map((b) => {
          let progressColor = 'bg-emerald-500';
          let borderAccent = 'border-slate-200 dark:border-slate-800';
          let statusText = `${formatCurrency(b.remaining)} remaining`;
          let statusColor = 'text-emerald-600 dark:text-emerald-400';

          if (b.isOver) {
            progressColor = 'bg-rose-500';
            borderAccent = 'border-rose-300 dark:border-rose-500/30';
            statusText = `Exceeded by ${formatCurrency(Math.abs(b.remaining))}`;
            statusColor = 'text-rose-600 dark:text-rose-400 font-semibold';
          } else if (b.isWarning) {
            progressColor = 'bg-amber-500';
            borderAccent = 'border-amber-300 dark:border-amber-500/30';
            statusText = `Approaching limit (${formatCurrency(b.remaining)} left)`;
            statusColor = 'text-amber-600 dark:text-amber-400';
          }

          return (
            <div
              key={b.id}
              className={`rounded-2xl bg-white dark:bg-slate-900/90 border p-5 shadow-xs relative flex flex-col justify-between group transition-all ${borderAccent}`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${b.category?.color || '#6366F1'}20`,
                      }}
                    >
                      <CategoryIcon
                        name={b.category?.icon || 'Tag'}
                        color={b.category?.color || '#6366F1'}
                        className="w-4 h-4"
                      />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {b.category?.name || 'Category'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {monthNames[currentMonth - 1]} limit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenBudgetModal(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBudgetToDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      of {formatCurrency(b.amountLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className={statusColor}>{statusText}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {b.percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activeBudgets.length === 0 && (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <Target className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            No budgets configured for {monthNames[currentMonth - 1]} {currentYear}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set category limits or rollover previous month configurations to stay on track.
          </p>
          <button
            onClick={() => onOpenBudgetModal()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors"
          >
            Create First Budget
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Delete Budget?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove this category budget limit?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBudgetToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBudget(budgetToDelete);
                  setBudgetToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
