import React, { useEffect, useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category, CategoryType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: Category | null;
}

const ICONS = ['Tag', 'Home', 'ShoppingCart', 'Utensils', 'Zap', 'Car', 'HeartPulse', 'Film', 'Plane', 'Briefcase', 'Laptop', 'TrendingUp', 'Gift'];
const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, initialCategory }) => {
  const { addCategory, updateCategory } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialCategory?.name || '');
    setType(initialCategory?.type || 'EXPENSE');
    setIcon(initialCategory?.icon || 'Tag');
    setColor(initialCategory?.color || COLORS[0]);
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const data = { name: trimmedName, type, icon, color };
    if (initialCategory) await updateCategory(initialCategory.id, data);
    else await addCategory(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500"><Tag className="h-4 w-4" /></div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{initialCategory ? 'Edit Category' : 'New Category'}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Category name</label>
            <input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Groceries" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['EXPENSE', 'INCOME'] as CategoryType[]).map((option) => (
                <button key={option} type="button" onClick={() => setType(option)} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${type === option ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                  {option === 'EXPENSE' ? 'Expense' : 'Income'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Icon</label>
            <div className="grid grid-cols-7 gap-2">
              {ICONS.map((option) => <button key={option} type="button" title={option} onClick={() => setIcon(option)} className={`flex aspect-square items-center justify-center rounded-lg border transition-colors ${icon === option ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}><CategoryIcon name={option} color={color} className="h-4 w-4" /></button>)}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => <button key={option} type="button" aria-label={`Use ${option}`} onClick={() => setColor(option)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${color === option ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`} style={{ backgroundColor: option }}>{color === option && <Check className="h-4 w-4 text-white" />}</button>)}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400 dark:text-slate-950">{initialCategory ? 'Save Changes' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
