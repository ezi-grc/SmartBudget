import React, { useRef, useState } from 'react';
import { 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import type { Settings as SettingsType } from '../types';
import { Card, CardHeader } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useToast } from '../components/UI/Toast';

interface SettingsProps {
  settings: SettingsType;
  updateSettings: (updates: Partial<SettingsType>) => Promise<any>;
  exportData: () => Promise<any>;
  importData: (jsonData: string) => Promise<boolean>;
  resetAllData: () => Promise<any>;
}

const CURRENCIES = [
  { symbol: '$', name: 'US Dollar (USD)' },
  { symbol: '€', name: 'Euro (EUR)' },
  { symbol: '£', name: 'British Pound (GBP)' },
  { symbol: '¥', name: 'Yen / Yuan (JPY/CNY)' },
  { symbol: '₱', name: 'Philippine Peso (PHP)' },
  { symbol: '₹', name: 'Indian Rupee (INR)' },
  { symbol: '₩', name: 'Korean Won (KRW)' },
  { symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
];

export const Settings: React.FC<SettingsProps> = ({
  settings,
  updateSettings,
  exportData,
  importData,
  resetAllData,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updateSettings({ currency: e.target.value });
      showToast(`Currency updated to ${e.target.value}`, 'success');
    } catch (err) {
      showToast('Failed to update currency settings.', 'error');
    }
  };

  const handleThemeToggle = async () => {
    try {
      const nextMode = !settings.dark_mode;
      await updateSettings({ dark_mode: nextMode });
      showToast(nextMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
    } catch (err) {
      showToast('Failed to update theme settings.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      await exportData();
      showToast('Database exported successfully as JSON.', 'success');
    } catch (err) {
      showToast('Failed to export data.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonContent = evt.target?.result as string;
        const success = await importData(jsonContent);
        if (success) {
          showToast('Data imported and database synchronized successfully!', 'success');
        }
      } catch (err) {
        showToast('Import failed. Make sure the file is a valid NEXUS backup JSON.', 'error');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    try {
      await resetAllData();
      showToast('All transaction, budget, and recurring database stores cleared.', 'success');
      setIsResetConfirmOpen(false);
    } catch (err) {
      showToast('Database reset failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Application Settings
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Configure default currency standards, UI theme modes, and manage offline data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: General Configurations */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Regional & Theme Options" subtitle="Adjust basic preferences" />
            
            <div className="space-y-5">
              {/* Currency Select */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Default Currency</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Alters display markers on charts and dashboard cards</span>
                </div>
                <select
                  value={settings.currency}
                  onChange={handleCurrencyChange}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer w-full sm:w-48 appearance-none"
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur.symbol} value={cur.symbol} className="bg-white dark:bg-slate-900">
                      {cur.symbol} - {cur.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

              {/* Theme Selector Toggle */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Theme Palette Mode</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Toggle between light themes and midnight dark themes</span>
                </div>
                
                <button
                  onClick={handleThemeToggle}
                  className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/60 transition-all active:scale-95 text-slate-600 dark:text-slate-350"
                  title={settings.dark_mode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {settings.dark_mode ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600" />
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Privacy Information */}
          <Card className="bg-gradient-to-tr from-brand-50/20 dark:from-brand-950/10 border-l-4 border-l-brand-500">
            <CardHeader title="Offline Isolation Architecture" subtitle="How your data is kept secure" />
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              NEXUS uses **IndexedDB via Dexie.js** to isolate 100% of your transaction activities in your local browser sandbox. No user registration, server-sync cookies, analytics scripts, or remote endpoints are implemented. 
            </p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mt-3">
              Because all data is stored strictly in your browser cache memory, performing a full browser cache delete or deleting offline website data might remove these records. Be sure to use the **Backup Export** utility on the right to preserve records periodically.
            </p>
          </Card>
        </div>

        {/* Right Side: Data Management Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Offline Data Storage Operations" subtitle="Backup export, restore, and wipe functions" />
            
            <div className="space-y-4">
              {/* Backup Export */}
              <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Export Backup JSON</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Serialize IndexedDB to download a local backup file</span>
                </div>
                <Button 
                  onClick={handleExport}
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
              </div>

              {/* Restore Import */}
              <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Import Backup JSON</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Restore transactions from a previous backup file</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                />
                <Button 
                  onClick={handleImportClick}
                  variant="outline"
                  loading={importing}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Import
                </Button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

              {/* Reset Data Danger */}
              <div className="flex items-center justify-between gap-4 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-900/10 p-4 rounded-2xl border-l-4 border-l-rose-500">
                <div>
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-400 block">Wipe Database Stores</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Irreversibly delete all local accounts history data</span>
                </div>
                <Button 
                  onClick={() => setIsResetConfirmOpen(true)}
                  variant="danger"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Wipe Data
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsResetConfirmOpen(false)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 z-10 animate-slide-in">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <ShieldAlert className="w-8 h-8 flex-shrink-0 animate-soft-pulse" />
              <h3 className="text-lg font-bold font-display">Confirm Data Deletion</h3>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
              You are about to delete all budgets, transactions, recurring parameters, and snapshots in this browser cache. This action is **permanent** and cannot be undone without a backup file. Do you wish to continue?
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReset}>
                Wipe All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
