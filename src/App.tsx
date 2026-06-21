import { useState } from 'react';
import { useData } from './hooks/useData';
import { Navigation } from './components/Navigation';
import type { NavTab } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Assessment } from './pages/Assessment';
import { Settings } from './pages/Settings';

// Modals
import { TransactionForm } from './components/TransactionForm';
import { RecurringForm } from './components/RecurringForm';
import { BudgetForm } from './components/BudgetForm';

// Toasts
import { ToastProvider, useToast } from './components/UI/Toast';

// Core layout component
function AppContent() {
  const { showToast } = useToast();
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Shared date selection
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Database hook
  const {
    transactions, recurringTransactions, budgets, settings,
    addTransaction, updateTransaction, deleteTransaction,
    addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction,
    toggleRecurringActive, saveBudget, deleteBudget, updateSettings,
    exportData, importData, resetAllData,
  } = useData();

  // Modal States
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<any>(null);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<any>(null);

  // --- Actions ---
  const handleOpenAddTransaction = () => { setTransactionToEdit(null); setIsTransactionFormOpen(true); };
  const handleOpenEditTransaction = (t: any) => { setTransactionToEdit(t); setIsTransactionFormOpen(true); };

  const handleSaveTransaction = async (data: any) => {
    try {
      if (transactionToEdit) await updateTransaction(transactionToEdit.id, data);
      else await addTransaction(data);
      showToast('Saved successfully.', 'success');
    } catch (err) { showToast('Error saving.', 'error'); throw err; }
  };

  const handleSaveRecurring = async (data: any) => {
    try {
      if (recurringToEdit) await updateRecurringTransaction(recurringToEdit.id, data);
      else await addRecurringTransaction(data);
      showToast('Schedule updated.', 'success');
    } catch (err) { showToast('Error saving.', 'error'); throw err; }
  };

  const handleSaveBudget = async (category: any, limit: number) => {
    try { await saveBudget(category, limit); showToast('Budget updated.', 'success'); }
    catch (err) { showToast('Error saving.', 'error'); throw err; }
  };

  // Rendering active page content
  const renderPage = () => {
    const props = { transactions, budgets, settings, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...props} setActiveTab={setActiveTab} onAddTransactionClick={handleOpenAddTransaction} />;
      case 'transactions':
        return <Transactions {...props} recurringTransactions={recurringTransactions} onAddTransaction={handleOpenAddTransaction} onEditTransaction={handleOpenEditTransaction} onDeleteTransaction={deleteTransaction} onAddRecurring={() => setIsRecurringFormOpen(true)} onEditRecurring={(rt) => {setRecurringToEdit(rt); setIsRecurringFormOpen(true);}} onDeleteRecurring={deleteRecurringTransaction} onToggleRecurring={toggleRecurringActive} />;
      case 'budgets':
        return <Budgets {...props} onAddBudget={() => setIsBudgetFormOpen(true)} onEditBudget={(b) => {setBudgetToEdit(b); setIsBudgetFormOpen(true);}} onDeleteBudget={deleteBudget} />;
      case 'reports':
        return <Reports {...props} />;
      case 'assessment':
        return <Assessment {...props} />;
      case 'settings':
        return <Settings settings={settings} updateSettings={updateSettings} exportData={exportData} importData={importData} resetAllData={resetAllData} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    /* Noir Background: using slate-900 (defined as #050505 in config) and white for light mode */
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar / Bottom Nav */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {/* Main Panel */}
      <div className="flex-grow md:pl-64 w-full">
        <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>

      {/* Modals */}
      <TransactionForm isOpen={isTransactionFormOpen} onClose={() => setIsTransactionFormOpen(false)} onSave={handleSaveTransaction} transactionToEdit={transactionToEdit} currency={settings.currency} />
      <RecurringForm isOpen={isRecurringFormOpen} onClose={() => setIsRecurringFormOpen(false)} onSave={handleSaveRecurring} recurringToEdit={recurringToEdit} currency={settings.currency} />
      <BudgetForm isOpen={isBudgetFormOpen} onClose={() => setIsBudgetFormOpen(false)} onSave={handleSaveBudget} budgetToEdit={budgetToEdit} existingBudgetCategories={budgets.map((b) => b.category)} currency={settings.currency} />

    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;