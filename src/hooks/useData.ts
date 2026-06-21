import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Transaction, RecurringTransaction, Settings } from '../types';
import { calculateDueTransactions } from '../utils/recurringProcessor';

export function useData() {
  // Query all data reactively
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const recurringTransactions = useLiveQuery(() => db.recurring_transactions.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray()) || [];

  const currentSettings: Settings = settingsList[0] || { currency: '$', dark_mode: false };

  // Trigger processing of recurring transactions on startup/data changes
  useEffect(() => {
    const processRecurring = async () => {
      const activeRules = await db.recurring_transactions.where('is_active').equals(1).toArray();
      if (activeRules.length === 0) return;

      const today = new Date();

      // Run database operations inside a write transaction
      try {
        await db.transaction('rw', [db.transactions, db.recurring_transactions], async () => {
          for (const rule of activeRules) {
            const result = calculateDueTransactions(rule, today);
            if (result && result.newTransactions.length > 0) {
              // Insert all new transactions
              await db.transactions.bulkAdd(result.newTransactions);
              // Update rule's last processed date
              await db.recurring_transactions.update(rule.id!, {
                last_processed_date: result.lastProcessedDate,
              });
            }
          }
        });
      } catch (err) {
        console.error('Failed to process recurring transactions:', err);
      }
    };

    if (recurringTransactions.length > 0) {
      processRecurring();
    }
  }, [recurringTransactions.length]);

  // Sync dark mode class with settings change
  useEffect(() => {
    if (currentSettings.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentSettings.dark_mode]);

  // --- Transactions ---
  const addTransaction = async (t: Omit<Transaction, 'created_at'>) => {
    return await db.transactions.add({
      ...t,
      created_at: new Date(),
    });
  };

  const updateTransaction = async (id: number, t: Partial<Transaction>) => {
    return await db.transactions.update(id, t);
  };

  const deleteTransaction = async (id: number) => {
    return await db.transactions.delete(id);
  };

  // --- Recurring Transactions ---
  const addRecurringTransaction = async (rt: Omit<RecurringTransaction, 'is_active'>) => {
    return await db.recurring_transactions.add({
      ...rt,
      is_active: true,
    });
  };

  const updateRecurringTransaction = async (id: number, rt: Partial<RecurringTransaction>) => {
    return await db.recurring_transactions.update(id, rt);
  };

  const deleteRecurringTransaction = async (id: number) => {
    return await db.recurring_transactions.delete(id);
  };

  const toggleRecurringActive = async (id: number, active: boolean) => {
    return await db.recurring_transactions.update(id, { is_active: active });
  };

  // --- Budgets ---
  const saveBudget = async (category: any, monthlyLimit: number) => {
    const existing = await db.budgets.where('category').equals(category).first();
    if (existing) {
      return await db.budgets.update(existing.id!, { monthly_limit: monthlyLimit });
    } else {
      return await db.budgets.add({ category, monthly_limit: monthlyLimit });
    }
  };

  const deleteBudget = async (id: number) => {
    return await db.budgets.delete(id);
  };

  // --- Settings ---
  const updateSettings = async (updates: Partial<Settings>) => {
    const first = await db.settings.toCollection().first();
    if (first) {
      return await db.settings.update(first.id!, updates);
    } else {
      return await db.settings.add({
        currency: '$',
        dark_mode: false,
        ...updates,
      });
    }
  };

  // --- Data Management (Export, Import, Reset) ---
  const exportData = async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      recurring_transactions: await db.recurring_transactions.toArray(),
      budgets: await db.budgets.toArray(),
      settings: await db.settings.toArray(),
      monthly_snapshots: await db.monthly_snapshots.toArray(),
      export_version: 1,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);

      // Validate structure basics
      if (!parsed.transactions || !parsed.budgets || !parsed.settings) {
        throw new Error('Invalid file structure. Missing required database tables.');
      }

      await db.transaction('rw', [
        db.transactions,
        db.recurring_transactions,
        db.budgets,
        db.settings,
        db.monthly_snapshots
      ], async () => {
        // Clear existing tables
        await db.transactions.clear();
        await db.recurring_transactions.clear();
        await db.budgets.clear();
        await db.settings.clear();
        await db.monthly_snapshots.clear();

        // Populate new tables
        if (parsed.transactions.length > 0) {
          // Parse string dates back to Date objects where needed
          const tList = parsed.transactions.map((t: any) => ({
            ...t,
            created_at: new Date(t.created_at),
          }));
          await db.transactions.bulkAdd(tList);
        }

        if (parsed.recurring_transactions && parsed.recurring_transactions.length > 0) {
          await db.recurring_transactions.bulkAdd(parsed.recurring_transactions);
        }

        if (parsed.budgets.length > 0) {
          await db.budgets.bulkAdd(parsed.budgets);
        }

        if (parsed.settings.length > 0) {
          await db.settings.bulkAdd(parsed.settings);
        }

        if (parsed.monthly_snapshots && parsed.monthly_snapshots.length > 0) {
          await db.monthly_snapshots.bulkAdd(parsed.monthly_snapshots);
        }
      });
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  };

  const resetAllData = async () => {
    await db.transaction('rw', [
      db.transactions,
      db.recurring_transactions,
      db.budgets,
      db.settings,
      db.monthly_snapshots
    ], async () => {
      await db.transactions.clear();
      await db.recurring_transactions.clear();
      await db.budgets.clear();
      await db.settings.clear();
      await db.monthly_snapshots.clear();

      // Seed default settings
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      await db.settings.add({
        currency: '$',
        dark_mode: isSystemDark
      });
    });
  };

  return {
    transactions,
    recurringTransactions,
    budgets,
    settings: currentSettings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringActive,
    saveBudget,
    deleteBudget,
    updateSettings,
    exportData,
    importData,
    resetAllData,
  };
}
