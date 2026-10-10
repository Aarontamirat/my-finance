import React, { useState } from 'react';
import {
  Database,
  Server,
  Laptop,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  FileCode,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface DatabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClearData: () => void;
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onOpenClearData,
}) => {
  const { showToast } = useFinance();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'local' | 'neon'>('status');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('info', 'Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const envSample = `# 1. Connection pooling URL (for serverless/apps)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# 2. Direct database URL (for migrations and Prisma schema push)
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"`;

  const commandsList = [
    {
      title: '1. Install Dependencies & Prisma CLI',
      cmd: 'npm install\nnpm install -D prisma @prisma/client',
    },
    {
      title: '2. Create your .env file with your Neon or Local Postgres URL',
      cmd: 'cp .env.example .env\n# Edit .env with your actual DATABASE_URL & DIRECT_URL',
    },
    {
      title: '3. Push the Prisma Schema to your PostgreSQL Database',
      cmd: 'npx prisma db push',
    },
    {
      title: '4. Launch Prisma Studio (Visual GUI to inspect & edit DB)',
      cmd: 'npx prisma studio',
    },
    {
      title: '5. Run the Local Development Server',
      cmd: 'npm run dev',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Database & Machine Setup Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How AuraLedger connects to databases and runs on your machine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 my-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'status'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'local'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Run on Your Machine
          </button>
          <button
            onClick={() => setActiveTab('neon')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'neon'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Neon Postgres Setup
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto space-y-4 pr-1 text-slate-700 dark:text-slate-300">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Current App Engine: Browser LocalStorage (Zero Server Dependency)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  This applet operates with an instant, private, offline-capable local storage engine.
                  Every transaction, account, category, and budget is saved in your browser’s persistent storage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    How to use with Real Data right now
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mb-3">
                    You do not need to install anything! Click the button below to wipe the mock demo data. You can keep standard categories or start completely blank.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenClearData();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    Wipe Demo & Start Fresh
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-500" />
                    Prisma Schema Ready
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    The repository includes <code className="text-emerald-600 dark:text-emerald-400 font-mono">prisma/schema.prisma</code> and <code className="text-emerald-600 dark:text-emerald-400 font-mono">.env.example</code> matching all Models: Account, Category, Transaction, Budget, SavingsGoal, and RecurringTransaction.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                  Why isn’t an external database connected by default?
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Connecting to a real PostgreSQL database requires your private database credentials and passwords (<code className="font-mono">DATABASE_URL</code>). Cloud databases should never have passwords committed into public source code. Follow the tabs above to connect your own Neon instance or local Postgres.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                To run AuraLedger on your local computer connected to a real PostgreSQL database:
              </div>

              {commandsList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.cmd, idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Copy command"
                    >
                      {copiedIndex === idx ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto select-all">
                    {item.cmd}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'neon' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  Connecting to Neon (Serverless Postgres)
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Neon provides a free serverless PostgreSQL database with connection pooling that works seamlessly with Prisma.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  1. Get connection strings from Neon Console
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Go to <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center gap-0.5">console.neon.tech <ExternalLink className="w-3 h-3" /></a>, create a free project, and copy your pooled connection string and unpooled connection string into your <code className="font-mono">.env</code>:
                </p>
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                    {envSample}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(envSample, 99)}
                    className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedIndex === 99 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  2. Push the schema to create all tables
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">
                  npx prisma db push
                </pre>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  This creates all tables: <code className="font-mono text-slate-700 dark:text-slate-300">Account</code>, <code className="font-mono text-slate-700 dark:text-slate-300">Transaction</code>, <code className="font-mono text-slate-700 dark:text-slate-300">Category</code>, <code className="font-mono text-slate-700 dark:text-slate-300">Budget</code>, <code className="font-mono text-slate-700 dark:text-slate-300">SavingsGoal</code>, and <code className="font-mono text-slate-700 dark:text-slate-300">RecurringTransaction</code>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  3. Open Prisma Studio GUI
                </p>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">
                  npx prisma studio
                </pre>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Opens http://localhost:5555 where you can view, create, edit, and delete real rows in your PostgreSQL database.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% private & secure data storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
