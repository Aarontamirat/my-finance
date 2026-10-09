import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringTransaction } from '../types/finance';
import {
  RefreshCw,
  Plus,
  Calendar,
  Check,
  Pencil,
  Trash2,
  Clock,
  Tv,
  CreditCard,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface RecurringViewProps {
  onOpenRecurringModal: (recurring?: RecurringTransaction) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({ onOpenRecurringModal }) => {
  const {
    recurring,
    categories,
    accounts,
    deleteRecurring,
    executeDueRecurring,
    formatCurrency,
  } = useFinance();

  const [recurringToDelete, setRecurringToDelete] = useState<string | null>(null);

  // Calculate monthly burn from recurring items
  const monthlyFixedBurn = useMemo(() => {
    return recurring
      .filter((r) => r.isActive && r.type === 'EXPENSE')
      .reduce((sum, r) => {
        if (r.frequency === 'MONTHLY') return sum + r.amount;
        if (r.frequency === 'WEEKLY') return sum + r.amount * 4.33;
        if (r.frequency === 'YEARLY') return sum + r.amount / 12;
        return sum;
      }, 0);
  }, [recurring]);

  const monthlyRecurringIncome = useMemo(() => {
    return recurring
      .filter((r) => r.isActive && r.type === 'INCOME')
      .reduce((sum, r) => {
        if (r.frequency === 'MONTHLY') return sum + r.amount;
        if (r.frequency === 'WEEKLY') return sum + r.amount * 4.33;
        if (r.frequency === 'YEARLY') return sum + r.amount / 12;
        return sum;
      }, 0);
  }, [recurring]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Recurring & Subscriptions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automate periodic bills, subscriptions, paychecks, and scheduled commitments.
          </p>
        </div>

        <button
          onClick={() => onOpenRecurringModal()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-purple-400 dark:hover:bg-purple-300 text-white dark:text-slate-950 transition-all shadow-sm shadow-purple-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Recurring Schedule
        </button>
      </div>

      {/* Aggregate Recurring Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Fixed Expenses / Burn</p>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(monthlyFixedBurn)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Rent, streaming, gym & memberships</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Scheduled Income</p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(monthlyRecurringIncome)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Contract salaries & recurring retainers</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Schedules</p>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {recurring.filter((r) => r.isActive).length} active items
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Automated bookkeeping reminders</p>
        </div>
      </div>

      {/* Recurring Schedule List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors duration-200">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {recurring.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const acc = accounts.find((a) => a.id === item.accountId);
            const isExpense = item.type === 'EXPENSE';

            // Due check
            const isDueSoon = item.nextDueDate <= '2026-10-15';

            return (
              <div
                key={item.id}
                className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                {/* Details */}
                <div className="flex items-center gap-3.5">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${cat?.color || '#8B5CF6'}20`,
                    }}
                  >
                    <CategoryIcon
                      name={cat?.icon || 'Tv'}
                      color={cat?.color || '#8B5CF6'}
                      className="w-5 h-5"
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.description}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.frequency}
                      </span>
                      {isDueSoon && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          Due Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Paid via: {acc?.name || 'Account'}</span>
                      <span>•</span>
                      <span>Next Due: {item.nextDueDate}</span>
                    </p>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right font-mono">
                    <p
                      className={`text-base font-bold ${
                        isExpense ? 'text-slate-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 lowercase">per {item.frequency.toLowerCase()}</p>
                  </div>

                  {/* 1-click Record Now button */}
                  <button
                    onClick={() => executeDueRecurring(item.id)}
                    title="Execute and log transaction now"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Record Now
                  </button>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenRecurringModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRecurringToDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recurringToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Delete Recurring Rule?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This rule will be removed. Previously logged transactions will remain in your ledger.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRecurringToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteRecurring(recurringToDelete);
                  setRecurringToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
