import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ExpenseCategory, Budget } from '../types';
import { Button } from './UI/Button';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: ExpenseCategory, monthlyLimit: number) => Promise<any>;
  budgetToEdit?: Budget | null;
  existingBudgetCategories: ExpenseCategory[];
  currency: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transportation',
  'Rent',
  'Utilities',
  'Education',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Savings',
  'Subscriptions',
  'Tithe',
  'Other'
];

export const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
  existingBudgetCategories,
  currency,
}) => {
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [limit, setLimit] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setLimit(budgetToEdit.monthly_limit.toString());
    } else {
      setCategory('');
      setLimit('');
    }
    setErrors({});
  }, [budgetToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const parsedLimit = parseFloat(limit);

    if (!category) {
      newErrors.category = 'Category is required.';
    } else if (!budgetToEdit && existingBudgetCategories.includes(category)) {
      newErrors.category = 'A budget limit for this category already exists.';
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      newErrors.limit = 'Budget limit must be greater than zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(category as ExpenseCategory, parseFloat(limit));
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden z-10 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 mb-6">
          {budgetToEdit ? 'Modify Category Budget' : 'Create Category Budget'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category selection */}
          <div>
            <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              disabled={!!budgetToEdit} // Do not allow changing category when editing
              className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                errors.category ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed`}
              required
            >
              <option value="" disabled className="text-slate-400">Select Category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option 
                  key={cat} 
                  value={cat}
                  disabled={!budgetToEdit && existingBudgetCategories.includes(cat)}
                  className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 disabled:opacity-40"
                >
                  {cat} {!budgetToEdit && existingBudgetCategories.includes(cat) ? '(Limit Set)' : ''}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Limit input */}
          <div>
            <label htmlFor="limit" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Monthly Limit ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">
                {currency}
              </span>
              <input
                id="limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                  errors.limit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500`}
                required
              />
            </div>
            {errors.limit && <p className="text-rose-500 text-xs mt-1">{errors.limit}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              {budgetToEdit ? 'Update Limit' : 'Save Limit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
