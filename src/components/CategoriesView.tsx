import React from 'react';
import { Edit3, Plus, Tags, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface CategoriesViewProps {
  onOpenCategoryModal: (category?: Category) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onOpenCategoryModal }) => {
  const { categories, transactions, budgets, recurring, deleteCategory } = useFinance();
  const groups: Array<{ type: Category['type']; title: string; description: string }> = [
    { type: 'EXPENSE', title: 'Expense categories', description: 'Used to classify spending, budgets, and recurring bills.' },
    { type: 'INCOME', title: 'Income categories', description: 'Used to classify salary and other incoming money.' },
  ];

  const handleDelete = async (category: Category) => {
    const usage = transactions.filter((item) => item.categoryId === category.id).length + budgets.filter((item) => item.categoryId === category.id).length + recurring.filter((item) => item.categoryId === category.id).length;
    const warning = usage ? ` This will unlink it from ${usage} existing record${usage === 1 ? '' : 's'} (and remove associated budgets).` : '';
    if (window.confirm(`Delete “${category.name}”?${warning}`)) await deleteCategory(category.id);
  };

  return (
    <section className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Tags className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">Classification</span></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Categories</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the categories saved in your database for transactions, budgets, and recurring payments.</p>
        </div>
        <button onClick={() => onOpenCategoryModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400 dark:text-slate-950"><Plus className="h-4 w-4" />Add Category</button>
      </div>

      {groups.map(({ type, title, description }) => {
        const items = categories.filter((category) => category.type === type);
        return <div key={type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
          {items.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((category) => {
            const transactionCount = transactions.filter((item) => item.categoryId === category.id).length;
            return <div key={category.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${category.color}20` }}><CategoryIcon name={category.icon} color={category.color} className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{category.name}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{transactionCount} transaction{transactionCount === 1 ? '' : 's'}</p></div>
              <button onClick={() => onOpenCategoryModal(category)} aria-label={`Edit ${category.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"><Edit3 className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(category)} aria-label={`Delete ${category.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
            </div>;
          })}</div> : <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No {type.toLowerCase()} categories yet. Add one to get started.</div>}
        </div>;
      })}
    </section>
  );
};
