import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  Building, 
  PlusCircle, 
  Printer, 
  ExternalLink,
  FileText,
  CreditCard,
  FileSpreadsheet,
  Download,
  Paperclip,
  Upload,
  CheckCircle2,
  File,
  ArrowLeftRight
} from 'lucide-react';
import { CaseItem, CaseStatus, LegalPleading } from '../types';
import { AuthSession } from '../services/api';
import { gregorianToHijri, formatGregorian } from '../utils/dateUtils';

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CaseItem | null;
  onEdit: (item: CaseItem) => void;
  onAddNote: (
    caseId: string, 
    note: { summary: string; requirement?: string; nextHearingDate?: string; nextHearingTime?: string }
  ) => Promise<void>;
  onAddPleading?: (
    caseId: string,
    pleading: {
      title: string;
      date?: string;
      notes?: string;
      fileName?: string;
      fileSize?: string;
      fileType?: string;
      fileDataUrl?: string;
    }
  ) => Promise<void>;
  onStatusChange: (caseId: string, status: CaseStatus) => Promise<void>;
  onRulingChange?: (caseId: string, rulingClassification: string) => Promise<void>;
  session: AuthSession | null;
  onRequireAuth: () => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onEdit,
  onAddNote,
  onAddPleading,
  onStatusChange,
  onRulingChange,
  session,
  onRequireAuth,
}) => {
  // Session Notes Form State
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteSummary, setNoteSummary] = useState('');
  const [noteRequirement, setNoteRequirement] = useState('');
  const [newHearingDate, setNewHearingDate] = useState('');
  const [newHearingTime, setNewHearingTime] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Pleadings Form State
  const [showPleadingForm, setShowPleadingForm] = useState(false);
  const [pleadingTitle, setPleadingTitle] = useState('');
  const [pleadingDate, setPleadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [pleadingNotes, setPleadingNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isSubmittingPleading, setIsSubmittingPleading] = useState(false);

  // Calendar display toggle (Hijri vs Gregorian)
  const [detailsCalendarMode, setDetailsCalendarMode] = useState<'gregorian' | 'hijri'>('gregorian');

  if (!isOpen || !caseItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      onRequireAuth();
      return;
    }
    if (!noteSummary.trim()) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(caseItem.id, {
        summary: noteSummary.trim(),
        requirement: noteRequirement.trim() || undefined,
        nextHearingDate: newHearingDate || undefined,
        nextHearingTime: newHearingTime || undefined,
      });
      setNoteSummary('');
      setNoteRequirement('');
      setNewHearingDate('');
      setNewHearingTime('');
      setShowNoteForm(false);
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الجلسة');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} ميجابايت`
      : `${sizeInKb} كيلوبايت`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: sizeStr,
        type: file.type || file.name.split('.').pop() || '',
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPleading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      onRequireAuth();
      return;
    }
    if (!pleadingTitle.trim()) return;

    if (!onAddPleading) {
      alert('خاصية إضافة اللائحة غير مهيأة');
      return;
    }

    setIsSubmittingPleading(true);
    try {
      await onAddPleading(caseItem.id, {
        title: pleadingTitle.trim(),
        date: pleadingDate || new Date().toISOString().split('T')[0],
        notes: pleadingNotes.trim() || undefined,
        fileName: attachedFile?.name,
        fileSize: attachedFile?.size,
        fileType: attachedFile?.type,
        fileDataUrl: attachedFile?.dataUrl,
      });

      setPleadingTitle('');
      setPleadingNotes('');
      setAttachedFile(null);
      setShowPleadingForm(false);
    } catch (err: any) {
      alert(err.message || 'فشل إضافة اللائحة');
    } finally {
      setIsSubmittingPleading(false);
    }
  };

  const handleQuickStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as CaseStatus;
    if (!session) {
      onRequireAuth();
      return;
    }
    try {
      await onStatusChange(caseItem.id, newStatus);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الحالة');
    }
  };

  const handleQuickRulingChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRuling = e.target.value;
    if (!session) {
      onRequireAuth();
      return;
    }
    if (!onRulingChange) return;
    try {
      await onRulingChange(caseItem.id, newRuling);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث تصنيف الحكم');
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return FileText;
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
      return FileSpreadsheet;
    }
    return FileText;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white print:text-black">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0E141C] dark:text-[#F2EFE9] print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Official Law Firm Header with Kayan Logo */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] p-5 border-b border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-4 print:bg-white print:border-b-2 print:border-slate-800 print:text-black">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] p-1 border-2 border-[#BDB3A3] dark:border-[#BDB3A3]/60 shadow-xs flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/aistudio/image_c88a22bd.png" 
                alt="شعار كيان الإجادة" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#0E141C] dark:text-[#F2EFE9] print:text-black">
                  كيان الإجادة للمحاماة
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2F6] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#BDB3A3] border border-[#314B6E]/25 dark:border-[#314B6E] print:border-slate-800 print:text-black print:bg-white">
                  ملف قضية رسمي
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#8197AC] print:text-slate-600 font-mono mt-0.5">
                رقم القضية: {caseItem.caseNumber} • المحكمة: {caseItem.court}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] text-xs font-bold border border-slate-300 dark:border-[#314B6E] transition shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>طباعة بطاقة القضية</span>
            </button>

            <button
              onClick={() => onEdit(caseItem)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#314B6E] hover:bg-[#243954] text-white text-xs font-black transition shadow-xs"
            >
              <span>تعديل القضية</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-200/70 dark:hover:bg-[#1C2838] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Case Main Title Box */}
          <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-3 print:bg-white print:border-slate-300">
            <div>
              <div className="text-xs text-[#7A6B54] dark:text-[#BDB3A3] mb-1 font-semibold print:text-slate-600">موضوع الدعوى:</div>
              <h2 className="text-lg font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">
                {caseItem.title}
              </h2>
            </div>

            {/* Quick Status & Ruling Classification Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-[#8197AC] print:hidden font-medium">الحالة الحالية:</span>
                <select
                  value={caseItem.status}
                  onChange={handleQuickStatusChange}
                  className="bg-white dark:bg-[#151E2A] border-2 border-[#314B6E]/40 dark:border-[#314B6E] rounded-xl px-3 py-1.5 text-xs text-[#314B6E] dark:text-[#BDB3A3] font-bold focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] shadow-2xs print:bg-white print:border-slate-800 print:text-black"
                >
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                  <option value="منتهية">منتهية</option>
                  <option value="مؤرشفة">مؤرشفة</option>
                  <option value="قيد النظر">قيد النظر</option>
                </select>
              </div>

              {onRulingChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-[#8197AC] print:hidden font-medium">تصنيف الحكم:</span>
                  <select
                    value={caseItem.rulingClassification || ''}
                    onChange={handleQuickRulingChange}
                    className="bg-[#F6F2EB] dark:bg-[#1C2838] border-2 border-[#BDB3A3] dark:border-[#BDB3A3]/60 rounded-xl px-3 py-1.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-bold focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] shadow-2xs print:bg-white print:border-slate-800 print:text-black"
                  >
                    <option value="">بدون تصنيف حكم</option>
                    <option value="حكم ابتدائي">حكم ابتدائي</option>
                    <option value="استئناف أو الأحكام النهائية">استئناف أو الأحكام النهائية</option>
                    <option value="تنفيذ أحكام">تنفيذ أحكام</option>
                    <option value="قضية مؤرشفة">قضية مؤرشفة</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Parties & Court Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            
            <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
              <div className="text-slate-500 dark:text-[#8197AC] mb-1 flex items-center gap-1 font-semibold print:text-slate-600">
                <User className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                <span>المدعي (الموكل):</span>
              </div>
              <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm print:text-black">{caseItem.clientName}</div>
              {caseItem.clientPhone && (
                <div className="text-slate-600 dark:text-[#8197AC] mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#607EA2] dark:text-[#8197AC]" />
                  <span className="font-mono">{caseItem.clientPhone}</span>
                </div>
              )}
              {caseItem.clientIdNumber && (
                <div className="text-slate-500 dark:text-[#8197AC] text-[11px] mt-1 flex items-center gap-1 font-mono">
                  <CreditCard className="w-3 h-3 text-[#607EA2] dark:text-[#8197AC]" />
                  <span>الهوية/السجل: {caseItem.clientIdNumber}</span>
                </div>
              )}
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
              <div className="text-slate-500 dark:text-[#8197AC] mb-1 font-semibold print:text-slate-600">المدعى عليه (الخصم):</div>
              <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm print:text-black">{caseItem.opponentName || 'بدون خصم مباشر'}</div>
              {caseItem.opponentIdNumber && (
                <div className="text-slate-500 dark:text-[#8197AC] text-[11px] mt-1 font-mono">
                  هوية/سجل: {caseItem.opponentIdNumber}
                </div>
              )}
              {caseItem.opponentLawyer && (
                <div className="text-[#7A6B54] dark:text-[#BDB3A3] font-medium text-[11px] mt-1">
                  وكيل الخصم: {caseItem.opponentLawyer}
                </div>
              )}
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
              <div className="text-slate-500 dark:text-[#8197AC] mb-1 flex items-center gap-1 font-semibold print:text-slate-600">
                <Building className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                <span>المحكمة والدائرة:</span>
              </div>
              <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{caseItem.court}</div>
              <div className="text-[#7A6B54] dark:text-[#BDB3A3] font-semibold text-[11px] mt-0.5 print:text-slate-700">{caseItem.circleNumber || 'غير محددة الدائرة'}</div>
              {caseItem.claimAmount && (
                <div className="text-[#7A6B54] dark:text-[#BDB3A3] font-bold text-[11px] mt-1 bg-[#F6F2EB] dark:bg-[#1C2838] px-2 py-0.5 rounded border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50 font-mono print:bg-white print:text-black">
                  المطالبة: {caseItem.claimAmount.toLocaleString('ar-SA')} ر.س
                </div>
              )}
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
              <div className="text-slate-500 dark:text-[#8197AC] mb-1 font-semibold print:text-slate-600">المحامي المسؤول:</div>
              <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm print:text-black">{caseItem.lawyerInCharge || 'إدارة المحاماة'}</div>
              <div className="text-[#314B6E] dark:text-[#BDB3A3] font-semibold text-[11px] mt-0.5 print:text-slate-700">{caseItem.caseType}</div>
              {caseItem.najizUrl && (
                <a
                  href={caseItem.najizUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#314B6E] dark:text-[#BDB3A3] hover:text-[#243954] dark:hover:text-[#F2EFE9] font-bold underline print:hidden"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>فتح في ناجز / المستندات</span>
                </a>
              )}
            </div>

          </div>

          {/* Case Facts / Description Box if available */}
          {caseItem.caseDetails && (
            <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] space-y-1.5 shadow-2xs print:bg-white print:border-slate-300">
              <div className="text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] flex items-center gap-1.5 print:text-black">
                <FileText className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                <span>وقائع وموضوع الدعوى وملاحظات المكتب:</span>
              </div>
              <p className="text-xs text-[#0E141C]/90 dark:text-[#F2EFE9]/90 leading-relaxed whitespace-pre-wrap print:text-black">
                {caseItem.caseDetails}
              </p>
            </div>
          )}

          {/* Upcoming Hearing Highlight Box (with interactive Hijri/Gregorian converter) */}
          <div className="bg-[#EEF2F6] dark:bg-[#1C2838] p-4 rounded-xl border border-[#314B6E]/25 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-3 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#314B6E] border border-[#243954] text-[#BDB3A3] flex items-center justify-center flex-shrink-0 print:border-slate-400 print:text-black print:bg-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">موعد الجلسة القضائية القادمة:</div>
                  {caseItem.hearingStatus && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] print:bg-white print:text-black print:border-slate-400">
                      حالة الجلسة: {caseItem.hearingStatus}
                    </span>
                  )}
                </div>

                {caseItem.nextHearingDate ? (() => {
                  const isHijri = detailsCalendarMode === 'hijri';
                  const hijriObj = gregorianToHijri(caseItem.nextHearingDate);
                  const gregObj = formatGregorian(caseItem.nextHearingDate);

                  const primaryDateText = isHijri
                    ? (hijriObj?.formattedFull || caseItem.nextHearingDateHijri || caseItem.nextHearingDate)
                    : (gregObj?.formattedFull || caseItem.nextHearingDate);

                  return (
                    <div className="mt-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-[#0E141C] dark:text-[#F2EFE9] print:text-black">
                          {primaryDateText}
                        </span>
                        <span className="bg-[#F6F2EB] dark:bg-[#151E2A] text-[#7A6B54] dark:text-[#BDB3A3] font-bold text-[10px] px-1.5 py-0.5 rounded border border-[#BDB3A3] dark:border-[#BDB3A3]/60 print:bg-white print:text-black print:border-slate-400">
                          {isHijri ? 'تقويم هجري' : 'تقويم ميلادي'}
                        </span>
                        {caseItem.nextHearingTime && (
                          <span className="text-xs font-bold text-[#314B6E] dark:text-[#F2EFE9] font-mono bg-white dark:bg-[#151E2A] px-2 py-0.5 rounded border border-slate-300 dark:border-[#314B6E] print:bg-white print:text-black">
                            الساعة {caseItem.nextHearingTime}
                          </span>
                        )}

                        {/* Interactive Converter Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setDetailsCalendarMode(isHijri ? 'gregorian' : 'hijri')}
                          title={isHijri ? 'التحويل إلى التاريخ الميلادي' : 'التحويل إلى التاريخ الهجري (أم القرى)'}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#151E2A] hover:bg-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] hover:text-white border border-[#314B6E]/30 dark:border-[#314B6E] text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95 print:hidden"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>{isHijri ? 'تحويل للميلادي' : 'تحويل للهجري'}</span>
                        </button>
                      </div>

                      {/* Secondary Counterpart Display */}
                      <div className="text-xs text-slate-600 dark:text-[#8197AC] font-medium print:text-slate-700">
                        {isHijri ? (
                          <span>الموافق بالتقويم الميلادي: <strong className="font-mono text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{caseItem.nextHearingDate} م</strong> ({gregObj?.formattedText})</span>
                        ) : hijriObj ? (
                          <span>الموافق بالتقويم الهجري: <strong className="text-[#7A6B54] dark:text-[#BDB3A3] font-bold print:text-black">{hijriObj.formattedFull}</strong></span>
                        ) : null}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-slate-500 dark:text-[#8197AC] font-sans font-normal text-xs mt-1">
                    لا يوجد موعد جلسة مجدول حالياً
                  </div>
                )}
              </div>
            </div>

            {caseItem.hearingRequirement && (
              <div className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] rounded-lg p-2.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] max-w-md shadow-xs print:bg-white print:text-black print:border-slate-300">
                <span className="font-bold block text-[#314B6E] dark:text-[#BDB3A3] mb-0.5 print:text-black">المطلوب / أخر إجراء:</span>
                <span>{caseItem.hearingRequirement}</span>
              </div>
            )}
          </div>

          {/* Hearings & Pleadings Timeline Section */}
          <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] space-y-4 print:bg-white print:border-slate-300">
            
            {/* Action Bar: Add Hearing & Add Pleading Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm print:text-black">سجل الجلسات واللوائح القضائية</h3>
                <p className="text-xs text-slate-500 dark:text-[#8197AC] print:text-slate-600">تدوين وقائع الجلسات والمذكرات وإرفاق ملفات الوورد والإكسيل مع اسم المحامي</p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                {/* Add Pleading Button */}
                <button
                  onClick={() => {
                    if (!session) {
                      onRequireAuth();
                    } else {
                      setShowPleadingForm(!showPleadingForm);
                      setShowNoteForm(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 font-bold text-xs transition shadow-2xs active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                  <span>إضافة لائحة</span>
                </button>

                {/* Add Hearing Button */}
                <button
                  onClick={() => {
                    if (!session) {
                      onRequireAuth();
                    } else {
                      setShowNoteForm(!showNoteForm);
                      setShowPleadingForm(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#314B6E] hover:bg-[#243954] text-white font-black text-xs transition shadow-xs active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#BDB3A3]" />
                  <span>إضافة جلسة / إجراء</span>
                </button>
              </div>
            </div>

            {/* Sub-Form: Add Legal Pleading with Word / Excel Attachment */}
            {showPleadingForm && (
              <form onSubmit={handleSubmitPleading} className="bg-white dark:bg-[#151E2A] p-4 rounded-xl border-2 border-[#314B6E]/40 dark:border-[#314B6E] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#314B6E] pb-2">
                  <div className="font-bold text-xs text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                    <span>إضافة لائحة / مذكرة مع ملف مرفق (Word أو Excel أو مستندات):</span>
                  </div>
                  <span className="text-[11px] text-[#7A6B54] dark:text-[#BDB3A3] font-semibold">بواسطة المحامي: {session?.employeeName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-600 dark:text-[#8197AC] block mb-1 font-semibold">
                      عنوان اللائحة أو المذكرة: <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={pleadingTitle}
                      onChange={(e) => setPleadingTitle(e.target.value)}
                      placeholder="مثال: مذكرة جوابية تفصيلية، لائحة استئناف، تقرير محاسبي..."
                      required
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-[#8197AC] block mb-1 font-semibold">تاريخ التقديم:</label>
                    <input
                      type="date"
                      value={pleadingDate}
                      onChange={(e) => setPleadingDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 dark:text-[#8197AC] block mb-1 font-semibold">ملخص ووقائع اللائحة:</label>
                  <textarea
                    value={pleadingNotes}
                    onChange={(e) => setPleadingNotes(e.target.value)}
                    placeholder="نبذة عن الدفوع والطلبات المرفقة في اللائحة..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] leading-relaxed"
                  />
                </div>

                {/* File Attachment Input (Word, Excel, PDF) */}
                <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3 rounded-xl border border-slate-200 dark:border-[#314B6E]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#314B6E] hover:bg-[#243954] border border-[#243954] rounded-lg text-xs font-bold text-white transition shadow-2xs">
                      <Upload className="w-4 h-4 text-[#BDB3A3]" />
                      <span>اختر ملف خارجي (Word أو Excel أو PDF)</span>
                      <input
                        type="file"
                        accept=".doc,.docx,.xls,.xlsx,.pdf,.txt,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {attachedFile ? (
                      <div className="flex items-center gap-2 bg-white dark:bg-[#151E2A] px-3 py-1 rounded-lg border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-[#0E141C] dark:text-[#F2EFE9] truncate max-w-[220px]">{attachedFile.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-[#8197AC] font-mono">({attachedFile.size})</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-[11px] font-bold mr-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                        يدعم ملفات الوورد (.docx / .doc) والإكسيل (.xlsx / .xls) والمستندات
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-[#314B6E]">
                  <button
                    type="button"
                    onClick={() => setShowPleadingForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPleading}
                    className="px-5 py-2 rounded-xl bg-[#314B6E] hover:bg-[#243954] text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmittingPleading ? (
                      <span>جاري حفظ اللائحة...</span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-[#BDB3A3]" />
                        <span>حفظ اللائحة والمستند</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Note Add Sub-Form */}
            {showNoteForm && (
              <form onSubmit={handleSubmitNote} className="bg-white dark:bg-[#151E2A] p-4 rounded-xl border border-[#314B6E]/40 dark:border-[#314B6E] shadow-xs space-y-3">
                <div className="font-bold text-xs text-[#314B6E] dark:text-[#BDB3A3]">تدوين وقائع جلسة جديدة:</div>
                
                <div>
                  <textarea
                    value={noteSummary}
                    onChange={(e) => setNoteSummary(e.target.value)}
                    placeholder="ما الذي دار في الجلسة؟ (مثال: حضر المحامي وقدم مذكرة جوابية وطلب القاضي إرفاق العقد الأصلي)..."
                    rows={3}
                    required
                    className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-semibold">المطلوب للجلسة القادمة:</label>
                    <input
                      type="text"
                      value={noteRequirement}
                      onChange={(e) => setNoteRequirement(e.target.value)}
                      placeholder="تقديم مذكرة رد..."
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-semibold">تاريخ الجلسة القادمة:</label>
                    <input
                      type="date"
                      value={newHearingDate}
                      onChange={(e) => setNewHearingDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono"
                    />
                    {newHearingDate && (
                      <div className="text-[10px] text-[#7A6B54] dark:text-[#BDB3A3] font-semibold mt-1 bg-[#F6F2EB] dark:bg-[#1C2838] px-1.5 py-0.5 rounded border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50 truncate">
                        هجري: {gregorianToHijri(newHearingDate)?.formattedText || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-semibold">وقت الجلسة القادمة:</label>
                    <input
                      type="time"
                      value={newHearingTime}
                      onChange={(e) => setNewHearingTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNoteForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-1.5 rounded-lg bg-[#314B6E] text-white font-black text-xs hover:bg-[#243954] transition"
                  >
                    {isSubmittingNote ? 'جاري الحفظ...' : 'حفظ وقائع الجلسة'}
                  </button>
                </div>
              </form>
            )}

            {/* Pleadings List (If Any) */}
            {caseItem.pleadings && caseItem.pleadings.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] flex items-center gap-1.5 print:text-black">
                  <FileText className="w-4 h-4 text-[#607EA2] dark:text-[#BDB3A3] print:text-black" />
                  <span>اللوائح والمذكرات والمستندات المرفوعة ({caseItem.pleadings.length}):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caseItem.pleadings.map((p) => {
                    const FileIcon = getFileIcon(p.fileName);
                    return (
                      <div key={p.id} className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] rounded-xl p-3.5 space-y-2 shadow-2xs print:bg-white print:border-slate-300">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-[#314B6E] pb-2">
                          <div>
                            <h4 className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-xs print:text-black">{p.title}</h4>
                            <div className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5 flex items-center gap-1.5">
                              <span>المحامي: <strong className="text-[#314B6E] dark:text-[#BDB3A3] print:text-black">{p.lawyerName}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-slate-500 dark:text-[#8197AC]">{p.date}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2F6] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#BDB3A3] border border-[#314B6E]/25 dark:border-[#314B6E] print:bg-white print:text-black">
                            لائحة رسمية
                          </span>
                        </div>

                        {p.notes && (
                          <p className="text-xs text-slate-600 dark:text-[#8197AC] leading-relaxed print:text-slate-700">
                            {p.notes}
                          </p>
                        )}

                        {/* File Download Button */}
                        {p.fileName && p.fileDataUrl ? (
                          <div className="pt-1">
                            <a
                              href={p.fileDataUrl}
                              download={p.fileName}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95"
                            >
                              <FileIcon className="w-4 h-4 text-[#7A6B54] dark:text-[#BDB3A3]" />
                              <span className="truncate max-w-[170px]">{p.fileName}</span>
                              <Download className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3] mr-1" />
                            </a>
                            {p.fileSize && (
                              <span className="text-[10px] text-slate-500 dark:text-[#8197AC] mr-2 font-mono">{p.fileSize}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="pt-2">
              <div className="text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] flex items-center gap-1.5 mb-3 print:text-black">
                <Calendar className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                <span>وقائع الجلسات والمحاضر:</span>
              </div>

              {(!caseItem.notesHistory || caseItem.notesHistory.length === 0) ? (
                <div className="py-5 text-center text-xs text-slate-500 dark:text-[#8197AC] bg-white dark:bg-[#151E2A] rounded-xl border border-slate-200 dark:border-[#314B6E]">
                  لا توجد جلسات أو وقائع مدونة بعد لهذه القضية.
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-200 dark:border-[#314B6E] pr-5 space-y-4">
                  {caseItem.notesHistory.map((note) => (
                    <div key={note.id} className="relative">
                      <div className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#314B6E] dark:bg-[#BDB3A3] border-2 border-white dark:border-[#151E2A] shadow-xs" />
                      
                      <div className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] p-3.5 rounded-xl space-y-1.5 shadow-xs print:bg-white print:border-slate-300">
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#8197AC] gap-2 border-b border-slate-200 dark:border-[#314B6E] pb-1.5">
                          <span className="font-mono text-[#7A6B54] dark:text-[#BDB3A3] font-bold print:text-black">{note.date}</span>
                          <span className="flex items-center gap-1 text-slate-500 dark:text-[#8197AC]">
                            <User className="w-3 h-3 text-[#314B6E] dark:text-[#BDB3A3]" />
                            <span>المحامي المدون: <strong className="text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{note.employeeName}</strong></span>
                          </span>
                        </div>

                        <div className="text-xs text-[#0E141C] dark:text-[#F2EFE9] leading-relaxed pt-1 print:text-black">
                          {note.summary}
                        </div>

                        {note.requirement && (
                          <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-2 rounded text-[11px] text-[#314B6E] dark:text-[#BDB3A3] border border-slate-200 dark:border-[#314B6E] print:bg-white print:text-black">
                            <strong>المطلوب:</strong> {note.requirement}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Audit trail footnote */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#8197AC] pt-2 border-t border-slate-200 dark:border-[#314B6E]">
            <div>
              تم قيد الدعوى بواسطة المحامي: <strong className="text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{caseItem.createdByName}</strong> في {new Date(caseItem.createdAt).toLocaleDateString('ar-SA')}
            </div>
            <div>
              آخر تعديل بواسطة المحامي: <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-bold print:text-black">{caseItem.lastModifiedByName}</strong> في {new Date(caseItem.lastModifiedAt).toLocaleString('ar-SA')}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3 px-6 border-t border-slate-200 dark:border-[#314B6E] flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-600 dark:text-[#8197AC] flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 p-0.5 flex items-center justify-center">
              <img src="/assets/aistudio/image_c88a22bd.png" alt="شعار كيان" className="w-full h-full object-contain" />
            </span>
            <span>كيان الإجادة للمحاماة • نظام المتابعة القضائية المحمي</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] text-xs transition font-semibold"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
