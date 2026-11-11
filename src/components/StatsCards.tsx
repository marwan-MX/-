import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Clock, Scale } from 'lucide-react';
import { CaseItem } from '../types';

interface StatsCardsProps {
  cases: CaseItem[];
  onFilterChange: (status: string) => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cases,
  onFilterChange,
  activeFilter,
}) => {
  const total = cases.length;

  const pendingReview = cases.filter((c) => c.status === 'قيد النظر').length;
  const inProgress = cases.filter((c) => c.status === 'قيد التنفيذ').length;
  const finished = cases.filter((c) => c.status === 'منتهية').length;
  const archived = cases.filter((c) => c.status === 'مؤرشفة').length;

  const cards = [
    {
      title: 'إجمالي ملفات القضايا',
      count: total,
      icon: Briefcase,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconBox: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      filterValue: 'all',
      badge: 'السجل العام',
    },
    {
      title: 'قضايا قيد النظر',
      count: pendingReview,
      icon: Clock,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      iconBox: 'bg-blue-100 text-blue-700 border-blue-200',
      filterValue: 'قيد النظر',
      badge: 'جلسات ومرافعات',
    },
    {
      title: 'قضايا قيد التنفيذ',
      count: inProgress,
      icon: Scale,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      iconBox: 'bg-purple-100 text-purple-700 border-purple-200',
      filterValue: 'قيد التنفيذ',
      badge: 'تنفيذ الأحكام',
    },
    {
      title: 'قضايا منتهية',
      count: finished,
      icon: CheckCircle2,
      color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
      iconBox: 'bg-emerald-200 text-emerald-900 border-emerald-300',
      filterValue: 'منتهية',
      badge: 'أحكام قطعية',
    },
    {
      title: 'قضايا مؤرشفة',
      count: archived,
      icon: Calendar,
      color: 'bg-slate-100 border-slate-300 text-slate-800',
      iconBox: 'bg-slate-200 text-slate-800 border-slate-300',
      filterValue: 'مؤرشفة',
      badge: 'الأعمال القانونية و التشغيلية',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterValue;

        return (
          <button
            key={card.title}
            onClick={() => onFilterChange(card.filterValue)}
            className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
              isSelected
                ? 'bg-white border-2 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md scale-[1.01]'
                : `bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-300`
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${card.color}`}>
                {card.badge}
              </span>
              <div className={`p-2 rounded-xl border ${card.iconBox}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 group-hover:text-emerald-700 transition">
                {card.count}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-1 line-clamp-1">
                {card.title}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
