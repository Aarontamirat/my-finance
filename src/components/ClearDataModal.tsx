import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Trash2, AlertTriangle, X, CheckCircle2, Sparkles } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({ isOpen, onClose }) => {
  const { clearAllData } = useFinance();
  const [keepCategories, setKeepCategories] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    clearAllData(keepCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Clear Demo Data & Start Fresh
            </h3>
            <p className="text-xs text-slate-500">
              Prepare your ledger for your own personal finances
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 mb-5">
          <p>
            This action will remove all sample accounts (Checking, High Yield, Robinhood, etc.), transactions, recurring bills, and budgets.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Choose Cleanup Mode
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="cleanupMode"
                checked={keepCategories}
                onChange={() => setKeepCategories(true)}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Keep Standard Categories (Recommended)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Retains standard tags (Groceries, Housing, Salary, Subscriptions) so you can immediately begin adding your real accounts and transactions.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="radio"
                name="cleanupMode"
                checked={!keepCategories}
                onChange={() => setKeepCategories(false)}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Complete Blank Slate
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Wipes everything including all category taxonomies. You will configure every single category from zero.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe Demo & Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
