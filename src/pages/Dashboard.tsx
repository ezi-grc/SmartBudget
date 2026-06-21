import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { parseISO, getMonth, getYear, format, subMonths } from 'date-fns';
import type { Transaction, Budget, Settings } from '../types';
import { useAssessment } from '../hooks/useAssessment';
import { Card, CardHeader } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { Button } from '../components/UI/Button';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  setActiveTab: (t: any) => void;
  onAddTransactionClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budgets,
  settings,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  setActiveTab,
  onAddTransactionClick
}) => {
  const currency = settings.currency;

  // 1. Calculate General Lifetime Balance
  const lifetimeBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const amt = Number(t.amount);
      return t.transaction_type === 'Income' ? acc + amt : acc - amt;
    }, 0);
  }, [transactions]);

  // 2. Fetch Assessment for current month
  const assessment = useAssessment(transactions, budgets, selectedMonth, selectedYear);

  // 3. Calculate Insights comparing to previous month
  const prevMonthInsights = useMemo(() => {
    const prevDate = subMonths(new Date(selectedYear, selectedMonth - 1, 1), 1);
    const prevM = prevDate.getMonth() + 1;
    const prevY = prevDate.getFullYear();

    let currentExpenses = 0;
    let prevExpenses = 0;

    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const m = getMonth(date) + 1;
      const y = getYear(date);
      const amt = Number(t.amount);

      if (t.transaction_type === 'Expense') {
        if (m === selectedMonth && y === selectedYear) {
          currentExpenses += amt;
        } else if (m === prevM && y === prevY) {
          prevExpenses += amt;
        }
      }
    });

    let spendingDiffPercent = 0;
    if (prevExpenses > 0) {
      spendingDiffPercent = ((currentExpenses - prevExpenses) / prevExpenses) * 100;
    }

    return {
      prevExpenses,
      spendingDiffPercent,
      hasPrevData: prevExpenses > 0,
    };
  }, [transactions, selectedMonth, selectedYear]);

  // 4. Generate Insights
  const quickInsights = useMemo(() => {
    const list: string[] = [];

    // Largest Expense Category Insight
    if (assessment.largestCategory !== 'None' && assessment.largestCategoryAmount > 0) {
      list.push(`${assessment.largestCategory} is your largest expense category this month, consuming ${currency}${assessment.largestCategoryAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${assessment.largestCategoryPercentage.toFixed(0)}% of expenses).`);
    }

    // Savings Rate Insight
    if (assessment.totalIncome > 0) {
      if (assessment.savingsRate > 0) {
        list.push(`You saved ${assessment.savingsRate.toFixed(0)}% of your income this month (${currency}${assessment.netSavings.toLocaleString(undefined, { maximumFractionDigits: 2 })}).`);
      } else {
        list.push(`You spent more than you earned this month by ${currency}${Math.abs(assessment.netSavings).toLocaleString(undefined, { maximumFractionDigits: 2 })} (Overspent by ${Math.abs(assessment.savingsRate).toFixed(0)}%).`);
      }
    }

    // Previous month comparison
    if (prevMonthInsights.hasPrevData) {
      const diff = Math.abs(prevMonthInsights.spendingDiffPercent).toFixed(0);
      if (prevMonthInsights.spendingDiffPercent > 3) {
        list.push(`Your spending increased by ${diff}% compared to last month.`);
      } else if (prevMonthInsights.spendingDiffPercent < -3) {
        list.push(`Excellent! Your spending decreased by ${diff}% compared to last month.`);
      } else {
        list.push(`Your spending is stable, staying within 3% of last month's expenses.`);
      }
    } else {
      list.push('Log transactions regularly to see month-over-month spending comparisons.');
    }

    return list;
  }, [assessment, prevMonthInsights, currency]);

  // 5. Recent Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5);
  }, [transactions]);

  // 6. Chart 1: Expense Breakdown Pie Chart Data
  const pieChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach((t) => {
      const date = parseISO(t.date);
      if (t.transaction_type === 'Expense' && getMonth(date) + 1 === selectedMonth && getYear(date) === selectedYear) {
        const amt = Number(t.amount);
        dataMap[t.category] = (dataMap[t.category] || 0) + amt;
        totalExpense += amt;
      }
    });

    return Object.entries(dataMap).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
    }));
  }, [transactions, selectedMonth, selectedYear]);

  // Chart Colors
  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#a855f7', '#64748b'];

  // Chart 2: Income vs Expense vs Savings Data
  const barChartData = useMemo(() => {
    return [
      {
        name: format(new Date(selectedYear, selectedMonth - 1, 1), 'MMM yyyy'),
        Income: assessment.totalIncome,
        Expenses: assessment.totalExpenses,
        Savings: Math.max(0, assessment.netSavings),
      }
    ];
  }, [assessment, selectedMonth, selectedYear]);

  // Handle Month/Year Change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Health Score Rating Styles
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500 text-emerald-500';
    if (score >= 75) return 'from-indigo-500 to-brand-500 text-brand-500';
    if (score >= 50) return 'from-amber-500 to-yellow-500 text-amber-500';
    return 'from-rose-500 to-red-500 text-rose-500';
  };

  // Month options (last 2 years + next year for setting recurring)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2026, i, 1), 'MMMM')
  }));

  const yearOptions = [2025, 2026, 2027];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Financial Dashboard
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Overview of your local offline financial accounts
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl px-4 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-l border-slate-200 dark:border-slate-800 pl-2 ml-1"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* A. Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Balance (Lifetime) */}
        <Card hoverable className="relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-slate-800 dark:text-white group-hover:scale-110 transition-transform">
            <DollarSign className="w-28 h-28" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Current Balance
          </p>
          <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2 tracking-tight">
            {currency}{lifetimeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Total lifetime savings balance
          </p>
        </Card>

        {/* Card 2: Monthly Income */}
        <Card hoverable className="relative overflow-hidden group border-l-4 border-l-emerald-500">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-emerald-500">
            <TrendingUp className="w-28 h-28" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Monthly Income
          </p>
          <h3 className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
            {currency}{assessment.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Active in current month</span>
          </div>
        </Card>

        {/* Card 3: Monthly Expenses */}
        <Card hoverable className="relative overflow-hidden group border-l-4 border-l-rose-500">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-rose-500">
            <TrendingDown className="w-28 h-28" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Monthly Expenses
          </p>
          <h3 className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
            {currency}{assessment.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Active in current month</span>
          </div>
        </Card>

        {/* Card 4: Net Savings */}
        <Card hoverable className={`relative overflow-hidden group border-l-4 ${assessment.netSavings >= 0 ? 'border-l-indigo-500' : 'border-l-rose-500'}`}>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-indigo-500">
            <TrendingUp className="w-28 h-28" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Net Savings
          </p>
          <h3 className={`text-2xl font-bold font-display mt-2 tracking-tight ${assessment.netSavings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {currency}{assessment.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Savings Rate: <span className="font-semibold">{assessment.savingsRate.toFixed(0)}%</span>
          </p>
        </Card>

        {/* Card 5: Health Score */}
        <Card hoverable onClick={() => setActiveTab('assessment')} className="relative overflow-hidden group border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50/20 dark:from-violet-950/10">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-violet-500">
            <Activity className="w-28 h-28" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Health Score
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold font-display text-gradient-purple tracking-tight">
              {assessment.healthScore}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">/100</span>
          </div>
          <span className={`text-[10px] font-bold block mt-1 tracking-wide ${getScoreColor(assessment.healthScore).split(' ').pop()}`}>
            {assessment.healthCategory}
          </span>
        </Card>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Transactions & Insights */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* C. Quick Insights Card */}
          <Card>
            <CardHeader 
              title="Quick Financial Insights" 
              subtitle="Automatically calculated behavior reports"
              action={
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
              }
            />
            <ul className="space-y-3">
              {quickInsights.map((insight, idx) => (
                <li key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* B. Recent Transactions Card */}
          <Card>
            <CardHeader
              title="Recent Transactions"
              subtitle="Last 5 records entered"
              action={
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setActiveTab('transactions')}
                  leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
                >
                  View All
                </Button>
              }
            />
            
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 dark:text-slate-500">No transactions recorded yet.</p>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="mt-3" 
                  onClick={onAddTransactionClick}
                >
                  Add Your First
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {recentTransactions.map((t) => (
                      <tr key={t.id} className="text-xs text-slate-600 dark:text-slate-300">
                        <td className="py-3.5">{format(parseISO(t.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3.5 font-medium">{t.category}</td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.transaction_type === 'Income' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-semibold ${
                          t.transaction_type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {t.transaction_type === 'Income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Charts & Budget Utilization */}
        <div className="space-y-6">
          
          {/* Chart 1 & Chart 2: Income vs Expense / Expense Breakdown */}
          <Card>
            <CardHeader title="Income vs Expense" subtitle="Comparisons for selected period" />
            {assessment.totalIncome === 0 && assessment.totalExpenses === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No financial activity in this month
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        borderColor: '#334155', 
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px'
                      }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Expense Breakdown" subtitle="Expenses by category" />
            {pieChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No expenses logged in this month
              </div>
            ) : (
              <div className="h-48 flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${currency}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderColor: '#334155', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '11px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="w-1/2 max-h-[160px] overflow-y-auto pl-2 space-y-1.5">
                  {pieChartData.slice(0, 5).map((item, idx) => (
                    <div key={item.name} className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                        />
                        <span className="truncate max-w-[80px]">{item.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 pl-4">
                        {item.percentage.toFixed(0)}% ({currency}{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </span>
                    </div>
                  ))}
                  {pieChartData.length > 5 && (
                    <p className="text-[9px] text-slate-400 pl-4 italic">+{pieChartData.length - 5} more categories</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Budget Utilization Overview */}
          <Card>
            <CardHeader 
              title="Budget Utilization" 
              subtitle="Status of active budget categories"
              action={
                <Button size="sm" variant="text" onClick={() => setActiveTab('budgets')}>
                  Manage
                </Button>
              }
            />
            {assessment.budgetCategoryStatuses.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No category budgets set.
              </div>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {assessment.budgetCategoryStatuses.map((item) => (
                  <div key={item.category} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>{item.category}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium">
                        {currency}{item.spent.toLocaleString()} / {currency}{item.limit.toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar value={item.spent} max={item.limit} showLabel={false} currency={currency} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
