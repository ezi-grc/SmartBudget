import React, { useMemo } from 'react';
import { Plus, Trash2, Edit3, ShieldAlert, Award, Calendar } from 'lucide-react';
import { parseISO, getMonth, getYear, format } from 'date-fns';
import type { Budget, Transaction, Settings } from '../types';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { Button } from '../components/UI/Button';

interface BudgetsProps {
  budgets: Budget[];
  transactions: Transaction[];
  settings: Settings;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  onAddBudget: () => void;
  onEditBudget: (b: Budget) => void;
  onDeleteBudget: (id: number) => Promise<any>;
}

export const Budgets: React.FC<BudgetsProps> = ({
  budgets,
  transactions,
  settings,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const currency = settings.currency;

  // Calculate actual spending per category for the selected month/year
  const categorySpending = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    
    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const isCurrentMonth = getMonth(date) + 1 === selectedMonth && getYear(date) === selectedYear;
      
      if (t.transaction_type === 'Expense' && isCurrentMonth) {
        const amt = Number(t.amount);
        spendingMap[t.category] = (spendingMap[t.category] || 0) + amt;
      }
    });

    return spendingMap;
  }, [transactions, selectedMonth, selectedYear]);

  // Aggregate budget details
  const budgetDetails = useMemo(() => {
    return budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const remaining = b.monthly_limit - spent;
      const percentage = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 105 : 0;
      
      let status: 'safe' | 'near-limit' | 'exceeded' = 'safe';
      if (spent >= b.monthly_limit) {
        status = 'exceeded';
      } else if (spent >= b.monthly_limit * 0.7) {
        status = 'near-limit';
      }

      return {
        ...b,
        spent,
        remaining,
        percentage,
        status,
      };
    });
  }, [budgets, categorySpending]);

  // Budget summary
  const summary = useMemo(() => {
    let totalLimits = 0;
    let totalSpent = 0;
    budgetDetails.forEach((b) => {
      totalLimits += b.monthly_limit;
      totalSpent += b.spent;
    });
    
    const remaining = totalLimits - totalSpent;
    const overruns = budgetDetails.filter((b) => b.status === 'exceeded').length;
    const nearLimit = budgetDetails.filter((b) => b.status === 'near-limit').length;

    return {
      totalLimits,
      totalSpent,
      remaining,
      overruns,
      nearLimit,
    };
  }, [budgetDetails]);

  // Month selector options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2026, i, 1), 'MMMM')
  }));
  const yearOptions = [2025, 2026, 2027];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Budget Management
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Define monthly limits on expense categories to control spending
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Calendar Select */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl px-3 py-1.5 shadow-sm text-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer text-xs border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-900">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={onAddBudget} 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Set Category Limit
          </Button>
        </div>
      </div>

      {/* Summary Row */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Limit</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {currency}{summary.totalLimits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </Card>
          
          <Card className="text-center p-4 border-l-4 border-l-brand-500">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Spent</p>
            <h4 className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">
              {currency}{summary.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </Card>

          <Card className="text-center p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Remaining Buffer</p>
            <h4 className={`text-xl font-bold mt-1 ${summary.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.remaining < 0 ? '-' : ''}{currency}{Math.abs(summary.remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </Card>

          <Card className="p-4 flex items-center justify-around">
            <div className="text-center">
              <span className={`text-xl font-bold ${summary.overruns > 0 ? 'text-rose-500 font-extrabold' : 'text-slate-400'}`}>
                {summary.overruns}
              </span>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Over Limits</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <span className={`text-xl font-bold ${summary.nearLimit > 0 ? 'text-amber-500 font-extrabold' : 'text-slate-400'}`}>
                {summary.nearLimit}
              </span>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Near Limit</p>
            </div>
          </Card>
        </div>
      )}

      {/* Budgets List Grid */}
      {budgetDetails.length === 0 ? (
        <Card className="text-center py-16 max-w-xl mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-brand-950/20 text-brand-500 flex items-center justify-center rounded-full">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Category Budgets Set</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Setting limits on categories like Food, Entertainment, or Shopping helps you understand and curtail unwanted spending habits.
            </p>
          </div>
          <Button onClick={onAddBudget} className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
            Create A Category Limit
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgetDetails.map((b) => {
            const isOver = b.spent >= b.monthly_limit;
            return (
              <Card key={b.id} className={`group transition-all ${isOver ? 'border-l-4 border-l-rose-500' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                      {b.category}
                      {isOver && <ShieldAlert className="w-4 h-4 text-rose-500 animate-bounce" />}
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider font-semibold">
                      Monthly category budget
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditBudget(b)}
                      className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                      title="Modify Limit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the budget limit for ${b.category}?`)) {
                          onDeleteBudget(b.id!);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                      title="Remove Limit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <ProgressBar value={b.spent} max={b.monthly_limit} currency={currency} />

                {/* Footnotes stats */}
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-4">
                  <span>
                    Spent: <span className="font-semibold text-slate-700 dark:text-slate-300">{currency}{b.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                  <span>
                    {b.remaining >= 0 ? (
                      <>
                        Remaining: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currency}{b.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : (
                      <>
                        Over Limit: <span className="font-semibold text-rose-600 dark:text-rose-400">{currency}{Math.abs(b.remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
