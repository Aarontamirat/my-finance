import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, ArrowRight, ArrowLeftRight, DollarSign } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  defaultSourceId,
}) => {
  const { accounts, transferFunds, formatCurrency, currency } = useFinance();

  const [fromAccountId, setFromAccountId] = useState<string>(
    defaultSourceId || accounts[0]?.id || ''
  );
  const [toAccountId, setToAccountId] = useState<string>(
    accounts[1]?.id || accounts[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Account Transfer');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === fromAccountId);
  const destAccount = accounts.find((a) => a.id === toAccountId);
  const numAmount = parseFloat(amount) || 0;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;
    transferFunds(fromAccountId, toAccountId, numAmount, description, date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Transfer Funds</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          {/* Transfer Preview Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl relative">
            <div>
              <p className="text-[11px] text-slate-400">From</p>
              <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{sourceAccount?.name}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Balance: {formatCurrency(sourceAccount?.balance ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">To</p>
              <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{destAccount?.name}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Balance: {formatCurrency(destAccount?.balance ?? 0)}
              </p>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <ArrowRight className="w-3.5 h-3.5" />
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
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xl font-mono font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* From Account & To Account Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Source Account</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Destination Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transfer note"
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl shadow-sm transition-colors"
            >
              Execute Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
