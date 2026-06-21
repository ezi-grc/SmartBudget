import React from 'react';
import { 
  Lightbulb, 
  Calendar,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction, Budget, Settings } from '../types';
import { useAssessment } from '../hooks/useAssessment';
import { Card, CardHeader } from '../components/UI/Card';

interface AssessmentProps {
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
}

export const Assessment: React.FC<AssessmentProps> = ({
  transactions,
  budgets,
  settings,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
}) => {
  const currency = settings.currency;

  // Fetch Assessment details using the assessment hook
  const data = useAssessment(transactions, budgets, selectedMonth, selectedYear);

  // SVG Gauge calculations
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.healthScore / 100) * circumference;

  const scoreBadgeColors = {
    Excellent: 'bg-emerald-500 text-white dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20',
    Good: 'bg-indigo-500 text-white dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/20',
    Fair: 'bg-amber-500 text-white dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20',
    'Needs Improvement': 'bg-rose-500 text-white dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20',
  };

  const scoreThemeColors = {
    Excellent: 'text-emerald-500 stroke-emerald-500 shadow-emerald-500/20',
    Good: 'text-brand-500 stroke-brand-500 shadow-brand-500/20',
    Fair: 'text-amber-500 stroke-amber-500 shadow-amber-500/20',
    'Needs Improvement': 'text-rose-500 stroke-rose-500 shadow-rose-500/20',
  };

  const getSavingsMessageAdvice = (msg: 'Excellent' | 'Good' | 'Moderate' | 'Low') => {
    switch (msg) {
      case 'Excellent': return 'Incredible! You are saving over 30% of your income. You should consider compounding this in assets.';
      case 'Good': return 'Solid performance. You are meeting standard recommended savings benchmarks (15% to 29%).';
      case 'Moderate': return 'Moderate savings rate. Try auditing smaller subscriptions or dining costs to reach a 15% rate.';
      case 'Low': return 'Critical. Your savings rate is low or negative. It is advised to draft a checklist of non-essential costs.';
    }
  };

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
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Financial Assessment
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Habit audit, health indexing, and tailored recommendations
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Score Gauges & Savings Assessment */}
        <div className="space-y-6 lg:col-span-1">
          {/* Health Score Gauge */}
          <Card className="text-center flex flex-col items-center py-8 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <h3 className="text-xs font-bold font-display text-slate-400 uppercase tracking-widest mb-6">Financial Health Score</h3>
            
            {/* SVG Radial Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className={`transition-all duration-1000 ease-out ${scoreThemeColors[data.healthCategory].split(' ')[1]}`}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute text-center">
                <span className="text-4xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                  {data.healthScore}
                </span>
                <span className="text-slate-400 text-xs font-semibold block">/ 100</span>
              </div>
            </div>

            <div className={`mt-6 px-4 py-1 rounded-full text-xs font-bold ${scoreBadgeColors[data.healthCategory]}`}>
              {data.healthCategory}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-4 px-3">
              {data.healthExplanation}
            </p>
          </Card>

          {/* Savings Assessment */}
          <Card>
            <CardHeader title="Savings Audit" subtitle="Analysis of monthly surplus and rate" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-850/40">
                <div>
                  <span className="text-slate-400 font-medium">Income</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{currency}{data.totalIncome.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Expenses</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{currency}{data.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-850/40 pt-2 mt-1">
                  <span className="text-slate-400 font-medium">Net Savings</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{currency}{data.netSavings.toLocaleString()}</p>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-850/40 pt-2 mt-1">
                  <span className="text-slate-400 font-medium">Savings Rate</span>
                  <p className={`text-sm font-bold mt-0.5 ${data.savingsRate >= 15 ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>{data.savingsRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Assessment Message */}
              <div className="border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-2xl space-y-1 bg-white dark:bg-slate-900/60 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Rating:</span>
                  <span className={`font-bold ${
                    data.savingsMessage === 'Excellent' || data.savingsMessage === 'Good' 
                      ? 'text-emerald-500' 
                      : data.savingsMessage === 'Moderate' 
                        ? 'text-amber-500' 
                        : 'text-rose-500'
                  }`}>{data.savingsMessage}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100 dark:border-slate-800/50 mt-1.5">
                  {getSavingsMessageAdvice(data.savingsMessage)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Recommendations & Budget Analysis */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recommendations Card */}
          <Card className="border-l-4 border-l-brand-500">
            <CardHeader 
              title="Personalized Recommendations" 
              subtitle="Actionable, offline steps computed from financial telemetry"
              action={<Lightbulb className="w-5 h-5 text-brand-500 animate-pulse" />}
            />
            <div className="space-y-3">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850/30 p-3.5 rounded-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-350">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Spending Analysis */}
          <Card>
            <CardHeader title="Spending Audit" subtitle="Expense concentration and behavioral details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-850/50 rounded-2xl text-xs space-y-1.5">
                <span className="text-slate-400 font-medium">Largest Spending Category</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{data.largestCategory}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Accounting for <span className="font-bold text-slate-700 dark:text-slate-300">{currency}{data.largestCategoryAmount.toLocaleString()}</span>, which is <span className="font-bold text-brand-500">{data.largestCategoryPercentage.toFixed(0)}%</span> of this month's total expense footprint.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-850/50 rounded-2xl text-xs space-y-1.5">
                <span className="text-slate-400 font-medium">Budget Overrun Risk</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {data.budgetCategoryStatuses.filter((b) => b.status === 'Over Budget').length} Categories Over Budget
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  You have <span className="font-bold text-slate-700 dark:text-slate-300">{data.budgetCategoryStatuses.filter((b) => b.status === 'Near Limit').length} categories</span> currently sitting in the "Near Limit" (70%-99%) warning zone.
                </p>
              </div>
            </div>
          </Card>

          {/* Category-by-Category Budget Assessment */}
          <Card>
            <CardHeader title="Category Budget Audit" subtitle="Evaluations against set target limit margins" />
            {data.budgetCategoryStatuses.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No active budget limits to evaluate. Create category limits inside the Budgets tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.budgetCategoryStatuses.map((item) => {
                  const statusStyles = {
                    'Within Budget': 'bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
                    'Near Limit': 'bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
                    'Over Budget': 'bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
                  };

                  return (
                    <div 
                      key={item.category} 
                      className={`border p-3.5 rounded-2xl flex items-center justify-between text-xs transition-colors hover:shadow-sm ${statusStyles[item.status]}`}
                    >
                      <div>
                        <h4 className="font-bold">{item.category}</h4>
                        <span className="text-[10px] opacity-75 mt-0.5 block">
                          Spent {currency}{item.spent.toLocaleString()} of {currency}{item.limit.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-bold text-[11px] block">{item.percentage.toFixed(0)}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-85 block mt-0.5">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
