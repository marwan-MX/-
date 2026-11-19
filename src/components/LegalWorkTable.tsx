import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Edit3, 
  Trash2, 
  LayoutGrid,
  List,
  Briefcase,
  FileSpreadsheet,
  FileText,
  ArrowLeftRight,
  User,
  Paperclip,
  PlusCircle
} from 'lucide-react';
import { LegalWorkItem, LegalWorkType, LegalWorkStatus } from '../types';
import { AuthSession } from '../services/api';
import { exportLegalWorksToExcel, exportLegalWorksToWord } from '../utils/exportUtils';
import { gregorianToHijri } from '../utils/dateUtils';

interface LegalWorkTableProps {
  works: LegalWorkItem[];
  onViewDetails: (item: LegalWorkItem) => void;
  onEditWork: (item: LegalWorkItem) => void;
  onDeleteWork: (item: LegalWorkItem) => void;
  onOpenAddModal: () => void;
  session: AuthSession | null;
}

const WORK_TYPES: LegalWorkType[] = [
  'سند لأمر',
  'عقود واتفاقيات',
  'استشارات قانونية',
  'مطالبات وإخطارات',
  'تحصيل ديون',
  'خدمات شركات',
  'أخرى',
];

const WORK_STATUSES: LegalWorkStatus[] = [
  'قيد التنفيذ',
  'منجز',
  'معلق',
  'بانتظار العميل',
  'مؤرشف',
];

