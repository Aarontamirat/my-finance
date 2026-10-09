import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'compact' | 'toggle';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'segmented',
  className = '',
}) => {
  const { theme, setTheme, toggleTheme } = useFinance();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Current: ${theme === 'dark' ? 'Dark' : 'Light'} mode (click to toggle)`}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border
          bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200
          dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-300 dark:border-slate-800
          focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${className}`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </button>
    );
  }

  if (variant === 'toggle') {
    const isDark = theme === 'dark';
    return (
      <button
        type="button"
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme mode"
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          ${isDark ? 'bg-slate-800' : 'bg-emerald-500'} ${className}`}
      >
        <span
          className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
            ${isDark ? 'translate-x-5 text-slate-900' : 'translate-x-0 text-amber-500'}`}
        >
          {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
        </span>
      </button>
    );
  }

  // Segmented control (default, best for sidebar integration)
  return (
    <div
      className={`w-full p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-1 transition-colors duration-200 ${className}`}
      role="radiogroup"
      aria-label="Theme preference switcher"
    >
      {/* Light Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none
          ${
            theme === 'light'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
      >
        <Sun
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            theme === 'light' ? 'text-amber-500 scale-110' : 'text-slate-400'
          }`}
        />
        <span>Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none
          ${
            theme === 'dark'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
      >
        <Moon
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            theme === 'dark' ? 'text-emerald-400 scale-110' : 'text-slate-400'
          }`}
        />
        <span>Dark</span>
      </button>
    </div>
  );
};
