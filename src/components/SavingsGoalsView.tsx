import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/finance';
import {
  PiggyBank,
  Plus,
  ArrowDown,
  ArrowUp,
  Calendar,
  Pencil,
  Trash2,
  Sparkles,
  Trophy,
  AlertCircle
} from 'lucide-react';

interface SavingsGoalsViewProps {
  onOpenGoalModal: (goal?: SavingsGoal) => void;
  onOpenGoalActionModal: (goal: SavingsGoal, actionType: 'DEPOSIT' | 'WITHDRAW') => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  onOpenGoalModal,
  onOpenGoalActionModal,
}) => {
  const { savingsGoals, deleteSavingsGoal, formatCurrency } = useFinance();
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Savings Goals & Vaults
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emergency funds, vacation reserves, long-term investments, and asset targets.
          </p>
        </div>

        <button
          onClick={() => onOpenGoalModal()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300 text-white dark:text-slate-950 transition-all shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create New Goal
        </button>
      </div>

      {/* Aggregate Vault Statistics */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Capital Saved</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalSaved)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aggregate Target Goal</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-200 mt-1">
              {formatCurrency(totalTarget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall Milestone</p>
            <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-2">
              {overallProgress}% Funded
              {overallProgress >= 100 && <Trophy className="w-5 h-5 text-amber-500" />}
            </p>
          </div>
        </div>

        {/* Global Progress */}
        <div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const isCompleted = percent >= 100;

          const targetDateObj = new Date(goal.targetDate);
          const diffDays = Math.ceil(
            (targetDateObj.getTime() - new Date('2026-10-09').getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={goal.id}
              className={`rounded-2xl bg-white dark:bg-slate-900/90 border p-5 shadow-xs relative flex flex-col justify-between group transition-all ${
                isCompleted
                  ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header & Controls */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                    >
                      {isCompleted ? <Trophy className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{goal.name}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Target: {goal.targetDate.split('T')[0]} ({diffDays > 0 ? `${diffDays}d left` : 'Due'})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenGoalModal(goal)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setGoalToDelete(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="space-y-2 my-4">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                      Target: {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: goal.color,
                        width: `${percent}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {isCompleted ? (
                        <strong className="text-emerald-600 dark:text-emerald-400">🎉 Fully Funded!</strong>
                      ) : (
                        `${formatCurrency(remaining)} remaining`
                      )}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{percent}%</span>
                  </div>
                </div>
              </div>

              {/* Deposit & Withdraw Quick Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => onOpenGoalActionModal(goal, 'DEPOSIT')}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors border border-emerald-200/50 dark:border-emerald-500/30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Deposit
                </button>
                <button
                  onClick={() => onOpenGoalActionModal(goal, 'WITHDRAW')}
                  disabled={goal.currentAmount <= 0}
                  className="py-1.5 px-3 text-xs font-medium rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-800"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Withdraw
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Delete Goal?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove this savings goal? Any saved funds should be withdrawn first if desired.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGoalToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSavingsGoal(goalToDelete);
                  setGoalToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
