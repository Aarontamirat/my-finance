import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types/finance';
import { X, DollarSign, Target } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBudget?: Budget | null;
  defaultMonth?: number;
  defaultYear?: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  initialBudget,
  defaultMonth = 10,
  defaultYear = 2026,
}) => {
  const { categories, setBudget, currency, formatCurrency } = useFinance();

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const [categoryId, setCategoryId] = useState<string>(
    initialBudget?.categoryId || expenseCategories[0]?.id || ''
  );
  const [amountLimit, setAmountLimit] = useState<string>(
    initialBudget ? initialBudget.amountLimit.toString() : ''
  );
  const [month, setMonth] = useState<number>(initialBudget?.month || defaultMonth);
  const [year, setYear] = useState<number>(initialBudget?.year || defaultYear);

  useEffect(() => {
    if (initialBudget) {
      setCategoryId(initialBudget.categoryId);
      setAmountLimit(initialBudget.amountLimit.toString());
      setMonth(initialBudget.month);
      setYear(initialBudget.year);
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setAmountLimit('');
      setMonth(defaultMonth);
      setYear(defaultYear);
    }
  }, [initialBudget, isOpen, defaultMonth, defaultYear]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountLimit);
    if (isNaN(parsed) || parsed <= 0 || !categoryId) return;

    setBudget({
      categoryId,
      amountLimit: parsed,
      month,
      year,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              {initialBudget ? 'Edit Monthly Budget' : 'Set Category Budget'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Expense Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Limit */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Monthly Limit ({currency})</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-lg">
                <DollarSign className="w-5 h-5" />
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                autoFocus
                placeholder="e.g. 500"
                value={amountLimit}
                onChange={(e) => setAmountLimit(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xl font-mono font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-sm transition-colors"
            >
              Save Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
