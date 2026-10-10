import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types/finance';
import {
  CreditCard,
  Landmark,
  PiggyBank,
  Banknote,
  Plus,
  ArrowLeftRight,
  Pencil,
  Trash2,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AccountsViewProps {
  onOpenAccountModal: (account?: Account) => void;
  onOpenTransferModal: (defaultSourceId?: string) => void;
  onFilterTransactionsByAccount: (accountId: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenAccountModal,
  onOpenTransferModal,
  onFilterTransactionsByAccount,
}) => {
  const { accounts, deleteAccount, formatCurrency } = useFinance();
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netBalance = totalAssets - totalLiabilities;

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'BANK':
        return Landmark;
      case 'SAVINGS':
        return PiggyBank;
      case 'CREDIT':
        return CreditCard;
      case 'CASH':
        return Banknote;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Accounts & Portfolios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage bank accounts, savings vaults, credit lines, and physical cash.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenTransferModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            Transfer Funds
          </button>
          <button
            onClick={() => onOpenAccountModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 transition-all shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Account
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Liquid Assets</p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalAssets)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Checking, Savings & Cash</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Credit Liabilities</p>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalLiabilities)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Credit Cards & Lines of Credit</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Net Liquidity</p>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(netBalance)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Assets minus owed liabilities</p>
        </div>
      </div>

      {/* Account Cards Grid */}
      {accounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No accounts in database yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your actual checking, savings, credit card, or cash wallet to start managing your real finances.
          </p>
          <button
            onClick={() => onOpenAccountModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);
          const isCredit = acc.type === 'CREDIT';

          return (
            <div
              key={acc.id}
              className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-lg relative flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Card Top: Type badge & Menu */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {acc.type}
                      </span>
                      {acc.institution && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{acc.institution}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenAccountModal(acc)}
                      title="Edit Account"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => setAccountToDelete(acc.id)}
                        title="Delete Account"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Name */}
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{acc.name}</h3>
                {acc.accountNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{acc.accountNumber}</p>
                )}

                {/* Balance display */}
                <div className="mt-5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isCredit ? 'Current Balance (Owed)' : 'Available Balance'}
                  </span>
                  <div
                    className={`text-2xl font-extrabold font-mono tracking-tight mt-0.5 ${
                      acc.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenTransferModal(acc.id)}
                  className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeftRight className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                  Transfer
                </button>
                <button
                  onClick={() => onFilterTransactionsByAccount(acc.id)}
                  className="py-1.5 px-3 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  View Activity
                </button>
              </div>

              {/* Accent Pill Glow */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10"
                style={{ backgroundColor: acc.color }}
              />
            </div>
          );
        })}
      </div>
    )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Delete Account?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete this account? Any associated transactions will remain or need re-linking.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAccount(accountToDelete);
                  setAccountToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
