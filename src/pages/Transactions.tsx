import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  Play, 
  Pause, 
  Calendar,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { parseISO, format } from 'date-fns';
import type { Transaction, RecurringTransaction, Settings, TransactionType } from '../types';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

interface TransactionsProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  settings: Settings;
  onAddTransaction: () => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: number) => Promise<any>;
  onAddRecurring: () => void;
  onEditRecurring: (rt: RecurringTransaction) => void;
  onDeleteRecurring: (id: number) => Promise<any>;
  onToggleRecurring: (id: number, active: boolean) => Promise<any>;
}

const INCOME_CATEGORIES = ['Salary', 'Allowance', 'Freelance', 'Business', 'Scholarship', 'Gift', 'Investment', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Utilities', 'Education', 'Entertainment', 'Shopping', 'Healthcare', 'Savings', 'Subscriptions', 'Tithe', 'Other'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  recurringTransactions,
  settings,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onToggleRecurring,
}) => {
  const currency = settings.currency;
  
  // Tab Management
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'recurring'>('history');

  // Filter States (History Tab)
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search note, category, or amount
        const matchesSearch =
          t.note.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase()) ||
          t.amount.toString().includes(search);
        
        const matchesType = filterType === 'All' || t.transaction_type === filterType;
        
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;

        const matchesDateFrom = !filterDateFrom || new Date(t.date) >= new Date(filterDateFrom);
        const matchesDateTo = !filterDateTo || new Date(t.date) <= new Date(filterDateTo);

        return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, search, filterType, filterCategory, filterDateFrom, filterDateTo, sortBy]);

  // Total sums for filtered records
  const sums = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount);
      if (t.transaction_type === 'Income') income += amt;
      else expenses += amt;
    });
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterType('All');
    setFilterCategory('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSortBy('date-desc');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Transaction Ledger
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Log, plan, and filter your financial cashflow records
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeSubTab === 'history' ? (
            <Button 
              onClick={onAddTransaction} 
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Transaction
            </Button>
          ) : (
            <Button 
              onClick={onAddRecurring} 
              variant="success" 
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Recurring Rule
            </Button>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200/40 dark:border-slate-800/40 gap-4">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 font-display font-bold text-sm transition-colors border-b-2 px-1 ${
            activeSubTab === 'history'
              ? 'text-brand-500 border-brand-500'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Transaction History ({transactions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('recurring')}
          className={`pb-3 font-display font-bold text-sm transition-colors border-b-2 px-1 ${
            activeSubTab === 'recurring'
              ? 'text-brand-500 border-brand-500'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Recurring Schedules ({recurringTransactions.length})
        </button>
      </div>

      {/* TAB 1: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          {/* Quick Stat Bar */}
          <div className="grid grid-cols-3 gap-4 bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200/30 dark:border-slate-800/30 p-4 rounded-2xl text-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Income</p>
              <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                +{currency}{sums.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="border-x border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Expenses</p>
              <h4 className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
                -{currency}{sums.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Net Cashflow</p>
              <h4 className={`text-base font-bold mt-1 ${sums.net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {sums.net >= 0 ? '+' : ''}{currency}{sums.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Search and Filters panel */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search notes, category, amount..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Sorting */}
              <div className="flex gap-2">
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="date-desc">Newest Date</option>
                    <option value="date-asc">Oldest Date</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                  </select>
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                  className={showAdvancedFilters ? 'bg-brand-50 border-brand-500 text-brand-600 dark:bg-brand-950/20' : ''}
                >
                  Filters
                </Button>

                {(search || filterType !== 'All' || filterCategory !== 'All' || filterDateFrom || filterDateTo) && (
                  <Button variant="text" size="sm" onClick={handleResetFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters Expandable Dropdown */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                {/* Filter Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Expense">Expenses</option>
                    <option value="Income">Income</option>
                  </select>
                </div>

                {/* Filter Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Date From */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Filter Date To */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Transactions Table History Card */}
          <Card>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No transactions match your search/filter parameters.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Notes</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-center font-semibold w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3">{format(parseISO(t.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3 font-medium flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {t.category}
                        </td>
                        <td className="py-3 truncate max-w-[150px] md:max-w-xs" title={t.note}>
                          {t.note || <span className="text-slate-300 dark:text-slate-600 italic">No notes</span>}
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                            t.transaction_type === 'Income' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-bold ${
                          t.transaction_type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {t.transaction_type === 'Income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => onEditTransaction(t)}
                              className="text-slate-400 hover:text-brand-500 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-850"
                              title="Edit transaction"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this transaction?')) {
                                  onDeleteTransaction(t.id!);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-850"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: RECURRING RULES */}
      {activeSubTab === 'recurring' && (
        <div className="space-y-4">
          <Card>
            {recurringTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No recurring transaction rules defined yet.</p>
                <p className="text-xs text-slate-400 mt-1">Schedules automatically create transaction records when the date matches your rules.</p>
                <Button variant="success" size="sm" className="mt-4" onClick={onAddRecurring}>
                  Create Your First Rule
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Name</th>
                      <th className="pb-3 font-semibold">Frequency</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Date Range</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-center font-semibold w-24">Status</th>
                      <th className="pb-3 text-center font-semibold w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {recurringTransactions.map((rt) => (
                      <tr key={rt.id} className="text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">{rt.name}</td>
                        <td className="py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">{rt.frequency}</span>
                        </td>
                        <td className="py-3.5 font-medium">{rt.category}</td>
                        <td className="py-3.5 text-slate-400 dark:text-slate-500 text-[10px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(rt.start_date), 'MMM dd, yyyy')} {rt.end_date ? `to ${format(parseISO(rt.end_date), 'MMM dd, yyyy')}` : '(no end)'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                            rt.transaction_type === 'Income' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {rt.transaction_type}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-bold ${
                          rt.transaction_type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {rt.transaction_type === 'Income' ? '+' : '-'}{currency}{rt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => onToggleRecurring(rt.id!, !rt.is_active)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              rt.is_active
                                ? 'bg-emerald-100/50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-850 dark:text-slate-400'
                            }`}
                          >
                            {rt.is_active ? (
                              <>
                                <Pause className="w-3 h-3 fill-current" /> Active
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" /> Paused
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => onEditRecurring(rt)}
                              className="text-slate-400 hover:text-brand-500 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-850"
                              title="Edit schedule"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this recurring schedule? This stops future transactions but will not delete previously generated records.')) {
                                  onDeleteRecurring(rt.id!);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-850"
                              title="Delete schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
