import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        hoverable ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none hover:border-brand-500/30' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
