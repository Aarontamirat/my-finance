import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringTransaction, Frequency, TransactionType } from '../types/finance';
import { X, RefreshCw, DollarSign } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecurring?: RecurringTransaction | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  initialRecurring,
}) => {
  const { accounts, categories, addRecurring, updateRecurring, currency } = useFinance();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (initialRecurring) {
      setDescription(initialRecurring.description);
      setAmount(initialRecurring.amount.toString());
      setType(initialRecurring.type);
      setFrequency(initialRecurring.frequency);
      setNextDueDate(initialRecurring.nextDueDate);
      setAccountId(initialRecurring.accountId);
      setCategoryId(initialRecurring.categoryId || '');
    } else {
      setDescription('');
      setAmount('');
      setType('EXPENSE');
      setFrequency('MONTHLY');
      // Default next due date: 1st of next month
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setNextDueDate(d.toISOString().split('T')[0]);
      setAccountId(accounts[0]?.id || '');
      const subCat = categories.find((c) => c.name.toLowerCase().includes('subscript') || c.id === 'cat-subscriptions');
      setCategoryId(subCat?.id || categories[0]?.id || '');
    }
  }, [initialRecurring, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const relevantCategories = categories.filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) return;

    if (initialRecurring) {
      updateRecurring(initialRecurring.id, {
        description: description.trim(),
        amount: parsedAmount,
        type,
        frequency,
        nextDueDate,
        accountId,
        categoryId: categoryId || undefined,
      });
    } else {
      addRecurring({
        description: description.trim(),
        amount: parsedAmount,
        type,
        frequency,
        nextDueDate,
        accountId,
        categoryId: categoryId || undefined,
        isActive: true,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              {initialRecurring ? 'Edit Recurring Schedule' : 'New Recurring Item'}
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
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Apartment Rent, Gym, Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount ({currency})</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-sm">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="EXPENSE">Expense / Bill</option>
                <option value="INCOME">Income / Paycheck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Next Due Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {relevantCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-xl shadow-sm transition-colors"
            >
              {initialRecurring ? 'Save Changes' : 'Create Recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
