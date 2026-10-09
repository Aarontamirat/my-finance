import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Target,
  PiggyBank,
  RefreshCw,
  BarChart3,
  Plus,
  Wallet,
  Globe
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickTransaction: () => void;
}

export const Sidebar: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickTransaction,
}) => {
  const {
    accounts,
    currency,
    setCurrency,
    formatCurrency,
  } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Smart Budgets', icon: Target },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'recurring', label: 'Recurring & Bills', icon: RefreshCw },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
  ];

  const netWorth = accounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/60 backdrop-blur-xl h-screen sticky top-0 px-4 py-5 shrink-0 transition-colors duration-200">
      <div className="space-y-6">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Wallet className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              AuraLedger
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Personal Wealth Suite</p>
          </div>
        </div>

        {/* Mini Net Worth Pill Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Net Worth
          </span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 truncate">
            {formatCurrency(netWorth)}
          </p>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickTransaction}
          className="w-full py-2.5 px-3.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Record Transaction
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer controls: Currency and Theme Switcher */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3.5">
        {/* Currency selector */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">Currency</span>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
          </select>
        </div>

        {/* Theme Switcher in the sidebar */}
        <div className="space-y-1.5 px-0.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 px-1">
            <span>Theme Mode</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-persisted</span>
          </div>
          <ThemeSwitcher variant="segmented" />
        </div>
      </div>
    </aside>
  );
};

export const MobileHeader: React.FC<NavigationProps> = ({
  onSelectTab,
  onOpenQuickTransaction,
}) => {
  const { currency, setCurrency } = useFinance();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
          <Wallet className="w-4 h-4 text-slate-950" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">AuraLedger</h2>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-2 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
        <ThemeSwitcher variant="compact" />
        <button
          onClick={onOpenQuickTransaction}
          className="p-1.5 rounded-lg bg-emerald-500 text-white dark:bg-emerald-400 dark:text-slate-950 font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickTransaction,
}) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'savings', label: 'Goals', icon: PiggyBank },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-colors duration-200">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
