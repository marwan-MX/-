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
  Check
} from 'lucide-react';
import { CaseItem, CaseStatus } from '../types';
import { AuthSession } from '../services/api';
import { exportToExcel, exportToWord } from '../utils/exportUtils';

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportToast, setExportToast] = useState<string | null>(null);

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

      return matchesSearch && matchesStatusDropdown && matchesCategory && matchesStatusFilter;
    });
  }, [cases, searchTerm, selectedStatus, selectedType, activeFilter]);

  // Status badge styling in green/white palette
  const getStatusBadge = (status: CaseStatus | string) => {
    switch (status) {
      case 'قيد النظر':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'قيد التنفيذ':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'بانتظار الاعتماد':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'منتهية':
        return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold';
      case 'مؤرشفة':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم القضية، الموكل، الخصم، المحكمة، أو المحامي..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter (الحالات) */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
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
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="all">كافة التصنيفات</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Export Actions (Excel & Word) */}
          <div className="flex items-center gap-1.5 sm:border-r sm:border-slate-200 sm:pr-2">
            <button
              onClick={handleExportExcel}
              title="استخراج جدول القضايا كملف Excel (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handleExportWord}
              title="استخراج جدول القضايا كملف Word (.doc)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>تصدير Word</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض الجدول"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'cards' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{exportToast}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-normal">تم التنزيل مباشرة بصيغة متوافقة</span>
        </div>
      )}

      {/* Results Count & Reset Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <div>
          يتم عرض <strong className="text-emerald-800 font-mono font-bold">{filteredCases.length}</strong> قضية من إجمالي{' '}
          <strong className="text-slate-800 font-mono font-bold">{cases.length}</strong>
        </div>

        {(searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || activeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedType('all');
              onFilterChange('all');
            }}
            className="text-emerald-700 hover:text-emerald-900 underline font-bold"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      {/* Main View: Table or Cards */}
      {filteredCases.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا توجد قضايا مطابقة للبحث أو التصفية</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك مسح البحث أو تغيير المعايير لعرض باقي ملفات القضايا المسجلة، أو تسجيل قضية جديدة.
          </p>
          {onOpenAddModal && (
            <div className="pt-2">
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة ملف قضية جديدة الآن</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-emerald-50/80 text-emerald-950 font-bold border-b border-emerald-200">
                <tr>
                  <th className="py-3.5 px-4 w-32">رقم القضية</th>
                  <th className="py-3.5 px-4">موضوع القضية</th>
                  <th className="py-3.5 px-4 w-44">أطراف الدعوى (الموكل / الخصم)</th>
                  <th className="py-3.5 px-4 w-40">المحكمة والدائرة</th>
                  <th className="py-3.5 px-4 w-32">الحالة</th>
                  <th className="py-3.5 px-4 w-40">الجلسة القادمة</th>
                  <th className="py-3.5 px-4 w-28 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((item) => {
                  const countdown = getHearingCountdown(item.nextHearingDate);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-emerald-50/40 transition cursor-pointer group"
                      onClick={() => onViewDetails(item)}
                    >
                      {/* Case Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {item.caseNumber}
                      </td>

                      {/* Title & Lawyer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition text-sm">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>المحامي:</span>
                          <span className="text-slate-700 font-semibold">{item.lawyerInCharge || 'إدارة المحاماة'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">التصنيف: {item.caseType}</span>
                        </div>
                      </td>

                      {/* Parties */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.clientName}
                          <span className="text-[10px] text-emerald-700 font-bold mr-1">({item.clientType || 'مدعي'})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                          ضد: {item.opponentName || 'بدون خصم'}
                        </div>
                      </td>

                      {/* Court */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-800">{item.court}</div>
                        <div className="text-[11px] text-slate-500">{item.circleNumber || '—'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Next Hearing */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.nextHearingDate ? (
                          <div>
                            <div className="font-mono text-slate-900 font-bold flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{item.nextHearingDate}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {countdown && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  countdown.alert 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                    : 'text-slate-500 bg-slate-100'
                                }`}>
                                  {countdown.text}
                                </span>
                              )}
                              {item.nextHearingTime && (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {item.nextHearingTime}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">لا يوجد موعد</span>
                        )}
                      </td>

                      {/* Action Buttons (Strictly Protected) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Quick Hearing Note */}
                          <button
                            onClick={() => onAddHearing(item)}
                            title="إضافة جلسة أو مذكرة جديدة (محمي)"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Case */}
                          <button
                            onClick={() => onEditCase(item)}
                            title="تعديل بيانات القضية (محمي بكلمة مرور المحامي)"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Case */}
                          <button
                            onClick={() => onDeleteCase(item)}
                            title="حذف القضية نهائياً (محمي بكلمة مرور)"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition shadow-xs"
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
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 transition shadow-xs hover:shadow-md flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar in Card */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.caseNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition line-clamp-2 mb-3">
                    {item.title}
                  </h3>

                  {/* Parties */}
                  <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الموكل:</span>
                      <span className="font-semibold text-slate-900">{item.clientName}</span>
                    </div>
                    {item.opponentName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">الخصم:</span>
                        <span className="text-slate-800">{item.opponentName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المحكمة:</span>
                      <span className="text-emerald-800 font-medium truncate max-w-[160px]">{item.court}</span>
                    </div>
                  </div>

                  {/* Upcoming Hearing */}
                  {item.nextHearingDate && (
                    <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-xs flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.nextHearingDate}</span>
                      </div>
                      {countdown && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          countdown.alert ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'text-slate-600 bg-white'
                        }`}>
                          {countdown.text}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div 
                  className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-slate-500">
                    بواسطة: {item.lastModifiedByName || item.createdByName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddHearing(item)}
                      title="إضافة جلسة"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditCase(item)}
                      title="تعديل القضية"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCase(item)}
                      title="حذف القضية"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200"
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
