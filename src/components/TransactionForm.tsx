import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Transaction, TransactionType, TransactionCategory } from '../types';
import { Button } from './UI/Button';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: any) => Promise<any>;
  transactionToEdit?: Transaction | null;
  currency: string;
}

const INCOME_CATEGORIES = ['Salary', 'Allowance', 'Freelance', 'Business', 'Scholarship', 'Gift', 'Investment', 'Other'] as const;
const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Utilities', 'Education', 'Entertainment', 'Shopping', 'Healthcare', 'Savings', 'Subscriptions', 'Other'] as const;

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  currency,
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setType(transactionToEdit.transaction_type);
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setNote(transactionToEdit.note);
    } else {
      setAmount('');
      setType('Expense');
      setCategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
    setErrors({});
  }, [transactionToEdit, isOpen]);

  useEffect(() => {
    if (!transactionToEdit) setCategory('');
  }, [type]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) newErrors.amount = 'Required > 0';
    if (!category) newErrors.category = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        amount: parseFloat(amount),
        transaction_type: type,
        category: category as TransactionCategory,
        date,
        note: note.trim(),
      });
      onClose();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const categoriesList = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl border-t sm:border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 pb-10 sm:pb-6 z-10 animate-slide-in-up sm:animate-slide-in">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden" />
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400"><X className="w-6 h-6" /></button>

        <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mb-6">
          {transactionToEdit ? 'Edit Record' : 'New Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">How much? ({currency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-brand-500">{currency}</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border rounded-2xl pl-12 pr-4 py-4 text-2xl font-bold text-slate-800 dark:text-slate-100 focus:border-brand-500 outline-none ${errors.amount ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} required />
            </div>
            {errors.amount && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
            <button type="button" onClick={() => setType('Expense')} className={`py-3 text-sm font-bold rounded-xl ${type === 'Expense' ? 'bg-white shadow-md text-rose-500' : 'text-slate-500'}`}>Expense</button>
            <button type="button" onClick={() => setType('Income')} className={`py-3 text-sm font-bold rounded-xl ${type === 'Income' ? 'bg-white shadow-md text-emerald-500' : 'text-slate-500'}`}>Income</button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-800/40 border rounded-xl px-4 py-3 text-sm focus:border-brand-500 outline-none ${errors.category ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} required>
              <option value="" disabled>Select Category</option>
              {categoriesList.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {errors.category && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-brand-500 outline-none" required />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" variant={type === 'Expense' ? 'primary' : 'success'} loading={isSubmitting} className="w-full py-4 text-lg rounded-2xl order-1 sm:order-2">
              {transactionToEdit ? 'Update' : 'Confirm'}
            </Button>
            <button type="button" onClick={onClose} className="w-full py-3 text-slate-400 order-2 sm:hidden font-medium">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};