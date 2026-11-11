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
  File
} from 'lucide-react';
import { CaseItem, CaseStatus, LegalPleading } from '../types';
import { AuthSession } from '../services/api';

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

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return FileText;
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
      return FileSpreadsheet;
    }
    return FileText;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white print:text-black">
      <div 
        className="bg-white border border-emerald-200 w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Official Law Firm Header with Kayan Logo */}
        <div className="bg-emerald-900 text-white p-5 border-b border-emerald-800 flex flex-wrap items-center justify-between gap-4 print:bg-white print:border-b-2 print:border-emerald-800 print:text-black">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border-2 border-emerald-600 shadow flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/aistudio/image_c88a22bd.png" 
                alt="شعار كيان الإجادة" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white print:text-emerald-950">
                  كيان الإجادة للمحاماة
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-800 text-emerald-100 border border-emerald-700 print:border-emerald-800 print:text-emerald-900">
                  ملف قضية رسمي
                </span>
              </div>
              <p className="text-xs text-emerald-100 print:text-slate-600 font-mono mt-0.5">
                رقم القضية: {caseItem.caseNumber} • المحكمة: {caseItem.court}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>طباعة بطاقة القضية</span>
            </button>

            <button
              onClick={() => onEdit(caseItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <span>تعديل القضية</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Case Main Title Box */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 print:border-slate-300">
            <div>
              <div className="text-xs text-emerald-800 mb-1 font-semibold">موضوع الدعوى:</div>
              <h2 className="text-lg font-bold text-emerald-950 print:text-black">
                {caseItem.title}
              </h2>
            </div>

            {/* Quick Status Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 print:hidden font-medium">الحالة الحالية:</span>
              <select
                value={caseItem.status}
                onChange={handleQuickStatusChange}
                className="bg-white border-2 border-emerald-600 rounded-xl px-3 py-1.5 text-xs text-emerald-900 font-bold focus:outline-none shadow-xs print:border-slate-800 print:text-black"
              >
                <option value="قيد التنفيذ">قيد التنفيذ</option>
                <option value="منتهية">منتهية</option>
                <option value="مؤرشفة">مؤرشفة</option>
                <option value="قيد النظر">قيد النظر</option>
              </select>
            </div>
          </div>

          {/* Parties & Court Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 mb-1 flex items-center gap-1 font-semibold">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>المدعي (الموكل):</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{caseItem.clientName}</div>
              {caseItem.clientPhone && (
                <div className="text-slate-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{caseItem.clientPhone}</span>
                </div>
              )}
              {caseItem.clientIdNumber && (
                <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-1 font-mono">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <span>الهوية/السجل: {caseItem.clientIdNumber}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">المدعى عليه (الخصم):</div>
              <div className="font-bold text-slate-800 text-sm">{caseItem.opponentName || 'بدون خصم مباشر'}</div>
              {caseItem.opponentIdNumber && (
                <div className="text-slate-500 text-[11px] mt-1 font-mono">
                  هوية/سجل: {caseItem.opponentIdNumber}
                </div>
              )}
              {caseItem.opponentLawyer && (
                <div className="text-emerald-800 font-medium text-[11px] mt-1">
                  وكيل الخصم: {caseItem.opponentLawyer}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 mb-1 flex items-center gap-1 font-semibold">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>المحكمة والدائرة:</span>
              </div>
              <div className="font-bold text-slate-900">{caseItem.court}</div>
              <div className="text-emerald-700 font-semibold text-[11px] mt-0.5">{caseItem.circleNumber || 'غير محددة الدائرة'}</div>
              {caseItem.claimAmount && (
                <div className="text-slate-700 font-bold text-[11px] mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                  المطالبة: {caseItem.claimAmount.toLocaleString('ar-SA')} ر.س
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">المحامي المسؤول:</div>
              <div className="font-bold text-slate-900 text-sm">{caseItem.lawyerInCharge || 'إدارة المحاماة'}</div>
              <div className="text-emerald-700 font-semibold text-[11px] mt-0.5">{caseItem.caseType}</div>
              {caseItem.najizUrl && (
                <a
                  href={caseItem.najizUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline print:hidden"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>فتح في ناجز / المستندات</span>
                </a>
              )}
            </div>

          </div>

          {/* Case Facts / Description Box if available */}
          {caseItem.caseDetails && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>وقائع وموضوع الدعوى وملاحظات المكتب:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {caseItem.caseDetails}
              </p>
            </div>
          )}

          {/* Upcoming Hearing Highlight Box */}
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-emerald-900">موعد الجلسة القضائية القادمة:</div>
                  {caseItem.hearingStatus && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800">
                      حالة الجلسة: {caseItem.hearingStatus}
                    </span>
                  )}
                </div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {caseItem.nextHearingDate ? (
                    <span>
                      {caseItem.nextHearingDate} {caseItem.nextHearingTime && `(الساعة ${caseItem.nextHearingTime})`}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-sans font-normal text-xs">لا يوجد موعد جلسة مجدول حالياً</span>
                  )}
                </div>
              </div>
            </div>

            {caseItem.hearingRequirement && (
              <div className="bg-white border border-emerald-200 rounded-lg p-2.5 text-xs text-slate-800 max-w-md shadow-xs">
                <span className="font-bold block text-emerald-800 mb-0.5">المطلوب / أخر إجراء:</span>
                <span>{caseItem.hearingRequirement}</span>
              </div>
            )}
          </div>

          {/* Hearings & Pleadings Timeline Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            
            {/* Action Bar: Add Hearing & Add Pleading Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">سجل الجلسات واللوائح القضائية</h3>
                <p className="text-xs text-slate-500">تدوين وقائع الجلسات والمذكرات وإرفاق ملفات الوورد والإكسيل مع اسم المحامي</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Add Pleading Button (New Feature) */}
                <button
                  onClick={() => {
                    if (!session) {
                      onRequireAuth();
                    } else {
                      setShowPleadingForm(!showPleadingForm);
                      setShowNoteForm(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition shadow-xs active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition shadow-xs active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة جلسة / إجراء</span>
                </button>
              </div>
            </div>

            {/* Sub-Form: Add Legal Pleading with Word / Excel Attachment */}
            {showPleadingForm && (
              <form onSubmit={handleSubmitPleading} className="bg-white p-4 rounded-xl border-2 border-blue-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>إضافة لائحة / مذكرة مع ملف مرفق (Word أو Excel أو مستندات):</span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-semibold">بواسطة المحامي: {session?.employeeName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                      عنوان اللائحة أو المذكرة: <span className="text-blue-700">*</span>
                    </label>
                    <input
                      type="text"
                      value={pleadingTitle}
                      onChange={(e) => setPleadingTitle(e.target.value)}
                      placeholder="مثال: مذكرة جوابية تفصيلية، لائحة استئناف، تقرير محاسبي..."
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1 font-semibold">تاريخ التقديم:</label>
                    <input
                      type="date"
                      value={pleadingDate}
                      onChange={(e) => setPleadingDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">ملخص ووقائع اللائحة:</label>
                  <textarea
                    value={pleadingNotes}
                    onChange={(e) => setPleadingNotes(e.target.value)}
                    placeholder="نبذة عن الدفوع والطلبات المرفقة في اللائحة..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* File Attachment Input (Word, Excel, PDF) */}
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 hover:border-blue-500 rounded-lg text-xs font-bold text-blue-900 transition shadow-2xs hover:shadow-xs">
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>اختر ملف خارجي (Word أو Excel أو PDF)</span>
                      <input
                        type="file"
                        accept=".doc,.docx,.xls,.xlsx,.pdf,.txt,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {attachedFile ? (
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-emerald-300 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800 truncate max-w-[220px]">{attachedFile.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({attachedFile.size})</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold mr-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        يدعم ملفات الوورد (.docx / .doc) والإكسيل (.xlsx / .xls) والمستندات
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPleadingForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPleading}
                    className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmittingPleading ? (
                      <span>جاري حفظ اللائحة...</span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>حفظ اللائحة والمستند</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Note Add Sub-Form */}
            {showNoteForm && (
              <form onSubmit={handleSubmitNote} className="bg-white p-4 rounded-xl border border-emerald-300 shadow-xs space-y-3">
                <div className="font-bold text-xs text-emerald-900">تدوين وقائع جلسة جديدة:</div>
                
                <div>
                  <textarea
                    value={noteSummary}
                    onChange={(e) => setNoteSummary(e.target.value)}
                    placeholder="ما الذي دار في الجلسة؟ (مثال: حضر المحامي وقدم مذكرة جوابية وطلب القاضي إرفاق العقد الأصلي)..."
                    rows={3}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">المطلوب للجلسة القادمة:</label>
                    <input
                      type="text"
                      value={noteRequirement}
                      onChange={(e) => setNoteRequirement(e.target.value)}
                      placeholder="تقديم مذكرة رد..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">تاريخ الجلسة القادمة:</label>
                    <input
                      type="date"
                      value={newHearingDate}
                      onChange={(e) => setNewHearingDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">وقت الجلسة القادمة:</label>
                    <input
                      type="time"
                      value={newHearingTime}
                      onChange={(e) => setNewHearingTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNoteForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
                  >
                    {isSubmittingNote ? 'جاري الحفظ...' : 'حفظ وقائع الجلسة'}
                  </button>
                </div>
              </form>
            )}

            {/* Pleadings List (If Any) */}
            {caseItem.pleadings && caseItem.pleadings.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>اللوائح والمذكرات والمستندات المرفوعة ({caseItem.pleadings.length}):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caseItem.pleadings.map((p) => {
                    const FileIcon = getFileIcon(p.fileName);
                    return (
                      <div key={p.id} className="bg-white border border-blue-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{p.title}</h4>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>المحامي: <strong className="text-slate-700">{p.lawyerName}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{p.date}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            لائحة رسمية
                          </span>
                        </div>

                        {p.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {p.notes}
                          </p>
                        )}

                        {/* File Download Button */}
                        {p.fileName && p.fileDataUrl ? (
                          <div className="pt-1">
                            <a
                              href={p.fileDataUrl}
                              download={p.fileName}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95"
                            >
                              <FileIcon className="w-4 h-4 text-blue-700" />
                              <span className="truncate max-w-[170px]">{p.fileName}</span>
                              <Download className="w-3.5 h-3.5 text-blue-600 mr-1" />
                            </a>
                            {p.fileSize && (
                              <span className="text-[10px] text-slate-400 mr-2 font-mono">{p.fileSize}</span>
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
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>وقائع الجلسات والمحاضر:</span>
              </div>

              {(!caseItem.notesHistory || caseItem.notesHistory.length === 0) ? (
                <div className="py-5 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  لا توجد جلسات أو وقائع مدونة بعد لهذه القضية.
                </div>
              ) : (
                <div className="relative border-r-2 border-emerald-200 pr-5 space-y-4">
                  {caseItem.notesHistory.map((note) => (
                    <div key={note.id} className="relative">
                      <div className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                      
                      <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1.5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 border-b border-slate-100 pb-1.5">
                          <span className="font-mono text-emerald-800 font-bold">{note.date}</span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <User className="w-3 h-3 text-emerald-700" />
                            <span>المحامي المدون: <strong>{note.employeeName}</strong></span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-800 leading-relaxed pt-1">
                          {note.summary}
                        </div>

                        {note.requirement && (
                          <div className="bg-emerald-50 p-2 rounded text-[11px] text-emerald-900 border border-emerald-200">
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
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            <div>
              تم قيد الدعوى بواسطة المحامي: <strong className="text-slate-800">{caseItem.createdByName}</strong> في {new Date(caseItem.createdAt).toLocaleDateString('ar-SA')}
            </div>
            <div>
              آخر تعديل بواسطة المحامي: <strong className="text-emerald-800 font-bold">{caseItem.lastModifiedByName}</strong> في {new Date(caseItem.lastModifiedAt).toLocaleString('ar-SA')}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3 px-6 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <img src="/assets/aistudio/image_c88a22bd.png" alt="شعار كيان" className="w-4 h-4 object-contain" />
            <span>كيان الإجادة للمحاماة • نظام المتابعة القضائية المحمي</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs transition font-semibold"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
