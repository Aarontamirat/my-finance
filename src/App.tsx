import React, { useState, useEffect } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar, MobileHeader, MobileBottomNav } from './components/Navigation';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/DashboardView';
import { AccountsView } from './components/AccountsView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { RecurringView } from './components/RecurringView';
import { ReportsView } from './components/ReportsView';
import { CategoriesView } from './components/CategoriesView';

// Modals
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { AccountModal } from './components/AccountModal';
import { BudgetModal } from './components/BudgetModal';
import { SavingsGoalModal } from './components/SavingsGoalModal';
import { GoalActionModal } from './components/GoalActionModal';
import { RecurringModal } from './components/RecurringModal';
import { DatabaseSetupModal } from './components/DatabaseSetupModal';
import { ClearDataModal } from './components/ClearDataModal';
import { CategoryModal } from './components/CategoryModal';

// Types
import { Transaction, Account, Budget, SavingsGoal, RecurringTransaction, Category } from './types/finance';

function FinanceApp() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultSourceId, setTransferDefaultSourceId] = useState<string | undefined>(undefined);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const [goalAction, setGoalAction] = useState<{
    isOpen: boolean;
    goal: SavingsGoal | null;
    actionType: 'DEPOSIT' | 'WITHDRAW';
  }>({
    isOpen: false,
    goal: null,
    actionType: 'DEPOSIT',
  });

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);

  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Drilldown filter for transactions
  const [transactionsFilterAccount, setTransactionsFilterAccount] = useState<string | null>(null);

  // Global hotkey: 't' to open new transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setSelectedTx(null);
        setIsTxModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenTransactionModal = (tx?: Transaction) => {
    setSelectedTx(tx || null);
    setIsTxModalOpen(true);
  };

  const handleOpenTransferModal = (defaultSourceId?: string) => {
    setTransferDefaultSourceId(defaultSourceId);
    setIsTransferModalOpen(true);
  };

  const handleOpenAccountModal = (account?: Account) => {
    setSelectedAccount(account || null);
    setIsAccountModalOpen(true);
  };

  const handleOpenBudgetModal = (budget?: Budget) => {
    setSelectedBudget(budget || null);
    setIsBudgetModalOpen(true);
  };

  const handleOpenGoalModal = (goal?: SavingsGoal) => {
    setSelectedGoal(goal || null);
    setIsGoalModalOpen(true);
  };

  const handleOpenGoalAction = (goal: SavingsGoal, actionType: 'DEPOSIT' | 'WITHDRAW') => {
    setGoalAction({
      isOpen: true,
      goal,
      actionType,
    });
  };

  const handleOpenRecurringModal = (recurringItem?: RecurringTransaction) => {
    setSelectedRecurring(recurringItem || null);
    setIsRecurringModalOpen(true);
  };

  const handleOpenCategoryModal = (category?: Category) => {
    setSelectedCategory(category || null);
    setIsCategoryModalOpen(true);
  };

  const handleFilterTransactionsByAccount = (accountId: string) => {
    setTransactionsFilterAccount(accountId);
    setCurrentTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500/20 selection:text-emerald-400 transition-colors duration-200">
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'transactions') setTransactionsFilterAccount(null);
          setCurrentTab(tab);
        }}
        onOpenQuickTransaction={() => handleOpenTransactionModal()}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
      />

      {/* Mobile Top Header */}
      <MobileHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickTransaction={() => handleOpenTransactionModal()}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={() => handleOpenTransactionModal()}
            onOpenTransferModal={() => handleOpenTransferModal()}
            onOpenAccountModal={() => handleOpenAccountModal()}
            onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
            onNavigateTab={setCurrentTab}
            onEditTransaction={(tx) => handleOpenTransactionModal(tx)}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            onOpenAccountModal={handleOpenAccountModal}
            onOpenTransferModal={handleOpenTransferModal}
            onFilterTransactionsByAccount={handleFilterTransactionsByAccount}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={handleOpenTransactionModal}
            defaultAccountId={transactionsFilterAccount}
          />
        )}

        {currentTab === 'budgets' && (
          <BudgetsView onOpenBudgetModal={handleOpenBudgetModal} />
        )}

        {currentTab === 'savings' && (
          <SavingsGoalsView
            onOpenGoalModal={handleOpenGoalModal}
            onOpenGoalActionModal={handleOpenGoalAction}
          />
        )}

        {currentTab === 'recurring' && (
          <RecurringView onOpenRecurringModal={handleOpenRecurringModal} />
        )}

        {currentTab === 'categories' && (
          <CategoriesView onOpenCategoryModal={handleOpenCategoryModal} />
        )}

        {currentTab === 'reports' && (
          <ReportsView onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'transactions') setTransactionsFilterAccount(null);
          setCurrentTab(tab);
        }}
        onOpenQuickTransaction={() => handleOpenTransactionModal()}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialTransaction={selectedTx}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceId={transferDefaultSourceId}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        initialAccount={selectedAccount}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        initialBudget={selectedBudget}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={selectedGoal}
      />

      <GoalActionModal
        isOpen={goalAction.isOpen}
        onClose={() => setGoalAction({ ...goalAction, isOpen: false })}
        goal={goalAction.goal}
        actionType={goalAction.actionType}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        initialRecurring={selectedRecurring}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        initialCategory={selectedCategory}
      />

      <DatabaseSetupModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onOpenClearData={() => setIsClearDataModalOpen(true)}
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
      />

      {/* Floating Toasts Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <FinanceApp />
    </FinanceProvider>
  );
}
