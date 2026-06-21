import { useMemo } from 'react';
import type { Transaction, Budget, ExpenseCategory } from '../types';
import { parseISO, getMonth, getYear } from 'date-fns';

export interface AssessmentResult {
  healthScore: number;
  healthCategory: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
  healthExplanation: string;
  
  // Section B: Spending Analysis
  largestCategory: string;
  largestCategoryAmount: number;
  largestCategoryPercentage: number;
  totalExpenses: number;
  
  // Section C: Savings Assessment
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  savingsMessage: 'Excellent' | 'Good' | 'Moderate' | 'Low';
  
  // Section D: Budget Assessment
  budgetCategoryStatuses: Array<{
    category: ExpenseCategory;
    limit: number;
    spent: number;
    percentage: number;
    status: 'Within Budget' | 'Near Limit' | 'Over Budget';
  }>;
  
  // Section E: Personalized Recommendations
  recommendations: string[];
}

export function useAssessment(
  transactions: Transaction[],
  budgets: Budget[],
  selectedMonth: number, // 1-12
  selectedYear: number
) {
  return useMemo(() => {
    // Filter transactions for the selected month/year
    const monthlyTransactions = transactions.filter((t) => {
      const date = parseISO(t.date);
      return getMonth(date) + 1 === selectedMonth && getYear(date) === selectedYear;
    });

    // Historic transactions up to the end of the selected month/year (to calculate balance)
    const historicTransactions = transactions.filter((t) => {
      const date = parseISO(t.date);
      const year = getYear(date);
      const month = getMonth(date) + 1;
      return year < selectedYear || (year === selectedYear && month <= selectedMonth);
    });

    // 1. Calculate general numbers
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    monthlyTransactions.forEach((t) => {
      const amount = Number(t.amount);
      if (t.transaction_type === 'Income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Historic balance
    let historicBalance = 0;
    historicTransactions.forEach((t) => {
      const amount = Number(t.amount);
      if (t.transaction_type === 'Income') {
        historicBalance += amount;
      } else {
        historicBalance -= amount;
      }
    });

    // 2. Section B: Spending analysis
    let largestCategory = 'None';
    let largestCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > largestCategoryAmount) {
        largestCategory = category;
        largestCategoryAmount = amount;
      }
    });
    const largestCategoryPercentage = totalExpenses > 0 ? (largestCategoryAmount / totalExpenses) * 100 : 0;

    // 3. Section C: Savings Message
    let savingsMessage: 'Excellent' | 'Good' | 'Moderate' | 'Low' = 'Low';
    if (savingsRate >= 30) {
      savingsMessage = 'Excellent';
    } else if (savingsRate >= 15) {
      savingsMessage = 'Good';
    } else if (savingsRate >= 5) {
      savingsMessage = 'Moderate';
    }

    // 4. Section D: Budget Assessment
    const budgetCategoryStatuses = budgets.map((b) => {
      const spent = categoryTotals[b.category] || 0;
      const percentage = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
      
      let status: 'Within Budget' | 'Near Limit' | 'Over Budget' = 'Within Budget';
      if (percentage >= 100) {
        status = 'Over Budget';
      } else if (percentage >= 70) {
        status = 'Near Limit';
      }

      return {
        category: b.category,
        limit: b.monthly_limit,
        spent,
        percentage,
        status,
      };
    });

    // 5. Calculate Health Score (0 - 100)
    // Factor 1: Savings Rate (Max 25 pts)
    let scoreSavingsRate = 0;
    if (savingsRate >= 20) {
      scoreSavingsRate = 25;
    } else if (savingsRate > 0) {
      scoreSavingsRate = (savingsRate / 20) * 25;
    }

    // Factor 2: Budget Compliance (Max 25 pts)
    let scoreBudgetCompliance = 25;
    if (budgetCategoryStatuses.length > 0) {
      const withinBudgetCount = budgetCategoryStatuses.filter(
        (b) => b.status === 'Within Budget' || b.status === 'Near Limit'
      ).length;
      scoreBudgetCompliance = (withinBudgetCount / budgetCategoryStatuses.length) * 25;
    }

    // Factor 3: Overspending (Max 20 pts)
    let scoreOverspending = 20;
    if (totalExpenses > totalIncome) {
      if (totalIncome > 0) {
        const overspentRatio = (totalExpenses - totalIncome) / totalIncome;
        scoreOverspending = Math.max(0, 20 - overspentRatio * 40);
      } else {
        scoreOverspending = 0;
      }
    }

    // Factor 4: Expense Distribution (Max 15 pts)
    // Penalty if any category except Rent/Savings is consuming more than 40% of total expenses
    let scoreDistribution = 15;
    const problematicCategories = Object.entries(categoryTotals).filter(
      ([cat, amt]) => cat !== 'Rent' && cat !== 'Savings' && totalExpenses > 0 && (amt / totalExpenses) > 0.4
    );
    if (problematicCategories.length > 0) {
      scoreDistribution = 5; // Penalty
    }

    // Factor 5: Positive Balance (Max 15 pts)
    const scorePositiveBalance = historicBalance > 0 ? 15 : 0;

    const healthScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          scoreSavingsRate +
          scoreBudgetCompliance +
          scoreOverspending +
          scoreDistribution +
          scorePositiveBalance
        )
      )
    );

    let healthCategory: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' = 'Needs Improvement';
    let healthExplanation = '';

    if (healthScore >= 90) {
      healthCategory = 'Excellent';
      healthExplanation = 'You have exceptional financial health! You maintain a strong savings rate, control your category budgets, and avoid overspending.';
    } else if (healthScore >= 75) {
      healthCategory = 'Good';
      healthExplanation = 'Your financial health is solid. You are saving regularly and keeping most of your expenses under control, but there is small room to optimize.';
    } else if (healthScore >= 50) {
      healthCategory = 'Fair';
      healthExplanation = 'Your budget is a bit tight. You might be struggling to save at a high rate or frequently approaching category limits. Try reviewing discretionary expenses.';
    } else {
      healthCategory = 'Needs Improvement';
      healthExplanation = 'Your expenses exceed your income, or you have high budget overruns. You are at risk of depleting your savings. Immediate budgeting action is highly recommended.';
    }

    // 6. Section E: Personalized Recommendations
    const recommendations: string[] = [];

    if (totalIncome === 0 && totalExpenses > 0) {
      recommendations.push('Add your sources of income to accurately assess your budget and savings potential.');
    }

    if (savingsRate < 10 && totalIncome > 0) {
      recommendations.push(
        `Your savings rate is currently ${savingsRate.toFixed(1)}%. Aim to save at least 15% to 20% of your income. Consider setting up automatic savings.`
      );
    }

    // Specific category alerts
    if (categoryTotals['Food'] && totalIncome > 0 && (categoryTotals['Food'] / totalIncome) > 0.25) {
      recommendations.push(
        `Food costs represent ${( (categoryTotals['Food'] / totalIncome) * 100 ).toFixed(0)}% of your income. Consider meal prepping or reducing dining out to save.`
      );
    }

    if (categoryTotals['Rent'] && totalIncome > 0 && (categoryTotals['Rent'] / totalIncome) > 0.35) {
      recommendations.push(
        `Housing expenses consume ${( (categoryTotals['Rent'] / totalIncome) * 100 ).toFixed(0)}% of your income, which is above the recommended 30%. Be conservative with other spending.`
      );
    }

    if (categoryTotals['Entertainment'] && totalIncome > 0 && (categoryTotals['Entertainment'] / totalIncome) > 0.15) {
      recommendations.push(
        'Entertainment spending is high relative to your income. Trimming subscription plans or low-cost activities could save you money.'
      );
    }

    if (categoryTotals['Shopping'] && totalIncome > 0 && (categoryTotals['Shopping'] / totalIncome) > 0.15) {
      recommendations.push(
        'Shopping is consuming a notable portion of your budget. Try implementing a 48-hour rule for non-essential purchases.'
      );
    }

    // Budget overruns
    const overBudget = budgetCategoryStatuses.filter((b) => b.status === 'Over Budget');
    if (overBudget.length > 0) {
      overBudget.forEach((b) => {
        recommendations.push(
          `You exceeded your budget limit for "${b.category}" by ${Math.round(b.percentage - 100)}%. Reduce spending in this category next month.`
        );
      });
    }

    const nearBudget = budgetCategoryStatuses.filter((b) => b.status === 'Near Limit');
    if (nearBudget.length > 0) {
      recommendations.push(
        `You are approaching limits for: ${nearBudget.map((b) => b.category).join(', ')}. Keep an eye on transactions here.`
      );
    }

    // General praise
    if (healthScore >= 90) {
      recommendations.push(
        'Excellent discipline! Maintain your current habits. Look into investing a portion of your net savings to outpace inflation.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Your financial indicators look stable. Keep logging transactions daily to build historical trends!');
    }

    return {
      healthScore,
      healthCategory,
      healthExplanation,
      largestCategory,
      largestCategoryAmount,
      largestCategoryPercentage,
      totalExpenses,
      totalIncome,
      netSavings,
      savingsRate,
      savingsMessage,
      budgetCategoryStatuses,
      recommendations,
    };
  }, [transactions, budgets, selectedMonth, selectedYear]);
}