export const LegalWorkTable: React.FC<LegalWorkTableProps> = ({
  works,
  onViewDetails,
  onEditWork,
  onDeleteWork,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Global Calendar Mode (Gregorian vs Umm al-Qura Hijri)
  const [tableCalendarMode, setTableCalendarMode] = useState<'gregorian' | 'hijri'>('gregorian');
  const [rowCalendarModes, setRowCalendarModes] = useState<Record<string, 'gregorian' | 'hijri'>>({});

  const getEffectiveCalendarMode = (workId: string) => {
    return rowCalendarModes[workId] || tableCalendarMode;
  };

  const toggleRowCalendarMode = (workId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getEffectiveCalendarMode(workId);
    const next = current === 'gregorian' ? 'hijri' : 'gregorian';
    setRowCalendarModes((prev) => ({ ...prev, [workId]: next }));
  };

  const handleExportExcel = () => {
    if (filteredWorks.length === 0) {
      setExportToast('لا توجد أعمال لتصديرها وفق الفلاتر الحالية');
      setTimeout(() => setExportToast(null), 3000);
      return;
    }
    exportLegalWorksToExcel(filteredWorks);
    setExportToast(`تم تصدير ملف Excel بنجاح (${filteredWorks.length} عمل قانوني)`);
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleExportWord = () => {
    if (filteredWorks.length === 0) {
      setExportToast('لا توجد أعمال لتصديرها وفق الفلاتر الحالية');
      setTimeout(() => setExportToast(null), 3000);
      return;
    }
    exportLegalWorksToWord(filteredWorks);
    setExportToast(`تم تصدير تقرير Word بنجاح (${filteredWorks.length} عمل قانوني)`);
    setTimeout(() => setExportToast(null), 3000);
  };

  const filteredWorks = useMemo(() => {
    return works.filter((item) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.workNumber.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query) ||
        (item.opponentName && item.opponentName.toLowerCase().includes(query)) ||
        (item.lawyerInCharge && item.lawyerInCharge.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query));

      const matchesType = selectedType === 'all' || item.workType === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [works, searchTerm, selectedType, selectedStatus]);

  const stats = useMemo(() => {
    const total = works.length;
    const promissoryNotes = works.filter((w) => w.workType === 'سند لأمر').length;
    const contracts = works.filter((w) => w.workType === 'عقود واتفاقيات').length;
    const consultations = works.filter((w) => w.workType === 'استشارات قانونية').length;
    const demandsAndCollections = works.filter((w) => w.workType === 'مطالبات وإخطارات' || w.workType === 'تحصيل ديون').length;
    const corporate = works.filter((w) => w.workType === 'خدمات شركات').length;

    return {
      total,
      promissoryNotes,
      contracts,
      consultations,
      demandsAndCollections,
      corporate,
    };
  }, [works]);

  const formatCurrency = (val?: number) => {
    if (!val) return '—';
    return `${Number(val).toLocaleString('ar-SA')} ر.س`;
  };

  const getStatusBadge = (status: LegalWorkStatus) => {
    switch (status) {
      case 'قيد التنفيذ':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-[#314B6E] dark:text-sky-300 border border-sky-200 dark:border-sky-500/35">قيد التنفيذ</span>;
      case 'منجز':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/35">منجز</span>;
      case 'معلق':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/35">معلق</span>;
      case 'بانتظار العميل':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/35">بانتظار العميل</span>;
      case 'مؤرشف':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#0E141C] text-slate-600 dark:text-[#8197AC] border border-slate-200 dark:border-[#314B6E]">مؤرشف</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]">{status}</span>;
    }
  };

  const getTypeBadge = (workType: string) => {
    switch (workType) {
      case 'سند لأمر':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/45">سند لأمر</span>;
      case 'عقود واتفاقيات':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-[#314B6E] dark:text-sky-300 border border-sky-200 dark:border-sky-500/35">عقود واتفاقيات</span>;
      case 'استشارات قانونية':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">استشارات قانونية</span>;
      case 'مطالبات وإخطارات':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/35">مطالبات وإخطارات</span>;
      case 'تحصيل ديون':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/35">تحصيل ديون</span>;
      case 'خدمات شركات':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]">خدمات شركات</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]">{workType}</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Toast Notification */}
      {exportToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] px-5 py-2.5 rounded-2xl shadow-xl border border-[#314B6E]/30 dark:border-[#BDB3A3]/50 text-xs font-bold animate-fadeIn">
          {exportToast}
        </div>
      )}

      {/* KPI Quick Banner for Legal Works */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedType('all')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'all'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'all' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>إجمالي الأعمال</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'all' ? 'text-white' : 'text-[#314B6E] dark:text-[#BDB3A3]'}`}>{stats.total}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'all' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>معاملة مسجلة</div>
        </button>

        <button
          onClick={() => setSelectedType('سند لأمر')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'سند لأمر'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'سند لأمر' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>سندات لأمر</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'سند لأمر' ? 'text-white' : 'text-[#7A6B54] dark:text-[#BDB3A3]'}`}>{stats.promissoryNotes}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'سند لأمر' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>تنفيذ ومطالبة</div>
        </button>

        <button
          onClick={() => setSelectedType('عقود واتفاقيات')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'عقود واتفاقيات'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'عقود واتفاقيات' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>عقود واتفاقيات</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'عقود واتفاقيات' ? 'text-white' : 'text-[#0E141C] dark:text-[#F2EFE9]'}`}>{stats.contracts}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'عقود واتفاقيات' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>صياغة ومراجعة</div>
        </button>

        <button
          onClick={() => setSelectedType('استشارات قانونية')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'استشارات قانونية'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'استشارات قانونية' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>استشارات</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'استشارات قانونية' ? 'text-white' : 'text-[#4F6D91] dark:text-sky-300'}`}>{stats.consultations}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'استشارات قانونية' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>رأي ومذكرات</div>
        </button>

        <button
          onClick={() => setSelectedType('تحصيل ديون')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'تحصيل ديون'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'تحصيل ديون' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>مطالبات وتحصيل</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'تحصيل ديون' ? 'text-white' : 'text-emerald-700 dark:text-emerald-300'}`}>{stats.demandsAndCollections}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'تحصيل ديون' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>إخطارات ومتابعة</div>
        </button>

        <button
          onClick={() => setSelectedType('خدمات شركات')}
          className={`p-3 rounded-2xl border text-right transition ${
            selectedType === 'خدمات شركات'
              ? 'bg-[#314B6E] text-white border-[#314B6E] shadow-sm'
              : 'bg-white dark:bg-[#151E2A] hover:bg-slate-50 dark:hover:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E] shadow-2xs'
          }`}
        >
          <div className={`text-[11px] font-bold ${selectedType === 'خدمات شركات' ? 'text-white/80' : 'text-slate-500 dark:text-[#8197AC]'}`}>خدمات الشركات</div>
          <div className={`text-xl font-black font-mono tabular-nums mt-1 ${selectedType === 'خدمات شركات' ? 'text-white' : 'text-slate-700 dark:text-[#F2EFE9]'}`}>{stats.corporate}</div>
          <div className={`text-[10px] mt-0.5 ${selectedType === 'خدمات شركات' ? 'text-white/75' : 'text-slate-500 dark:text-[#8197AC]'}`}>حوكمة وتأسيس</div>
        </button>
      </div>

      {/* Control Bar: Search, Category Tabs, Status Filter, Export, View Mode */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] shadow-xs space-y-4">
        
        {/* Row 1: Search & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8197AC] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم المعاملة، موضوع العمل، اسم الموكل، الطرف الآخر، أو المحامي..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:bg-white dark:focus:bg-[#1C2838] text-xs font-medium placeholder-slate-400 dark:placeholder-[#8197AC]/60 bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] focus:outline-none"
            />
          </div>

          {/* Action buttons: Add, Export, Calendar, View Mode */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            
            {/* Add New Work Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#314B6E] hover:bg-[#243954] text-white transition shadow-xs active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#BDB3A3]" />
              <span>إضافة عمل جديد</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              title="تصدير جدول الأعمال إلى Excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-[#1C2838] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-[#0E141C] dark:text-[#F2EFE9] hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-[#314B6E] transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Export Word */}
            <button
              onClick={handleExportWord}
              title="تصدير تقرير رسمي إلى Word"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-[#1C2838] hover:bg-sky-50 dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] hover:text-[#314B6E] dark:hover:text-white border border-slate-200 dark:border-[#314B6E] transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* Global Calendar Switch */}
            <button
              onClick={() => setTableCalendarMode((m) => (m === 'gregorian' ? 'hijri' : 'gregorian'))}
              title="التبديل بين التقويم الميلادي والهجري لكامل الجدول"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E] transition active:scale-95"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>{tableCalendarMode === 'gregorian' ? 'التحويل لهجري' : 'التحويل لميلادي'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-[#314B6E] rounded-xl p-0.5 bg-slate-100 dark:bg-[#0E141C]">
              <button
                onClick={() => setViewMode('table')}
                title="عرض جدول"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white dark:bg-[#314B6E] text-[#314B6E] dark:text-white shadow-2xs' : 'text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="عرض بطاقات"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-white dark:bg-[#314B6E] text-[#314B6E] dark:text-white shadow-2xs' : 'text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Row 2: Status & Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#314B6E]">
          
          {/* Work Type Quick Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#314B6E] dark:text-[#BDB3A3] ml-1">تصنيف العمل:</span>
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                selectedType === 'all'
                  ? 'bg-[#314B6E] text-white border-[#314B6E]'
                  : 'bg-slate-50 dark:bg-[#0E141C] text-slate-700 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E]'
              }`}
            >
              الكل ({works.length})
            </button>
            {WORK_TYPES.map((type) => {
              const count = works.filter((w) => w.workType === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    selectedType === type
                      ? 'bg-[#314B6E] text-white border-[#314B6E]'
                      : 'bg-slate-50 dark:bg-[#0E141C] text-slate-700 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border-slate-200 dark:border-[#314B6E]'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-[#8197AC]">الحالة:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] text-xs font-semibold bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9]"
            >
              <option value="all">كافة الحالات</option>
              {WORK_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#8197AC] px-1">
        <div>
          <span>المعروض: </span>
          <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-mono tabular-nums font-bold">{filteredWorks.length}</strong>
          <span> من أصل </span>
          <strong className="text-[#0E141C] dark:text-[#F2EFE9] font-mono tabular-nums font-bold">{works.length}</strong>
          <span> عمل وخدمة قانونية</span>
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-[#314B6E] dark:text-[#BDB3A3] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] font-bold underline"
          >
            مسح نتيجة البحث
          </button>
        )}
      </div>

      {/* Main Content: Table or Cards */}
      {filteredWorks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F2EB] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#BDB3A3] flex items-center justify-center mx-auto border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#0E141C] dark:text-[#F2EFE9]">لا توجد أعمال مطابقة للفلاتر المحددة</h3>
          <p className="text-xs text-slate-500 dark:text-[#8197AC] max-w-md mx-auto">
            يمكنك تسجيل سندات لأمر، عقود، استشارات، ومطالبات جديدة بالنقر على زر إضافة عمل جديد أدناه.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#314B6E] hover:bg-[#243954] text-white shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-[#BDB3A3]" />
            <span>تسجيل عمل قانوني جديد الآن</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#151E2A] rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-[#0E141C] dark:text-[#F2EFE9]">
              <thead className="bg-[#F1F4F8] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-[#314B6E]">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4 w-32">رقم المعاملة</th>
                  <th className="py-3.5 px-4 w-36">نوع العمل</th>
                  <th className="py-3.5 px-4 min-w-[220px]">موضوع وبيان العمل</th>
                  <th className="py-3.5 px-4 w-44">العميل / المستفيد</th>
                  <th className="py-3.5 px-4 w-32">المبلغ / القيمة</th>
                  <th className="py-3.5 px-4 w-40">المحامي المسؤول</th>
                  <th className="py-3.5 px-4 w-48 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>الاستحقاق</span>
                      <span className="text-[10px] text-slate-500 dark:text-[#8197AC]">({tableCalendarMode === 'gregorian' ? 'ميلادي' : 'هجري'})</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 w-28 text-center">الحالة</th>
                  <th className="py-3.5 px-4 w-32 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-[#314B6E]/60">
                {filteredWorks.map((work, index) => {
                  const effectiveCalMode = getEffectiveCalendarMode(work.id);
                  const isHijri = effectiveCalMode === 'hijri';
                  const hijriObj = work.dueDate ? gregorianToHijri(work.dueDate) : null;

                  return (
                    <tr 
                      key={work.id}
                      onClick={() => onViewDetails(work)}
                      className="hover:bg-slate-50/90 dark:hover:bg-[#1C2838] cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold font-mono tabular-nums text-slate-500 dark:text-[#8197AC]">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono tabular-nums font-bold text-[#314B6E] dark:text-[#BDB3A3] bg-[#EEF2F6] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] px-2 py-0.5 rounded text-[11px]">
                          {work.workNumber}
                        </span>
                        {work.priority === 'عاجل' && (
                          <span className="mr-1 inline-block text-[10px] text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 px-1.5 py-0.2 rounded">
                            عاجل
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(work.workType)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] group-hover:text-[#314B6E] dark:group-hover:text-[#BDB3A3] transition">
                          {work.title}
                        </div>
                        {work.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-[#8197AC] line-clamp-1 mt-0.5">
                            {work.notes}
                          </p>
                        )}
                        {Array.isArray(work.documents) && work.documents.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-[#7A6B54] dark:text-[#BDB3A3] font-semibold mt-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{work.documents.length} مستند مرفق</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0E141C] dark:text-[#F2EFE9]">
                          {work.clientName}
                        </div>
                        {work.opponentName && work.opponentName !== '—' && (
                          <div className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5">
                            ضد: {work.opponentName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-[#7A6B54] dark:text-[#BDB3A3]">
                        {formatCurrency(work.amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                          <span>{work.lawyerInCharge}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {work.dueDate ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-lg px-2.5 py-1">
                            <Calendar className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                            <span className="font-mono tabular-nums text-xs font-semibold text-[#0E141C] dark:text-[#F2EFE9]">
                              {isHijri ? (hijriObj?.formattedText || work.dueDateHijri || work.dueDate) : work.dueDate}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleRowCalendarMode(work.id, e)}
                              title={isHijri ? 'عرض بالميلادي' : 'عرض بالهجري (أم القرى)'}
                              className="p-1 hover:bg-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:text-white rounded transition mr-1"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-[#8197AC]/60 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(work.status)}
                      </td>

                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditWork(work)}
                            title="تعديل بيانات العمل"
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E] transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWork(work)}
                            title="حذف العمل القانوني"
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2838] hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 dark:text-[#8197AC] hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#314B6E] hover:border-rose-300 dark:hover:border-rose-500/50 transition"
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

        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorks.map((work) => {
            const effectiveCalMode = getEffectiveCalendarMode(work.id);
            const isHijri = effectiveCalMode === 'hijri';
            const hijriObj = work.dueDate ? gregorianToHijri(work.dueDate) : null;

            return (
              <div
                key={work.id}
                onClick={() => onViewDetails(work)}
                className="bg-white dark:bg-[#151E2A] rounded-2xl border border-slate-200 dark:border-[#314B6E] hover:border-[#314B6E] dark:hover:border-[#BDB3A3] p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-xs bg-[#EEF2F6] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E] px-2 py-0.5 rounded">
                        {work.workNumber}
                      </span>
                      {work.priority === 'عاجل' && (
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 px-1.5 py-0.5 rounded">
                          عاجل
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      {getTypeBadge(work.workType)}
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(work.status)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] line-clamp-2">
                    {work.title}
                  </h4>
                  {work.notes && (
                    <p className="text-xs text-slate-600 dark:text-[#8197AC] line-clamp-2 mt-1.5 bg-slate-50 dark:bg-[#0E141C] p-2 rounded-lg border border-slate-200/70 dark:border-[#314B6E]">
                      {work.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#314B6E] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#8197AC]">الموكل:</span>
                    <strong className="text-[#0E141C] dark:text-[#F2EFE9]">{work.clientName}</strong>
                  </div>

                  {work.opponentName && work.opponentName !== '—' && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#8197AC]">الطرف الآخر:</span>
                      <span className="text-slate-700 dark:text-[#F2EFE9]/90">{work.opponentName}</span>
                    </div>
                  )}

                  {work.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#8197AC]">المبلغ / القيمة:</span>
                      <strong className="text-[#7A6B54] dark:text-[#BDB3A3] font-mono tabular-nums">{formatCurrency(work.amount)}</strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#8197AC]">المحامي المسؤول:</span>
                    <span className="text-[#0E141C] dark:text-[#F2EFE9] font-medium">{work.lawyerInCharge}</span>
                  </div>

                  {work.dueDate && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0E141C] p-2 rounded-lg border border-slate-200 dark:border-[#314B6E]">
                      <span className="text-slate-600 dark:text-[#8197AC] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                        <span>الاستحقاق:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono tabular-nums text-[#0E141C] dark:text-[#F2EFE9]">
                          {isHijri ? (hijriObj?.formattedText || work.dueDateHijri || work.dueDate) : work.dueDate}
                        </strong>
                        <button
                          type="button"
                          onClick={(e) => toggleRowCalendarMode(work.id, e)}
                          title="تبديل هجري / ميلادي"
                          className="p-1 hover:bg-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:text-white rounded transition"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#314B6E]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                    {Array.isArray(work.documents) && work.documents.length > 0 ? (
                      <span className="flex items-center gap-1 text-[#7A6B54] dark:text-[#BDB3A3] font-semibold">
                        <Paperclip className="w-3 h-3" />
                        <span>{work.documents.length} ملف مرفق</span>
                      </span>
                    ) : (
                      'لا توجد مرفقات'
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditWork(work)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-[#1C2838] hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] hover:text-white border border-slate-200 dark:border-[#314B6E] transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWork(work)}
                      className="p-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#1C2838] hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 dark:text-[#8197AC] hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#314B6E] hover:border-rose-300 dark:hover:border-rose-500/50 transition"
                      title="حذف"
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
