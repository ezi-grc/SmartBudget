import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { RecurringTransaction, TransactionType, TransactionCategory, RecurringFrequency } from '../types';
import { Button } from './UI/Button';

interface RecurringFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recurringData: any) => Promise<any>;
  recurringToEdit?: RecurringTransaction | null;
  currency: string;
}

const INCOME_CATEGORIES = ['Salary', 'Allowance', 'Freelance', 'Business', 'Scholarship', 'Gift', 'Investment', 'Other'] as const;
const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Utilities', 'Education', 'Entertainment', 'Shopping', 'Healthcare', 'Savings', 'Subscriptions', 'Other'] as const;
const FREQUENCIES: RecurringFrequency[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

export const RecurringForm: React.FC<RecurringFormProps> = ({
  isOpen,
  onClose,
  onSave,
  recurringToEdit,
  currency,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recurringToEdit) {
      setName(recurringToEdit.name);
      setAmount(recurringToEdit.amount.toString());
      setType(recurringToEdit.transaction_type);
      setCategory(recurringToEdit.category);
      setFrequency(recurringToEdit.frequency);
      setStartDate(recurringToEdit.start_date);
      setEndDate(recurringToEdit.end_date || '');
    } else {
      setName('');
      setAmount('');
      setType('Expense');
      setCategory('');
      setFrequency('Monthly');
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
    }
    setErrors({});
  }, [recurringToEdit, isOpen]);

  useEffect(() => {
    if (!recurringToEdit) {
      setCategory('');
    }
  }, [type]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const parsedAmount = parseFloat(amount);

    if (!name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero.';
    }
    if (!category) {
      newErrors.category = 'Category is required.';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required.';
    }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date cannot be earlier than start date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        amount: parseFloat(amount),
        transaction_type: type,
        category: category as TransactionCategory,
        frequency,
        start_date: startDate,
        end_date: endDate ? endDate : undefined,
        is_active: recurringToEdit ? recurringToEdit.is_active : true,
        // Carry over last_processed_date if editing
        ...(recurringToEdit?.last_processed_date ? { last_processed_date: recurringToEdit.last_processed_date } : {})
      };
      await onSave(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
          {recurringToEdit ? 'Edit Recurring Rule' : 'New Recurring Rule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Rule Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Monthly Rent, Monthly Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500`}
              required
            />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Toggle Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'Expense'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'Income'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">
                {currency}
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                  errors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500`}
                required
              />
            </div>
            {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                  errors.category ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer`}
                required
              >
                <option value="" disabled className="text-slate-400">Select</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="frequency" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Frequency
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer"
                required
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                    {freq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                  errors.startDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer`}
                required
              />
              {errors.startDate && <p className="text-rose-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                End Date (Optional)
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border ${
                  errors.endDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer`}
              />
              {errors.endDate && <p className="text-rose-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
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
              variant={type === 'Expense' ? 'primary' : 'success'}
              loading={isSubmitting}
            >
              {recurringToEdit ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
