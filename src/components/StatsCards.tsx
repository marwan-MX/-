import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Clock, Scale } from 'lucide-react';
import { CaseItem } from '../types';

interface StatsCardsProps {
  cases: CaseItem[];
  legalWorksCount?: number;
  onFilterChange: (status: string) => void;
  onOpenLegalWorks?: () => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cases,
  legalWorksCount = 0,
  onFilterChange,
  onOpenLegalWorks,
  activeFilter,
}) => {
  const total = cases.length;

  const pendingReview = cases.filter((c) => c.status === 'قيد النظر').length;
  const inProgress = cases.filter((c) => c.status === 'قيد التنفيذ').length;
  const finished = cases.filter((c) => c.status === 'منتهية').length;

  const cards = [
    {
      title: 'إجمالي ملفات القضايا',
      count: total,
      icon: Briefcase,
      accentText: 'text-[#314B6E] dark:text-[#BDB3A3]',
      iconBox: 'bg-[#EEF2F6] dark:bg-[#314B6E]/40 text-[#314B6E] dark:text-[#BDB3A3] border-slate-200 dark:border-[#314B6E]',
      filterValue: 'all',
      badge: 'السجل العام',
    },
    {
      title: 'قضايا قيد النظر',
      count: pendingReview,
      icon: Clock,
      accentText: 'text-[#4F6D91] dark:text-sky-300',
      iconBox: 'bg-sky-50 dark:bg-sky-950/50 text-[#314B6E] dark:text-sky-300 border-sky-200/70 dark:border-sky-500/30',
      filterValue: 'قيد النظر',
      badge: 'جلسات ومرافعات',
    },
    {
      title: 'قضايا قيد التنفيذ',
      count: inProgress,
      icon: Scale,
      accentText: 'text-amber-700 dark:text-amber-300',
      iconBox: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/30',
      filterValue: 'قيد التنفيذ',
      badge: 'تنفيذ الأحكام',
    },
    {
      title: 'قضايا منتهية',
      count: finished,
      icon: CheckCircle2,
      accentText: 'text-emerald-700 dark:text-emerald-300',
      iconBox: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/30',
      filterValue: 'منتهية',
      badge: 'أحكام قطعية',
    },
    {
      title: 'أعمال قانونية',
      count: legalWorksCount,
      icon: Calendar,
      accentText: 'text-[#7A6B54] dark:text-[#BDB3A3]',
      iconBox: 'bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border-[#BDB3A3]/60 dark:border-[#BDB3A3]/40',
      filterValue: 'works',
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
            onClick={() => {
              if (card.filterValue === 'works' && onOpenLegalWorks) {
                onOpenLegalWorks();
              } else {
                onFilterChange(card.filterValue);
              }
            }}
            className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between relative overflow-hidden group ${
              isSelected
                ? 'bg-[#F8FAFC] dark:bg-[#1C2838] border-2 border-[#314B6E] dark:border-[#BDB3A3] shadow-md'
                : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50/80 dark:hover:bg-[#1C2838] border-slate-200 dark:border-[#314B6E] hover:border-[#607EA2] dark:hover:border-[#BDB3A3] shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3 gap-2">
              <span className={`text-[11px] font-bold truncate ${card.accentText}`}>
                {card.badge}
              </span>
              <div className={`p-2 rounded-xl border ${card.iconBox}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#0E141C] dark:text-[#F2EFE9] group-hover:text-[#314B6E] dark:group-hover:text-[#BDB3A3] transition">
                {card.count}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] mt-1 line-clamp-1">
                {card.title}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
