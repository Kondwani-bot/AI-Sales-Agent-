import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
}) => {
  let iconBg = 'bg-blue-50 text-blue-600 border-blue-100';
  if (accentColor === 'emerald') iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (accentColor === 'amber') iconBg = 'bg-amber-50 text-amber-600 border-amber-100';
  if (accentColor === 'indigo') iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-100';
  if (accentColor === 'purple') iconBg = 'bg-purple-50 text-purple-600 border-purple-100';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1.5 leading-tight">{subtitle}</p>}
    </div>
  );
};
