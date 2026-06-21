import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  FileText,
  ShieldCheck,
  Settings as SettingsIcon,
  PiggyBank
} from 'lucide-react';

export type NavTab = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'assessment' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'History', icon: <Receipt className="w-5 h-5" /> },
    { id: 'budgets', label: 'Budget', icon: <Wallet className="w-5 h-5" /> },
    { id: 'reports', label: 'Stats', icon: <FileText className="w-5 h-5" /> },
    { id: 'assessment', label: 'Health', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'settings', label: 'Setup', icon: <SettingsIcon className="w-5 h-5" /> },
  ] as const;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80 p-6 z-30">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 text-white p-2.5 rounded-xl shadow-md shadow-brand-500/20">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 leading-none">SmartBudget</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-1 block">Local & Secure</span>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 pl-3 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
              >
                <span className={`transition-colors duration-200 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/60 dark:border-slate-800/80 backdrop-blur-xl px-1 pb-safe pt-2 flex justify-between items-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center flex-1 gap-1 py-1 transition-all duration-200 ${isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}
            >
              <span className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-brand-500/10' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};