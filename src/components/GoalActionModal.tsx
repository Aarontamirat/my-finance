import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/finance';
import { X, ArrowDown, ArrowUp, DollarSign } from 'lucide-react';

interface GoalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  actionType: 'DEPOSIT' | 'WITHDRAW';
}

export const GoalActionModal: React.FC<GoalActionModalProps> = ({
  isOpen,
  onClose,
  goal,
  actionType,
}) => {
  const { accounts, depositToGoal, withdrawFromGoal, formatCurrency, currency } = useFinance();

  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState('');

  if (!isOpen || !goal) return null;

  const numAmount = parseFloat(amount) || 0;
  const isDeposit = actionType === 'DEPOSIT';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    if (isDeposit) {
      depositToGoal(goal.id, accountId, numAmount);
    } else {
      withdrawFromGoal(goal.id, accountId, numAmount);
    }
    onClose();
  };

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDeposit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {isDeposit ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {isDeposit ? 'Add Deposit to Goal' : 'Withdraw from Goal'}
              </h3>
              <p className="text-xs text-slate-400">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Goal Progress Quick Stats */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Saved:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(goal.currentAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Target Goal:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(goal.targetAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Remaining to Fund:</span>
              <span className="font-semibold text-emerald-400">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount ({currency})</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-lg">
                <DollarSign className="w-5 h-5" />
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={!isDeposit ? goal.currentAmount : undefined}
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xl font-mono font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {isDeposit ? 'Deduct from Account' : 'Deposit into Account'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
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
              className={`px-5 py-2 text-xs font-semibold text-slate-950 rounded-xl shadow-sm transition-colors ${
                isDeposit ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
              }`}
            >
              {isDeposit ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
