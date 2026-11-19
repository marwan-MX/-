import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  Edit3, 
  Trash2, 
  Plus, 
  LayoutGrid,
  List,
  Scale,
  FileSpreadsheet,
  FileText,
  Download,
  Check,
  ArrowLeftRight,
  Gavel
} from 'lucide-react';
import { CaseItem, CaseStatus, RulingClassification } from '../types';
import { AuthSession } from '../services/api';
import { exportToExcel, exportToWord } from '../utils/exportUtils';
import { gregorianToHijri, formatGregorian } from '../utils/dateUtils';

interface CaseTableProps {
  cases: CaseItem[];
  onViewDetails: (item: CaseItem) => void;
  onEditCase: (item: CaseItem) => void;
  onDeleteCase: (item: CaseItem) => void;
  onAddHearing: (item: CaseItem) => void;
  session: AuthSession | null;
  activeFilter: string;
  onFilterChange: (f: string) => void;
  onOpenAddModal?: () => void;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onViewDetails,
  onEditCase,
  onDeleteCase,
  onAddHearing,
  session,
  activeFilter,
  onFilterChange,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRuling, setSelectedRuling] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Calendar Mode (Gregorian vs Umm al-Qura Hijri)
  const [tableCalendarMode, setTableCalendarMode] = useState<'gregorian' | 'hijri'>('gregorian');
  const [rowCalendarModes, setRowCalendarModes] = useState<Record<string, 'gregorian' | 'hijri'>>({});

  const getEffectiveCalendarMode = (caseId: string) => {
    return rowCalendarModes[caseId] || tableCalendarMode;
  };

  const toggleRowCalendarMode = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getEffectiveCalendarMode(caseId);
    const next = current === 'gregorian' ? 'hijri' : 'gregorian';
    setRowCalendarModes((prev) => ({ ...prev, [caseId]: next }));
  };

  const handleExportExcel = () => {
    if (filteredCases.length === 0) {
      setExportToast('لا توجد قضايا لتصديرها وفق الفلاتر الحالية');
      setTimeout(() => setExportToast(null), 3000);
      return;
    }
    exportToExcel(filteredCases);
    setExportToast(`تم تصدير ملف Excel بنجاح (${filteredCases.length} قضية)`);
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleExportWord = () => {
    if (filteredCases.length === 0) {
      setExportToast('لا توجد قضايا لتصديرها وفق الفلاتر الحالية');
      setTimeout(() => setExportToast(null), 3000);
      return;
    }
    exportToWord(filteredCases);
    setExportToast(`تم تصدير ملف Word بنجاح (${filteredCases.length} قضية)`);
    setTimeout(() => setExportToast(null), 3000);
  };

  // Statuses list (الحالات المحددة)
  const statusesList: CaseStatus[] = [
    'قيد التنفيذ',
    'منتهية',
    'مؤرشفة',
    'قيد النظر',
  ];

  // Categories list (التصنيفات المحددة)
  const categoriesList = [
    'جلسات قادمة',
    'بدون موعد جديد',
    'المؤرشفة',
  ];

  // Ruling Classifications list (تصنيفات الحكم)
  const rulingClassificationsList: RulingClassification[] = [
    'حكم ابتدائي',
    'استئناف أو الأحكام النهائية',
    'تنفيذ أحكام',
    'قضية مؤرشفة',
  ];

  const rulingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const rc of rulingClassificationsList) {
      counts[rc] = 0;
    }
    for (const item of cases) {
      if (item.rulingClassification && counts[item.rulingClassification] !== undefined) {
        counts[item.rulingClassification] += 1;
      }
    }
    return counts;
  }, [cases]);

  // Filtering
  const filteredCases = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);
    const next7Str = next7Days.toISOString().split('T')[0];

    return cases.filter((item) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.caseNumber.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query) ||
        (item.opponentName && item.opponentName.toLowerCase().includes(query)) ||
        (item.court && item.court.toLowerCase().includes(query)) ||
        (item.lawyerInCharge && item.lawyerInCharge.toLowerCase().includes(query));

      const matchesStatusDropdown = selectedStatus === 'all' || item.status === selectedStatus;

      // Category matching logic:
      // 'جلسات قادمة': cases that have an active upcoming hearing date
      // 'بدون موعد جديد': cases that do not have an upcoming hearing scheduled
      // 'المؤرشفة': cases marked as archived
      let matchesCategory = true;
      if (selectedType === 'جلسات قادمة') {
        matchesCategory = !!(item.nextHearingDate && item.nextHearingDate.trim() !== '' && item.nextHearingDate >= todayStr && item.status !== 'مؤرشفة');
      } else if (selectedType === 'بدون موعد جديد') {
        matchesCategory = (!item.nextHearingDate || item.nextHearingDate.trim() === '' || item.nextHearingDate < todayStr) && item.status !== 'مؤرشفة';
      } else if (selectedType === 'المؤرشفة') {
        matchesCategory = item.status === 'مؤرشفة';
      }

      let matchesStatusFilter = true;
      if (activeFilter === 'upcoming') {
        matchesStatusFilter = !!(
          item.nextHearingDate &&
          item.nextHearingDate >= todayStr &&
          item.nextHearingDate <= next7Str
        );
      } else if (activeFilter !== 'all') {
        matchesStatusFilter = item.status === activeFilter || item.status.includes(activeFilter);
      }

      const matchesRuling =
        selectedRuling === 'all' || item.rulingClassification === selectedRuling;

      return matchesSearch && matchesStatusDropdown && matchesCategory && matchesStatusFilter && matchesRuling;
    });
  }, [cases, searchTerm, selectedStatus, selectedType, selectedRuling, activeFilter]);

  // Status badge styling in light & dark executive palette
  const getStatusBadge = (status: CaseStatus | string) => {
    switch (status) {
      case 'قيد النظر':
        return 'bg-sky-50 dark:bg-sky-950/60 text-[#314B6E] dark:text-sky-300 border-sky-200 dark:border-sky-500/35';
      case 'قيد التنفيذ':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/35';
      case 'بانتظار الاعتماد':
        return 'bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border-[#BDB3A3]/70 dark:border-[#BDB3A3]/45';
      case 'منتهية':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35 font-bold';
      case 'مؤرشفة':
        return 'bg-slate-100 dark:bg-[#0E141C] text-slate-600 dark:text-[#8197AC] border-slate-200 dark:border-[#314B6E]';
      default:
        return 'bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E]';
    }
  };

  // Ruling classification badge styling
  const getRulingBadge = (ruling?: string) => {
    switch (ruling) {
      case 'حكم ابتدائي':
        return 'bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border-[#BDB3A3]/70 dark:border-[#BDB3A3]/45';
      case 'استئناف أو الأحكام النهائية':
        return 'bg-sky-50 dark:bg-sky-950/50 text-[#314B6E] dark:text-sky-300 border-[#607EA2]/35 dark:border-sky-500/35';
      case 'تنفيذ أحكام':
        return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/35';
      case 'قضية مؤرشفة':
        return 'bg-slate-100 dark:bg-[#0E141C] text-slate-600 dark:text-[#8197AC] border-slate-200 dark:border-[#314B6E]';
      default:
        return 'bg-slate-100 dark:bg-[#0E141C] text-slate-600 dark:text-[#8197AC] border-slate-200 dark:border-[#314B6E]';
    }
  };

  const getHearingCountdown = (hearingDate?: string) => {
    if (!hearingDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(hearingDate);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'اليوم!', alert: true };
    }
    if (diffDays === 1) {
      return { text: 'غداً', alert: true };
    }
    if (diffDays > 1 && diffDays <= 7) {
      return { text: `بعد ${diffDays} أيام`, alert: true };
    }
    if (diffDays > 7) {
      return { text: `بعد ${diffDays} يوم`, alert: false };
    }
    return { text: 'مضت', alert: false };
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#151E2A] p-4 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8197AC] absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم القضية، الموكل، الخصم، المحكمة، أو المحامي..."
              className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter (الحالات) */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-semibold focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
            >
              <option value="all">كافة الحالات</option>
              {statusesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Categories Filter (التصنيفات) */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-semibold focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
            >
              <option value="all">كافة التصنيفات</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Export Actions (Excel & Word) */}
            <div className="flex items-center gap-1.5 sm:border-r sm:border-slate-200 dark:sm:border-[#314B6E] sm:pr-2">
              <button
                onClick={handleExportExcel}
                title="استخراج جدول القضايا كملف Excel (.xlsx)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#1C2838] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-[#0E141C] dark:text-[#F2EFE9] hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-[#314B6E] hover:border-emerald-300 dark:hover:border-emerald-500/40 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>تصدير Excel</span>
              </button>

              <button
                onClick={handleExportWord}
                title="استخراج جدول القضايا كملف Word (.doc)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#1C2838] hover:bg-sky-50 dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] hover:text-[#314B6E] dark:hover:text-white border border-slate-200 dark:border-[#314B6E] hover:border-[#607EA2] dark:hover:border-[#BDB3A3] rounded-xl text-xs font-bold transition active:scale-95"
              >
                <FileText className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>تصدير Word</span>
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-white dark:bg-[#314B6E] text-[#314B6E] dark:text-white font-bold shadow-2xs' : 'text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
                }`}
                title="عرض الجدول"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'cards' ? 'bg-white dark:bg-[#314B6E] text-[#314B6E] dark:text-white font-bold shadow-2xs' : 'text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ruling Classification Quick Filter Strip (تصنيف الحكم) */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] ml-1">
            <Gavel className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
            <span>تصنيف الحكم:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedRuling('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              selectedRuling === 'all'
                ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-2xs'
                : 'bg-slate-50 dark:bg-[#0E141C] hover:bg-slate-100 dark:hover:bg-[#1C2838] text-slate-700 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E]'
            }`}
          >
            <span>الكل</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
              selectedRuling === 'all' ? 'bg-white/15 text-white' : 'bg-white dark:bg-[#151E2A] text-slate-600 dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E]'
            }`}>
              {cases.length}
            </span>
          </button>

          {rulingClassificationsList.map((rc) => {
            const isActive = selectedRuling === rc;
            const count = rulingCounts[rc] || 0;
            return (
              <button
                key={rc}
                type="button"
                onClick={() => setSelectedRuling(isActive ? 'all' : rc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-2xs'
                    : 'bg-slate-50 dark:bg-[#0E141C] hover:bg-slate-100 dark:hover:bg-[#1C2838] text-slate-700 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] hover:border-[#607EA2] dark:hover:border-[#BDB3A3]'
                }`}
              >
                <span>{rc}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                  isActive ? 'bg-white/15 text-white' : 'bg-white dark:bg-[#151E2A] text-slate-600 dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="bg-white dark:bg-[#151E2A] border border-[#314B6E]/30 dark:border-[#BDB3A3]/50 text-[#0E141C] dark:text-[#F2EFE9] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
            <span>{exportToast}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#8197AC] font-normal">تم التنزيل مباشرة بصيغة متوافقة</span>
        </div>
      )}

      {/* Results Count & Reset Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#8197AC] px-2">
        <div>
          يتم عرض <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-mono tabular-nums font-bold">{filteredCases.length}</strong> قضية من إجمالي{' '}
          <strong className="text-[#0E141C] dark:text-[#F2EFE9] font-mono tabular-nums font-bold">{cases.length}</strong>
        </div>

        {(searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || selectedRuling !== 'all' || activeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedType('all');
              setSelectedRuling('all');
              onFilterChange('all');
            }}
            className="text-[#314B6E] dark:text-[#BDB3A3] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] underline font-bold transition"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      {/* Main View: Table or Cards */}
      {filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-[#151E2A] p-12 rounded-2xl border border-slate-200 dark:border-[#314B6E] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50 flex items-center justify-center text-[#314B6E] dark:text-[#BDB3A3]">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0E141C] dark:text-[#F2EFE9]">لا توجد قضايا مطابقة للبحث أو التصفية</h3>
          <p className="text-xs text-slate-500 dark:text-[#8197AC] max-w-sm mx-auto">
            يمكنك مسح البحث أو تغيير المعايير لعرض باقي ملفات القضايا المسجلة، أو تسجيل قضية جديدة.
          </p>
          {onOpenAddModal && (
            <div className="pt-2">
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#314B6E] hover:bg-[#243954] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#BDB3A3]" />
                <span>إضافة ملف قضية جديدة الآن</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#151E2A] rounded-2xl border border-slate-200 dark:border-[#314B6E] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-[#0E141C] dark:text-[#F2EFE9]">
              <thead className="bg-[#F1F4F8] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] font-bold border-b border-slate-200 dark:border-[#314B6E]">
                <tr>
                  <th className="py-3.5 px-4 w-32">رقم القضية</th>
                  <th className="py-3.5 px-4">موضوع القضية</th>
                  <th className="py-3.5 px-4 w-44">أطراف الدعوى (الموكل / الخصم)</th>
                  <th className="py-3.5 px-4 w-40">المحكمة والدائرة</th>
                  <th className="py-3.5 px-4 w-36">الحالة والتصنيف</th>
                  <th className="py-3.5 px-4 w-44">
                    <div className="flex items-center justify-between gap-1">
                      <span>الجلسة القادمة</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = tableCalendarMode === 'gregorian' ? 'hijri' : 'gregorian';
                          setTableCalendarMode(next);
                          setRowCalendarModes({});
                        }}
                        title="تبديل طريقة عرض كافة التواريخ بين الهجري والميلادي"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#1C2838] border border-slate-300 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:bg-[#314B6E] dark:hover:bg-[#314B6E] hover:text-white transition text-[10px] font-bold active:scale-95"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{tableCalendarMode === 'hijri' ? 'عرض ميلادي' : 'عرض هجري'}</span>
                      </button>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-28 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-[#314B6E]/60">
                {filteredCases.map((item) => {
                  const countdown = getHearingCountdown(item.nextHearingDate);
                  const mode = getEffectiveCalendarMode(item.id);
                  const isHijri = mode === 'hijri';
                  const hijriObj = gregorianToHijri(item.nextHearingDate);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/90 dark:hover:bg-[#1C2838] transition cursor-pointer group"
                      onClick={() => onViewDetails(item)}
                    >
                      {/* Case Number */}
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-[#314B6E] dark:text-[#BDB3A3] whitespace-nowrap">
                        {item.caseNumber}
                      </td>

                      {/* Title & Lawyer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] group-hover:text-[#314B6E] dark:group-hover:text-[#BDB3A3] transition text-sm">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5 flex items-center gap-2">
                          <span>المحامي:</span>
                          <span className="text-slate-700 dark:text-[#F2EFE9] font-semibold">{item.lawyerInCharge || 'إدارة المحاماة'}</span>
                          <span className="text-slate-300 dark:text-[#314B6E]">·</span>
                          <span className="text-slate-500 dark:text-[#8197AC]">التصنيف: {item.caseType}</span>
                        </div>
                      </td>

                      {/* Parties */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0E141C] dark:text-[#F2EFE9]">
                          {item.clientName}
                          <span className="text-[10px] text-[#7A6B54] dark:text-[#BDB3A3] font-bold mr-1">({item.clientType || 'مدعي'})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#8197AC] truncate max-w-[170px] mt-0.5">
                          ضد: {item.opponentName || 'بدون خصم'}
                        </div>
                      </td>

                      {/* Court */}
                      <td className="py-3.5 px-4 text-[#0E141C] dark:text-[#F2EFE9]">
                        <div className="font-medium text-[#0E141C] dark:text-[#F2EFE9]">{item.court}</div>
                        <div className="text-[11px] text-slate-500 dark:text-[#8197AC]">{item.circleNumber || '—'}</div>
                      </td>

                      {/* Status & Ruling Classification */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                          {item.rulingClassification && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRulingBadge(item.rulingClassification)}`}>
                              <Gavel className="w-2.5 h-2.5 flex-shrink-0" />
                              <span>{item.rulingClassification}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Next Hearing (with interactive Hijri/Gregorian converter button) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.nextHearingDate ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] flex-shrink-0" />
                                <span className={`font-bold ${isHijri ? 'text-[#0E141C] dark:text-[#F2EFE9] text-xs' : 'font-mono tabular-nums text-[#0E141C] dark:text-[#F2EFE9] text-xs'}`}>
                                  {isHijri
                                    ? (hijriObj?.formattedText || item.nextHearingDateHijri || item.nextHearingDate)
                                    : item.nextHearingDate}
                                </span>
                                <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-slate-100 dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E]">
                                  {isHijri ? 'هـ' : 'م'}
                                </span>
                              </div>

                              {/* Button next to date to convert instantly */}
                              <button
                                type="button"
                                onClick={(e) => toggleRowCalendarMode(item.id, e)}
                                title={isHijri ? 'تحويل وعرض بالتاريخ الميلادي المقابل' : 'تحويل وعرض بالتاريخ الهجري (أم القرى) المقابل'}
                                className="px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-[#1C2838] hover:bg-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:text-white border border-slate-200 dark:border-[#314B6E] text-[10px] font-bold flex items-center gap-1 transition active:scale-90"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>{isHijri ? 'ميلادي' : 'هجري'}</span>
                              </button>
                            </div>

                            {/* Secondary converted date indicator */}
                            <div className="text-[10px] text-slate-500 dark:text-[#8197AC] font-medium">
                              {isHijri ? (
                                <span>الموافق: <strong className="font-mono text-[#0E141C] dark:text-[#F2EFE9]">{item.nextHearingDate} م</strong></span>
                              ) : hijriObj ? (
                                <span>الموافق: <strong className="text-[#7A6B54] dark:text-[#BDB3A3]">{hijriObj.formattedText}</strong></span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              {countdown && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  countdown.alert 
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40' 
                                    : 'text-slate-600 dark:text-[#8197AC] bg-slate-100 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E]'
                                }`}>
                                  {countdown.text}
                                </span>
                              )}
                              {item.nextHearingTime && (
                                <span className="text-[11px] text-slate-500 dark:text-[#8197AC] font-mono tabular-nums">
                                  {item.nextHearingTime}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-[#8197AC]/60 text-[11px]">لا يوجد موعد</span>
                        )}
                      </td>

                      {/* Action Buttons (Strictly Protected) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Quick Hearing Note */}
                          <button
                            onClick={() => onAddHearing(item)}
                            title="إضافة جلسة أو مذكرة جديدة (محمي)"
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] hover:border-[#314B6E] dark:hover:border-[#BDB3A3] text-slate-600 dark:text-[#8197AC] hover:text-[#314B6E] dark:hover:text-[#BDB3A3] hover:bg-sky-50 dark:hover:bg-[#314B6E]/40 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Case */}
                          <button
                            onClick={() => onEditCase(item)}
                            title="تعديل بيانات القضية (محمي بكلمة مرور المحامي)"
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] hover:border-[#314B6E] dark:hover:border-[#BDB3A3] text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#314B6E]/40 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Case */}
                          <button
                            onClick={() => onDeleteCase(item)}
                            title="حذف القضية نهائياً (محمي بكلمة مرور)"
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] hover:border-rose-300 dark:hover:border-rose-500/50 text-slate-500 dark:text-[#8197AC] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((item) => {
            const countdown = getHearingCountdown(item.nextHearingDate);

            return (
              <div
                key={item.id}
                onClick={() => onViewDetails(item)}
                className="bg-white dark:bg-[#151E2A] p-4 rounded-2xl border border-slate-200 dark:border-[#314B6E] hover:border-[#314B6E] dark:hover:border-[#BDB3A3] transition shadow-xs hover:shadow-md flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar in Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono tabular-nums text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] bg-[#EEF2F6] dark:bg-[#0E141C] px-2 py-0.5 rounded border border-slate-200 dark:border-[#314B6E]">
                      {item.caseNumber}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.rulingClassification && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRulingBadge(item.rulingClassification)}`}>
                          <Gavel className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>{item.rulingClassification}</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#0E141C] dark:text-[#F2EFE9] group-hover:text-[#314B6E] dark:group-hover:text-[#BDB3A3] transition line-clamp-2 mb-3">
                    {item.title}
                  </h3>

                  {/* Parties */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#8197AC] bg-slate-50 dark:bg-[#0E141C] p-3 rounded-xl border border-slate-200/80 dark:border-[#314B6E] mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#8197AC]">الموكل:</span>
                      <span className="font-semibold text-[#0E141C] dark:text-[#F2EFE9]">{item.clientName}</span>
                    </div>
                    {item.opponentName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-[#8197AC]">الخصم:</span>
                        <span className="text-slate-700 dark:text-[#F2EFE9]/90">{item.opponentName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#8197AC]">المحكمة:</span>
                      <span className="text-[#314B6E] dark:text-[#BDB3A3] font-medium truncate max-w-[160px]">{item.court}</span>
                    </div>
                  </div>

                  {/* Upcoming Hearing (with interactive converter button) */}
                  {item.nextHearingDate && (() => {
                    const mode = getEffectiveCalendarMode(item.id);
                    const isHijri = mode === 'hijri';
                    const hijriObj = gregorianToHijri(item.nextHearingDate);
                    const primaryDate = isHijri
                      ? (hijriObj?.formattedText || item.nextHearingDateHijri || item.nextHearingDate)
                      : item.nextHearingDate;

                    return (
                      <div className="bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] p-2.5 rounded-xl text-xs space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[#0E141C] dark:text-[#F2EFE9] font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] flex-shrink-0" />
                            <span className={isHijri ? 'text-xs' : 'font-mono tabular-nums'}>{primaryDate}</span>
                            <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-white dark:bg-[#151E2A] text-[#314B6E] dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E]">
                              {isHijri ? 'هـ' : 'م'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Button next to date to convert */}
                            <button
                              type="button"
                              onClick={(e) => toggleRowCalendarMode(item.id, e)}
                              title={isHijri ? 'تحويل للميلادي' : 'تحويل للهجري'}
                              className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#1C2838] hover:bg-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:text-white border border-slate-200 dark:border-[#314B6E] text-[10px] font-bold flex items-center gap-1 active:scale-95"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>{isHijri ? 'ميلادي' : 'هجري'}</span>
                            </button>

                            {countdown && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                countdown.alert ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40' : 'text-slate-600 dark:text-[#8197AC] bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E]'
                              }`}>
                                {countdown.text}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-[#8197AC] font-medium">
                          {isHijri ? (
                            <span>الموافق: <strong className="font-mono text-[#0E141C] dark:text-[#F2EFE9]">{item.nextHearingDate} م</strong></span>
                          ) : hijriObj ? (
                            <span>الموافق: <strong className="text-[#7A6B54] dark:text-[#BDB3A3]">{hijriObj.formattedText}</strong></span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Actions */}
                <div 
                  className="pt-3 border-t border-slate-200 dark:border-[#314B6E] flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                    بواسطة: {item.lastModifiedByName || item.createdByName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddHearing(item)}
                      title="إضافة جلسة"
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] hover:bg-sky-50 dark:hover:bg-[#314B6E] text-slate-600 dark:text-[#8197AC] hover:text-[#314B6E] dark:hover:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditCase(item)}
                      title="تعديل القضية"
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCase(item)}
                      title="حذف القضية"
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 dark:text-[#8197AC] hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#314B6E]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
