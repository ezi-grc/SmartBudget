import Dexie, { type Table } from 'dexie';
import type { Transaction, RecurringTransaction, Budget, MonthlyReport, Settings, MonthlySnapshot } from '../types';

export class NexusDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  recurring_transactions!: Table<RecurringTransaction, number>;
  budgets!: Table<Budget, number>;
  monthly_reports!: Table<MonthlyReport, number>;
  settings!: Table<Settings, number>;
  monthly_snapshots!: Table<MonthlySnapshot, number>;

  constructor() {
    super('NexusDB');
    this.version(1).stores({
      transactions: '++id, amount, transaction_type, category, date, created_at',
      recurring_transactions: '++id, name, amount, transaction_type, category, frequency, start_date, is_active',
      budgets: '++id, &category, monthly_limit',
      monthly_reports: '++id, [month+year], month, year',
      settings: '++id',
      monthly_snapshots: '++id, [month+year], month, year'
    });
  }
}

export const db = new NexusDatabase();

// Seed initial default settings if they don't exist
db.on('ready', async () => {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await db.settings.add({
      currency: '$',
      dark_mode: isSystemDark
    });
  }
});
