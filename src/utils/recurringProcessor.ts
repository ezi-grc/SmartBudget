import { parseISO, format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay } from 'date-fns';
import type { RecurringTransaction, Transaction } from '../types';


/**
 * Calculates any transactions that are due to be created for a recurring transaction.
 * Returns the list of new transactions and the new lastProcessedDate string if any are due.
 */
export function calculateDueTransactions(
  recurring: RecurringTransaction,
  today: Date = new Date()
): { newTransactions: Transaction[]; lastProcessedDate: string } | null {
  if (!recurring.is_active) return null;

  // We operate on YYYY-MM-DD strings to ensure timezone independence
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayParsed = parseISO(todayStr);
  const startDate = parseISO(recurring.start_date);
  const endDate = recurring.end_date ? parseISO(recurring.end_date) : null;

  // If the schedule hasn't started yet, do nothing
  if (isAfter(startDate, todayParsed)) {
    return null;
  }

  const occurrences: string[] = [];
  
  // Helper to advance date by interval
  const getNextOccurrence = (date: Date, freq: string): Date => {
    switch (freq) {
      case 'Daily':
        return addDays(date, 1);
      case 'Weekly':
        return addWeeks(date, 1);
      case 'Monthly':
        return addMonths(date, 1);
      case 'Yearly':
        return addYears(date, 1);
      default:
        return addDays(date, 1);
    }
  };

  if (recurring.last_processed_date) {
    // Calculate from the next occurrence after last_processed_date
    let next = getNextOccurrence(parseISO(recurring.last_processed_date), recurring.frequency);
    
    while (
      (isBefore(next, todayParsed) || isSameDay(next, todayParsed)) &&
      (!endDate || isBefore(next, endDate) || isSameDay(next, endDate))
    ) {
      occurrences.push(format(next, 'yyyy-MM-dd'));
      next = getNextOccurrence(next, recurring.frequency);
    }
  } else {
    // If it has never been processed, we start from the start_date
    let current = startDate;
    
    while (
      (isBefore(current, todayParsed) || isSameDay(current, todayParsed)) &&
      (!endDate || isBefore(current, endDate) || isSameDay(current, endDate))
    ) {
      occurrences.push(format(current, 'yyyy-MM-dd'));
      current = getNextOccurrence(current, recurring.frequency);
    }
  }

  if (occurrences.length === 0) {
    return null;
  }

  const newTransactions: Transaction[] = occurrences.map((dateStr) => ({
    amount: recurring.amount,
    transaction_type: recurring.transaction_type,
    category: recurring.category,
    note: `Auto-generated: ${recurring.name}`,
    date: dateStr,
    created_at: new Date(),
  }));

  const lastProcessedDate = occurrences[occurrences.length - 1];

  return { newTransactions, lastProcessedDate };
}
