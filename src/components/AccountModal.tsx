import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types/finance';
import { X, CreditCard, Landmark, PiggyBank, Banknote } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: Account | null;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialAccount,
}) => {
  const { addAccount, updateAccount, currency } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setBalance(initialAccount.balance.toString());
      setInstitution(initialAccount.institution || '');
      setAccountNumber(initialAccount.accountNumber || '');
      setColor(initialAccount.color || PRESET_COLORS[0]);
    } else {
      setName('');
      setType('BANK');
      setBalance('');
      setInstitution('');
      setAccountNumber('');
      setColor(PRESET_COLORS[0]);
    }
  }, [initialAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance) || 0;

    if (!name.trim()) return;

    if (initialAccount) {
      updateAccount(initialAccount.id, {
        name: name.trim(),
        type,
        balance: parsedBalance,
        institution: institution.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        color,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        balance: parsedBalance,
        currency,
        color,
        institution: institution.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-slate-100">
            {initialAccount ? 'Edit Account' : 'Add New Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Chase Sapphire, Main Checking, Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('BANK')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  type === 'BANK'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-4 h-4 shrink-0" />
                Checking / Bank
              </button>
              <button
                type="button"
                onClick={() => setType('SAVINGS')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  type === 'SAVINGS'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <PiggyBank className="w-4 h-4 shrink-0" />
                Savings / HYSA
              </button>
              <button
                type="button"
                onClick={() => setType('CREDIT')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  type === 'CREDIT'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setType('CASH')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  type === 'CASH'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0" />
                Cash Wallet
              </button>
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {type === 'CREDIT' ? 'Current Balance (negative if owed, e.g. -450)' : 'Current Balance'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Optional Institution & Mask */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Financial Institution</label>
              <input
                type="text"
                placeholder="e.g. Chase, Schwab"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Mask (Last 4)</label>
              <input
                type="text"
                maxLength={8}
                placeholder="•••• 1234"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Card Color Accent</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {initialAccount ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
