import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  DollarSign, 
  FileText, 
  Paperclip, 
  Download, 
  Plus, 
  Printer, 
  Edit3, 
  Shield, 
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { LegalWorkItem, LegalWorkStatus, LegalPleading } from '../types';
import { AuthSession } from '../services/api';
import { gregorianToHijri, formatGregorian } from '../utils/dateUtils';

interface LegalWorkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: LegalWorkItem | null;
  onEdit: (work: LegalWorkItem) => void;
  onAddDocument: (workId: string, documentData: {
    title: string;
    date?: string;
    notes?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    fileDataUrl?: string;
  }) => Promise<void>;
  onStatusChange: (workId: string, status: LegalWorkStatus) => Promise<void>;
  session: AuthSession | null;
  onRequireAuth: () => void;
}

const WORK_STATUSES: LegalWorkStatus[] = [
  'قيد التنفيذ',
  'منجز',
  'معلق',
  'بانتظار العميل',
  'مؤرشف',
];

export const LegalWorkDetailsModal: React.FC<LegalWorkDetailsModalProps> = ({
  isOpen,
  onClose,
  work,
  onEdit,
  onAddDocument,
  onStatusChange,
  session,
  onRequireAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [isCalendarHijri, setIsCalendarHijri] = useState(false);

  // Add document sub-form
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  if (!isOpen || !work) return null;

  const hijriObj = work.dueDate ? gregorianToHijri(work.dueDate) : null;

  const formatCurrency = (val?: number) => {
    if (!val) return '—';
    return `${Number(val).toLocaleString('ar-SA')} ر.س`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setDocError('حجم الملف كبير جداً، الحد الأقصى المسموح 20 ميجابايت');
      return;
    }

    const sizeFormatted = (file.size / 1024).toFixed(1) + ' كيلوبايت';
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result as string,
      });
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setDocError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setDocError('عنوان أو وصف المستند مطلوب');
      return;
    }

    if (!session) {
      onRequireAuth();
      return;
    }

    setIsUploading(true);
    setDocError(null);
    try {
      await onAddDocument(work.id, {
        title: docTitle.trim(),
        date: docDate,
        notes: docNotes.trim(),
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        fileDataUrl: selectedFile?.dataUrl,
      });
      setIsAddingDoc(false);
      setDocTitle('');
      setDocNotes('');
      setSelectedFile(null);
    } catch (err: any) {
      setDocError(err.message || 'فشل إرفاق المستند');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-xs overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:text-black">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 text-[#0E141C] dark:text-[#F2EFE9] print:border-none print:shadow-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#314B6E] print:bg-white print:text-black print:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 flex items-center justify-center text-[#7A6B54] dark:text-[#BDB3A3] flex-shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#314B6E] text-white shadow-2xs">
                  {work.workNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border border-[#BDB3A3] dark:border-[#BDB3A3]/60">
                  {work.workType}
                </span>
                {work.priority === 'عاجل' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    عاجل
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#0E141C] dark:text-[#F2EFE9] mt-1 print:text-black">
                {work.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              title="طباعة بطاقة المعاملة"
              className="p-2 rounded-xl bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] transition flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              onClick={() => onEdit(work)}
              className="px-3 py-2 rounded-xl bg-[#314B6E] hover:bg-[#243954] text-white transition flex items-center gap-1.5 text-xs font-black shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-[#BDB3A3]" />
              <span className="hidden sm:inline">تعديل</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C2838] hover:bg-slate-200/70 dark:hover:bg-[#314B6E] border border-slate-200 dark:border-[#314B6E] flex items-center justify-center text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] transition mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-[#314B6E] bg-[#F1F4F8] dark:bg-[#0E141C]/80 print:hidden">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-[#314B6E] dark:border-[#BDB3A3] text-[#314B6E] dark:text-[#F2EFE9]'
                : 'border-transparent text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            تفاصيل وبيانات المعاملة
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-[#314B6E] dark:border-[#BDB3A3] text-[#314B6E] dark:text-[#F2EFE9]'
                : 'border-transparent text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
            <span>المستندات والملفات المرفقة</span>
            <span className="text-[10px] bg-[#314B6E] text-white px-1.5 py-0.2 rounded-full font-bold">
              {Array.isArray(work.documents) ? work.documents.length : 0}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {activeTab === 'details' ? (
            <div className="space-y-6">
              
              {/* Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-3 print:bg-white print:border-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-[#8197AC]">الحالة الراهنة:</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EEF2F6] dark:bg-[#1C2838] border border-[#314B6E]/30 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] shadow-2xs print:bg-white print:text-black">
                    {work.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap print:hidden">
                  <span className="text-[11px] text-slate-500 dark:text-[#8197AC] ml-1">تغيير سريع:</span>
                  {WORK_STATUSES.map((st) => (
                    <button
                      key={st}
                      disabled={work.status === st}
                      onClick={() => onStatusChange(work.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        work.status === st
                          ? 'bg-[#314B6E] text-white border border-[#243954] cursor-default'
                          : 'bg-white dark:bg-[#151E2A] hover:bg-slate-100 dark:hover:bg-[#1C2838] text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Client Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-2 print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-bold text-[#314B6E] dark:text-[#BDB3A3] flex items-center gap-1.5 print:text-slate-700">
                    <User className="w-3.5 h-3.5" />
                    <span>طرف الموكل / المستفيد</span>
                  </span>
                  <div className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{work.clientName}</div>
                  {work.clientPhone && (
                    <div className="text-xs text-slate-600 dark:text-[#8197AC] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#607EA2] dark:text-[#8197AC]" />
                      <span dir="ltr">{work.clientPhone}</span>
                    </div>
                  )}
                </div>

                {/* Opponent Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-2 print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#8197AC] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#607EA2] dark:text-[#8197AC]" />
                    <span>الطرف الآخر / المدين / الطرف الثاني</span>
                  </span>
                  <div className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{work.opponentName || '—'}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC]">الطرف المستهدف في المعاملة أو الالتزام</div>
                </div>

                {/* Financial Value Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-2 print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-bold text-[#7A6B54] dark:text-[#BDB3A3] flex items-center gap-1.5 print:text-slate-700">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>المبلغ / قيمة السند أو المطالبة</span>
                  </span>
                  <div className="text-lg font-black text-[#7A6B54] dark:text-[#BDB3A3] font-mono print:text-black">
                    {formatCurrency(work.amount)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC]">ريال سعودي معتمد</div>
                </div>

                {/* Lawyer in Charge */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-2 print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#8197AC] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                    <span>المحامي المسؤول</span>
                  </span>
                  <div className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] print:text-black">{work.lawyerInCharge}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC]">المكلف بالمتابعة والإنجاز</div>
                </div>

              </div>

              {/* Due Date & Dates Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-3 print:bg-white print:border-slate-300">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5 print:text-black">
                    <Calendar className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                    <span>تاريخ الاستحقاق والإنجاز المستهدف:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsCalendarHijri(!isCalendarHijri)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-[#0E141C] dark:text-[#F2EFE9] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] flex items-center gap-1 transition shadow-2xs print:hidden"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-[#7A6B54] dark:text-[#BDB3A3]" />
                    <span>{isCalendarHijri ? 'عرض بالميلادي' : 'عرض بالهجري (أم القرى)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-[#151E2A] p-3 rounded-lg border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
                    <span className="text-slate-500 dark:text-[#8197AC] block mb-1">الاستحقاق:</span>
                    <strong className="text-[#314B6E] dark:text-[#BDB3A3] text-sm font-mono print:text-black">
                      {isCalendarHijri 
                        ? (hijriObj?.formattedText || work.dueDateHijri || work.dueDate || 'غير محدد')
                        : (work.dueDate || 'غير محدد')}
                    </strong>
                  </div>

                  <div className="bg-white dark:bg-[#151E2A] p-3 rounded-lg border border-slate-200 dark:border-[#314B6E] print:bg-white print:border-slate-300">
                    <span className="text-slate-500 dark:text-[#8197AC] block mb-1">تاريخ الإنشاء والتسجيل:</span>
                    <span className="text-[#0E141C] dark:text-[#F2EFE9] font-medium print:text-black">
                      {work.createdAt ? new Date(work.createdAt).toLocaleDateString('ar-SA', { dateStyle: 'long' }) : '—'}
                    </span>
                    <span className="text-slate-500 dark:text-[#8197AC] block text-[11px] mt-0.5">
                      بواسطة المحامي: {work.createdByName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Last Actions */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] space-y-2 print:bg-white print:border-slate-300">
                <span className="text-xs font-bold text-[#314B6E] dark:text-[#BDB3A3] flex items-center gap-1.5 print:text-black">
                  <FileText className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3] print:text-black" />
                  <span>أخر إجراء وملاحظات وتفاصيل العمل</span>
                </span>
                <p className="text-xs text-[#0E141C]/90 dark:text-[#F2EFE9]/90 leading-relaxed whitespace-pre-line bg-white dark:bg-[#151E2A] p-3 rounded-lg border border-slate-200 dark:border-[#314B6E] print:bg-white print:text-black">
                  {work.notes || 'لا توجد ملاحظات مدونة حتى الآن.'}
                </p>
              </div>

            </div>
          ) : (
            
            /* DOCUMENTS TAB */
            <div className="space-y-5">
              
              {/* Top Bar for Documents */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9]">
                    المستندات واللوائح والملفات المرفقة بالمعاملة
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5">
                    يمكنك إرفاق وتنزيل ملفات Word وExcel وPDF الخاصة بالعقود والسندات والمذكرات.
                  </p>
                </div>

                {!isAddingDoc && (
                  <button
                    onClick={() => {
                      if (!session) {
                        onRequireAuth();
                        return;
                      }
                      setIsAddingDoc(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#314B6E] hover:bg-[#243954] text-white transition shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-[#BDB3A3]" />
                    <span>إرفاق مستند جديد</span>
                  </button>
                )}
              </div>

              {/* Add Document Subform */}
              {isAddingDoc && (
                <form onSubmit={handleSaveDocument} className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-[#314B6E]/35 dark:border-[#314B6E] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#314B6E] pb-2">
                    <span className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                      <span>إرفاق لائحة أو عقد أو ملف خارجي (Word, Excel, PDF)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] text-xs"
                    >
                      إلغاء
                    </button>
                  </div>

                  {docError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs font-medium">
                      {docError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                        عنوان أو موضوع المستند <span className="text-rose-600 dark:text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="مثال: صيغة السند لأمر أو مسودة العقد"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs font-medium bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                        تاريخ المستند
                      </label>
                      <input
                        type="date"
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs font-medium bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                      اختيار الملف من جهازك (Word, Excel, PDF, صور)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".doc,.docx,.xls,.xlsx,.pdf,image/*"
                      className="w-full text-xs text-slate-600 dark:text-[#8197AC] file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#314B6E] file:text-white hover:file:bg-[#243954] cursor-pointer bg-white dark:bg-[#151E2A] p-1 rounded-lg border border-slate-300 dark:border-[#314B6E]"
                    />
                    {selectedFile && (
                      <p className="text-[11px] text-[#7A6B54] dark:text-[#BDB3A3] font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>تم تجهيز: {selectedFile.name} ({selectedFile.size})</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                      ملاحظات حول المستند
                    </label>
                    <input
                      type="text"
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="ملاحظات توضيحية اختيارية..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs font-medium bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-200/60 dark:hover:bg-[#1C2838]"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#314B6E] hover:bg-[#243954] text-white flex items-center gap-1.5 shadow-xs"
                    >
                      {isUploading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-[#BDB3A3]" />
                      )}
                      <span>حفظ وإرفاق المستند</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Documents List */}
              {Array.isArray(work.documents) && work.documents.length > 0 ? (
                <div className="space-y-2">
                  {work.documents.map((doc: LegalPleading, idx: number) => (
                    <div 
                      key={doc.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] bg-[#F8FAFC] dark:bg-[#0E141C] hover:border-[#314B6E]/50 dark:hover:border-[#BDB3A3]/60 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 flex items-center justify-center text-[#7A6B54] dark:text-[#BDB3A3] flex-shrink-0">
                          {doc.fileName?.endsWith('.xls') || doc.fileName?.endsWith('.xlsx') ? (
                            <FileSpreadsheet className="w-4 h-4 text-[#7A6B54] dark:text-[#BDB3A3]" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#7A6B54] dark:text-[#BDB3A3]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9]">{doc.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5 flex items-center gap-2">
                            <span>{doc.date}</span>
                            <span>•</span>
                            <span>المحامي: {doc.lawyerName}</span>
                            {doc.fileName && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[#314B6E] dark:text-[#BDB3A3]">{doc.fileName}</span>
                              </>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-[#8197AC] mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>

                      {doc.fileDataUrl ? (
                        <a
                          href={doc.fileDataUrl}
                          download={doc.fileName || `${doc.title}.bin`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 flex items-center gap-1.5 transition flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                          <span>تحميل الملف</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-[#8197AC]">مستند نصي</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] text-slate-500 dark:text-[#8197AC] text-xs">
                  لا توجد مستندات مرفقة بهذه المعاملة حتى الآن.
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] px-6 py-3 border-t border-slate-200 dark:border-[#314B6E] flex items-center justify-between text-xs text-slate-600 dark:text-[#8197AC] print:hidden">
          <div>
            <span>رقم المعاملة: </span>
            <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-mono">{work.workNumber}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1C2838] border border-slate-300 dark:border-[#314B6E] hover:bg-slate-100 dark:hover:bg-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
