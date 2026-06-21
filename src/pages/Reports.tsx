import React, { useMemo } from 'react';
import { Calendar, Bookmark } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { parseISO, getMonth, getYear, format, subMonths } from 'date-fns';
import type { Transaction, Budget, Settings, CategoryBreakdown } from '../types';
import { useAssessment } from '../hooks/useAssessment';
import { Card, CardHeader } from '../components/UI/Card';

interface ReportsProps {
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
}

export const Reports: React.FC<ReportsProps> = ({
  transactions,
  budgets,
  settings,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
}) => {
  const currency = settings.currency;

  // Use Assessment hook for core values
  const assessment = useAssessment(transactions, budgets, selectedMonth, selectedYear);

  // 1. Calculate Category Breakdown
  const categoryBreakdownList = useMemo<CategoryBreakdown[]>(() => {
    const dataMap: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const isSelectedMonth = getMonth(date) + 1 === selectedMonth && getYear(date) === selectedYear;
      
      if (t.transaction_type === 'Expense' && isSelectedMonth) {
        const amt = Number(t.amount);
        dataMap[t.category] = (dataMap[t.category] || 0) + amt;
        totalExpense += amt;
      }
    });

    return Object.entries(dataMap)
      .map(([category, amount]) => ({
        category: category as any,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth, selectedYear]);

  // 2. Automated Insights for Reports
  const reportInsights = useMemo(() => {
    const insights: string[] = [];

    // Highest expense category insight
    if (assessment.largestCategory !== 'None' && assessment.largestCategoryAmount > 0) {
      insights.push(`Your highest spending category this month was "${assessment.largestCategory}", consuming ${currency}${assessment.largestCategoryAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`);
    }

    // Expenses consumption ratio
    if (assessment.totalIncome > 0) {
      const ratio = (assessment.totalExpenses / assessment.totalIncome) * 100;
      insights.push(`Your expenses consumed ${ratio.toFixed(0)}% of your total income, leaving a savings rate of ${assessment.savingsRate.toFixed(0)}%.`);
      
      if (ratio > 90) {
        insights.push('Warning: Expenses consumed over 90% of your income. Consider identifying non-essential expenditures.');
      } else if (ratio < 50) {
        insights.push('Excellent! You spent less than half of your income, keeping a strong buffer.');
      }
    } else if (assessment.totalExpenses > 0) {
      insights.push('You recorded expenses but no income this month. Create income streams to balance your cashflow.');
    }

    // Budget performance stats
    if (assessment.budgetCategoryStatuses.length > 0) {
      const totalCount = assessment.budgetCategoryStatuses.length;
      const overCount = assessment.budgetCategoryStatuses.filter((b) => b.status === 'Over Budget').length;
      const compliance = ((totalCount - overCount) / totalCount) * 100;
      insights.push(`Your category budget compliance was ${compliance.toFixed(0)}% (${totalCount - overCount} of ${totalCount} within limits).`);
    } else {
      insights.push('No category budget limits are active. Add limits to monitor category performance.');
    }

    // Calculate month over month comparison
    const prevDate = subMonths(new Date(selectedYear, selectedMonth - 1, 1), 1);
    const prevM = prevDate.getMonth() + 1;
    const prevY = prevDate.getFullYear();

    let prevSavings = 0;
    let prevIncome = 0;
    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const isPrev = getMonth(date) + 1 === prevM && getYear(date) === prevY;
      const amt = Number(t.amount);
      if (isPrev) {
        if (t.transaction_type === 'Income') prevIncome += amt;
        else prevSavings -= amt;
      }
    });
    prevSavings = prevIncome + prevSavings; // income - expenses

    if (prevIncome > 0 || prevSavings !== 0) {
      const diff = assessment.netSavings - prevSavings;
      if (diff > 0) {
        insights.push(`Your monthly net savings improved by ${currency}${diff.toLocaleString(undefined, { maximumFractionDigits: 2 })} compared to last month.`);
      } else if (diff < 0) {
        insights.push(`Your monthly net savings dropped by ${currency}${Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 2 })} compared to last month.`);
      }
    }

    return insights;
  }, [assessment, currency, transactions, selectedMonth, selectedYear]);

  // 3. Calculate 6-month historic chart trend data
  const trendChartData = useMemo(() => {
    const data = [];
    const baseDate = new Date(selectedYear, selectedMonth - 1, 1);

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(baseDate, i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = format(d, 'MMM yy');

      let income = 0;
      let expenses = 0;

      transactions.forEach((t) => {
        const date = parseISO(t.date);
        const tMonth = getMonth(date) + 1;
        const tYear = getYear(date);
        const amt = Number(t.amount);

        if (tMonth === m && tYear === y) {
          if (t.transaction_type === 'Income') {
            income += amt;
          } else {
            expenses += amt;
          }
        }
      });

      const savings = income - expenses;

      data.push({
        monthLabel,
        Income: income,
        Expenses: expenses,
        Savings: savings,
      });
    }

    return data;
  }, [transactions, selectedMonth, selectedYear]);

  // General select options
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
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Monthly Reports
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Automated performance breakdown and long-term trend analysis
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl px-4 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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

      {/* KPI Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Income</p>
          <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {currency}{assessment.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
        </Card>

        <Card className="text-center p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <h4 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {currency}{assessment.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
        </Card>

        <Card className="text-center p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Savings Rate</p>
          <h4 className={`text-xl font-bold mt-1 ${assessment.savingsRate >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {assessment.savingsRate.toFixed(0)}%
          </h4>
        </Card>

        <Card className="text-center p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Transactions Logged</p>
          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {transactions.filter((t) => {
              const date = parseISO(t.date);
              return getMonth(date) + 1 === selectedMonth && getYear(date) === selectedYear;
            }).length}
          </h4>
        </Card>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Category breakdown and automated insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Breakdown Table */}
          <Card>
            <CardHeader 
              title="Category Breakdown" 
              subtitle="Expenses itemized in order of highest expenditure"
            />
            {categoryBreakdownList.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No expense entries to list for this month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-right font-semibold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {categoryBreakdownList.map((item) => (
                      <tr key={item.category} className="text-xs text-slate-600 dark:text-slate-300">
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-100">{item.category}</td>
                        <td className="py-3.5 text-right font-bold text-slate-700 dark:text-slate-200">
                          {currency}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-semibold text-slate-500">{item.percentage.toFixed(0)}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div className="bg-brand-500 h-full" style={{ width: `${item.percentage}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Dynamic Report Insights */}
          <Card>
            <CardHeader title="Report Analysis Insights" subtitle="Behavior observations based on report data" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportInsights.map((insight, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <Bookmark className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Historical trends and graphs */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="6-Month Cashflow Trend" subtitle="Historic monthly totals" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '11px'
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Net Savings Accumulation" subtitle="Monthly savings growth trends" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '11px'
                    }} 
                  />
                  <Area type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
