import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  FileText,
  Download,
  Upload,
  RefreshCcw,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  CheckCircle2,
  Database,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ClearDataModal } from './ClearDataModal';
import { DatabaseSetupModal } from './DatabaseSetupModal';

interface ReportsViewProps {
  onOpenDatabaseModal?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenDatabaseModal }) => {
  const {
    transactions,
    categories,
    formatCurrency,
    exportToCSV,
    exportBackupJSON,
    importBackupJSON,
    refreshData,
    currency,
  } = useFinance();

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showClearDataModal, setShowClearDataModal] = useState<boolean>(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState<boolean>(false);

  // 1. Annual Breakdown (All 12 Months of selectedYear from real database records)
  const annualMonthlyData = useMemo(() => {
    const months = [
      { key: '01', name: 'Jan' },
      { key: '02', name: 'Feb' },
      { key: '03', name: 'Mar' },
      { key: '04', name: 'Apr' },
      { key: '05', name: 'May' },
      { key: '06', name: 'Jun' },
      { key: '07', name: 'Jul' },
      { key: '08', name: 'Aug' },
      { key: '09', name: 'Sep' },
      { key: '10', name: 'Oct' },
      { key: '11', name: 'Nov' },
      { key: '12', name: 'Dec' },
    ];

    return months.map(({ key, name }) => {
      const prefix = `${selectedYear}-${key}`;
      const mTx = transactions.filter((t) => t.date.startsWith(prefix));
      const income = mTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expense = mTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const savings = income - expense;

      const rate = income > 0 ? Math.round((savings / income) * 100) : 0;

      return {
        month: name,
        income,
        expense,
        savings,
        rate,
      };
    });
  }, [transactions, selectedYear]);

  // Totals for year
  const totalYearIncome = annualMonthlyData.reduce((s, m) => s + m.income, 0);
  const totalYearExpense = annualMonthlyData.reduce((s, m) => s + m.expense, 0);
  const totalYearSavings = totalYearIncome - totalYearExpense;
  const avgYearSavingsRate = totalYearIncome > 0 ? Math.round((totalYearSavings / totalYearIncome) * 100) : 0;

  // Ranked spending categories all-time
  const rankedCategories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const catId = t.categoryId || 'uncategorized';
        map[catId] = (map[catId] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#94A3B8',
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Financial Reports & Diagnostics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Annual P&L breakdown, savings trajectory, and complete database export tools.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={exportBackupJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Annual Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total {selectedYear} Income</p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalYearIncome)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total {selectedYear} Expenses</p>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalYearExpense)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative Net Savings</p>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(totalYearSavings)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">Average Savings Rate</p>
          <p className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
            {avgYearSavingsRate}%
          </p>
        </div>
      </div>

      {/* Annual Income vs Expense Comparison Bar Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {selectedYear} Monthly Inflow vs Outflow Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bar comparison of monthly earnings and burn</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F8FAFC'
                }}
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val) || 0),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
              />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Spending Categories Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Expenditure Categories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by total historical volume</p>
          </div>

          <div className="space-y-3">
            {rankedCategories.slice(0, 7).map((cat, idx) => {
              const maxSpend = rankedCategories[0]?.amount || 1;
              const pctOfMax = Math.round((cat.amount / maxSpend) * 100);

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] w-4">{idx + 1}.</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{cat.name}</span>
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: cat.color,
                        width: `${pctOfMax}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Management & Storage Management */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Data & Database Management
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Postgres Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your local ledger, wipe mock data, or connect PostgreSQL on your machine.
            </p>
          </div>

          <div className="space-y-3">
            {/* Database & Local Machine Guide Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Database & Machine Setup Guide
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Prisma schema, Neon connection strings, and local terminal commands
                </p>
              </div>
              <button
                onClick={() => (onOpenDatabaseModal ? onOpenDatabaseModal() : setShowDatabaseModal(true))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 transition-colors shadow-xs"
              >
                Setup Guide
              </button>
            </div>

            {/* Wipe Demo & Start Fresh with Real Data */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Start Fresh with Real Data
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  Wipe mock accounts and sample logs to record your own real finances
                </p>
              </div>
              <button
                onClick={() => setShowClearDataModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-xs"
              >
                Wipe Demo
              </button>
            </div>

            {/* Export Full Database */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Export Full Database</p>
                <p className="text-[11px] text-slate-500">Download all accounts, categories, and logs as JSON</p>
              </div>
              <button
                onClick={exportBackupJSON}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Download
              </button>
            </div>

            {/* Restore from File */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Restore from File</p>
                <p className="text-[11px] text-slate-500">Import a previously saved JSON snapshot</p>
              </div>
              <label className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Upload
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Sync / Refresh Database Records */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sync with Database</p>
                <p className="text-[11px] text-slate-500">Re-fetch latest records from PostgreSQL / Neon backend</p>
              </div>
              <button
                onClick={() => refreshData()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 transition-colors"
              >
                Sync Now
              </button>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>All telemetry is stored private & local to this browser session.</span>
          </div>
        </div>
      </div>

      {/* Clear Data Modal */}
      <ClearDataModal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
      />

      {/* Database Setup Guide Modal */}
      <DatabaseSetupModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onOpenClearData={() => setShowClearDataModal(true)}
      />
    </div>
  );
};
