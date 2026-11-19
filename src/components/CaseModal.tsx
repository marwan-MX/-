import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Shield, 
  User, 
  Building2, 
  FileText, 
  Plus,
  Save,
  CheckCircle2,
  ArrowLeftRight
} from 'lucide-react';
import { CaseItem, CaseStatus, CaseType, HearingStatus, RulingClassification } from '../types';
import { AuthSession } from '../services/api';
import { 
  gregorianToHijri, 
  hijriToGregorian, 
  HIJRI_MONTHS, 
  getCurrentHijriDate, 
  formatGregorian 
} from '../utils/dateUtils';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<CaseItem>, employeeName: string, password: string) => Promise<void>;
  initialCase?: CaseItem | null;
  session: AuthSession | null;
  onRequireAuth?: () => void;
}

const CASE_TYPES: CaseType[] = [
  'تجارية',
  'عمالية',
  'مدنية',
  'تنفيذ',
  'أحوال شخصية',
  'أخرى',
];

const CASE_STATUSES: CaseStatus[] = [
  'قيد التنفيذ',
  'منتهية',
  'مؤرشفة',
  'قيد النظر',
];

const HEARING_STATUSES: HearingStatus[] = [
  'بانتظار التحديد',
  'محددة',
  'مؤجلة',
  'منعقدة',
  'ملغاة',
];

const RULING_CLASSIFICATIONS: RulingClassification[] = [
  'حكم ابتدائي',
  'استئناف أو الأحكام النهائية',
  'تنفيذ أحكام',
  'قضية مؤرشفة',
];

const POPULAR_COURTS = [
  'المحكمة التجارية بالرياض',
  'المحكمة التجارية بجدة',
  'المحكمة التجارية بالدمام',
  'المحكمة العمالية بالرياض',
  'المحكمة العمالية بجدة',
  'المحكمة العامة بالرياض',
  'المحكمة العامة بجدة',
  'المحكمة العامة بالدمام',
  'محكمة التنفيذ بالرياض',
  'محكمة التنفيذ بجدة',
  'محكمة الأحوال الشخصية',
  'ديوان المظالم (المحكمة الإدارية)',
  'محكمة الاستئناف',
  'المحكمة العليا',
  'لجنة المنازعات المصرفية والتمويلية',
  'أخرى',
];

export const CaseModal: React.FC<CaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCase,
  session,
}) => {
  const isEditing = !!initialCase;

  // The 13 required and specific fields requested by the user:
  // 1. رقم القضية
  const [caseNumber, setCaseNumber] = useState('');
  // 2. اسم القضية
  const [title, setTitle] = useState('');
  // 3. نوع القضية (تجارية-عمالية-مدنية-تنفيذ-أحوال شخصية-أخرى)
  const [caseType, setCaseType] = useState<CaseType>('تجارية');
  // 4. المدعي
  const [clientName, setClientName] = useState('');
  // 5. المدعي عليه
  const [opponentName, setOpponentName] = useState('');
  // 6. المحكمة
  const [court, setCourt] = useState(POPULAR_COURTS[0]);
  // 7. الدائرة
  const [circleNumber, setCircleNumber] = useState('');
  // 8. موعد الجلسة القادم (ميلادي وهجري)
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [calendarMode, setCalendarMode] = useState<'gregorian' | 'hijri'>('gregorian');
  const [hijriDay, setHijriDay] = useState<number>(() => getCurrentHijriDate().day);
  const [hijriMonth, setHijriMonth] = useState<number>(() => getCurrentHijriDate().month);
  const [hijriYear, setHijriYear] = useState<number>(() => getCurrentHijriDate().year);

  // 9. وقت الجلسة
  const [nextHearingTime, setNextHearingTime] = useState('');
  // 10. حالة القضية (قيد التنفيذ-منتهية-مؤرشفة-قيد النظر)
  const [status, setStatus] = useState<CaseStatus>('قيد النظر');
  // 11. المحامي المسؤول
  const [lawyerInCharge, setLawyerInCharge] = useState('أ. عبد الرحمن السعدي');
  // 12. حالة الجلسة (بانتظار التحديد-محددة-مؤجلة-منعقدة-ملغاة)
  const [hearingStatus, setHearingStatus] = useState<HearingStatus>('بانتظار التحديد');
  // تصنيف الحكم
  const [rulingClassification, setRulingClassification] = useState<string>('');
  // 13. أخر إجراء / ملاحظات
  const [hearingRequirement, setHearingRequirement] = useState('');

  // Security Credentials
  const [promptEmployeeName, setPromptEmployeeName] = useState('');
  const [promptPassword, setPromptPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Computed Hijri/Gregorian equivalents
  const currentHijri = gregorianToHijri(nextHearingDate);
  const currentGregorianFormatted = formatGregorian(nextHearingDate);

  // Initialize form fields
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setNameError(null);
      if (initialCase) {
        setCaseNumber(initialCase.caseNumber || '');
        setTitle(initialCase.title || '');
        // Map old caseType if needed
        const mappedType = initialCase.caseType?.includes('تجار') ? 'تجارية'
          : initialCase.caseType?.includes('عمال') ? 'عمالية'
          : initialCase.caseType?.includes('عقار') || initialCase.caseType?.includes('حقوق') || initialCase.caseType?.includes('مدن') ? 'مدنية'
          : initialCase.caseType?.includes('تنفيذ') ? 'تنفيذ'
          : initialCase.caseType?.includes('أحوال') || initialCase.caseType?.includes('تركات') ? 'أحوال شخصية'
          : (initialCase.caseType as CaseType) || 'تجارية';
        setCaseType(mappedType);

        setClientName(initialCase.clientName || '');
        setOpponentName(initialCase.opponentName || '');
        setCourt(initialCase.court || POPULAR_COURTS[0]);
        setCircleNumber(initialCase.circleNumber || '');
        const gDate = initialCase.nextHearingDate || '';
        setNextHearingDate(gDate);
        setNextHearingTime(initialCase.nextHearingTime || '');
        
        if (gDate) {
          const h = gregorianToHijri(gDate);
          if (h) {
            setHijriDay(h.day);
            setHijriMonth(h.month);
            setHijriYear(h.year);
          }
        } else {
          const todayH = getCurrentHijriDate();
          setHijriDay(todayH.day);
          setHijriMonth(todayH.month);
          setHijriYear(todayH.year);
        }

        // Map status
        const validStatus: CaseStatus = initialCase.status === 'قيد التنفيذ' || initialCase.status === 'منتهية' || initialCase.status === 'مؤرشفة' || initialCase.status === 'قيد النظر'
          ? initialCase.status
          : 'قيد النظر';
        setStatus(validStatus);

        setLawyerInCharge(initialCase.lawyerInCharge || 'أ. عبد الرحمن السعدي');
        setHearingStatus(initialCase.hearingStatus || (initialCase.nextHearingDate ? 'محددة' : 'بانتظار التحديد'));
        setRulingClassification(initialCase.rulingClassification || '');
        setHearingRequirement(initialCase.hearingRequirement || initialCase.caseDetails || '');
      } else {
        setCaseNumber('');
        setTitle('');
        setCaseType('تجارية');
        setClientName('');
        setOpponentName('');
        setCourt(POPULAR_COURTS[0]);
        setCircleNumber('');
        setNextHearingDate('');
        setNextHearingTime('');
        const todayH = getCurrentHijriDate();
        setHijriDay(todayH.day);
        setHijriMonth(todayH.month);
        setHijriYear(todayH.year);
        setStatus('قيد النظر');
        setLawyerInCharge('أ. عبد الرحمن السعدي');
        setHearingStatus('بانتظار التحديد');
        setRulingClassification('');
        setHearingRequirement('');
      }

      if (session) {
        setPromptEmployeeName(session.employeeName);
        setPromptPassword(session.role === 'admin' ? (session.adminPassword || '') : (session.employeePassword || ''));
      } else {
        try {
          const cached = localStorage.getItem('kayan_cached_employee_name');
          if (cached) setPromptEmployeeName(cached);
        } catch {}
      }
    }
  }, [isOpen, initialCase, session]);

  // Synchronized date handlers
  const handleGregorianDateChange = (val: string) => {
    setNextHearingDate(val);
    if (val) {
      const h = gregorianToHijri(val);
      if (h) {
        setHijriDay(h.day);
        setHijriMonth(h.month);
        setHijriYear(h.year);
      }
    }
  };

  const handleHijriChange = (newDay: number, newMonth: number, newYear: number) => {
    setHijriDay(newDay);
    setHijriMonth(newMonth);
    setHijriYear(newYear);
    const convertedG = hijriToGregorian(newYear, newMonth, newDay);
    if (convertedG) {
      setNextHearingDate(convertedG);
    }
  };

  const handleSwitchCalendarMode = (mode: 'gregorian' | 'hijri') => {
    setCalendarMode(mode);
    if (mode === 'hijri' && nextHearingDate) {
      const h = gregorianToHijri(nextHearingDate);
      if (h) {
        setHijriDay(h.day);
        setHijriMonth(h.month);
        setHijriYear(h.year);
      }
    } else if (mode === 'gregorian' && !nextHearingDate) {
      const convertedG = hijriToGregorian(hijriYear, hijriMonth, hijriDay);
      if (convertedG) {
        setNextHearingDate(convertedG);
      }
    }
  };

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setPromptEmployeeName(val);
    if (!val.trim()) {
      setNameError(null);
      return;
    }
    if (/[0-9\u0660-\u0669]/.test(val)) {
      setNameError('ممنوع كتابة أي أرقام في خانة اسم المحامي.');
      return;
    }
    const validRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!validRegex.test(val)) {
      setNameError('ممنوع الرموز أو العلامات (@#$%). حروف فقط.');
      return;
    }
    setNameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activeEmpName = session ? session.employeeName : promptEmployeeName.trim();
    const activePass = session ? (session.role === 'admin' ? session.adminPassword : session.employeePassword) : promptPassword.trim();

    if (!activeEmpName) {
      setErrorMessage('يجب إدخال اسم المحامي المسئول (بالحروف فقط).');
      return;
    }
    if (/[0-9\u0660-\u0669]/.test(activeEmpName)) {
      setErrorMessage('ممنوع كتابة الأرقام في خانة اسم المحامي.');
      return;
    }
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(activeEmpName)) {
      setErrorMessage('اسم المحامي يجب أن يتكون من حروف ومسافات فقط.');
      return;
    }

    if (!activePass) {
      setErrorMessage('كلمة المرور مطلوبة لإتمام الحفظ وحماية البيانات.');
      return;
    }

    if (!caseNumber.trim() || !title.trim() || !clientName.trim() || !opponentName.trim()) {
      setErrorMessage('يرجى تعبئة الحقول الأساسية: رقم القضية، اسم القضية، المدعي، والمدعي عليه.');
      return;
    }

    setIsSubmitting(true);
    try {
      const hijriRes = gregorianToHijri(nextHearingDate);
      const nextHearingDateHijri = hijriRes ? hijriRes.formattedText : undefined;

      const caseData: Partial<CaseItem> = {
        caseNumber: caseNumber.trim(),
        title: title.trim(),
        caseType,
        clientName: clientName.trim(),
        opponentName: opponentName.trim(),
        court: court.trim(),
        circleNumber: circleNumber.trim() || undefined,
        nextHearingDate: nextHearingDate || undefined,
        nextHearingDateHijri: nextHearingDateHijri || undefined,
        nextHearingTime: nextHearingTime || undefined,
        status,
        rulingClassification: rulingClassification || undefined,
        lawyerInCharge: lawyerInCharge.trim() || 'أ. عبد الرحمن السعدي',
        hearingStatus,
        hearingRequirement: hearingRequirement.trim() || undefined,
        caseDetails: hearingRequirement.trim() || undefined,
      };

      await onSave(caseData, activeEmpName, activePass);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ القضية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0E141C] dark:text-[#F2EFE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Part Name strictly as requested: اضافة قضيه جديدة */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-[#314B6E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#314B6E] text-[#BDB3A3] border border-[#243954] flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0E141C] dark:text-[#F2EFE9]">
                {isEditing ? `تعديل القضية: ${initialCase?.caseNumber}` : 'اضافة قضيه جديدة'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8197AC]">
                كيان الإجادة للمحاماة والاستشارات القانونية • نظام إدارة القضايا المركزي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-200/70 dark:hover:bg-[#1C2838] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with the exact 13 fields */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verification Bar (Lawyer Name & Password) */}
          <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9]">
                <Shield className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>إثبات هوية المحامي (لحماية التعديل وإدراج الاسم في السجل الرقابي):</span>
              </div>
              <span className="text-[11px] text-[#7A6B54] dark:text-[#BDB3A3] font-bold bg-[#F6F2EB] dark:bg-[#1C2838] px-2 py-0.5 rounded border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50">
                حروف فقط بدون أرقام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 dark:text-[#8197AC] block mb-1 font-semibold">
                  اسم المحامي المسئول: <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={session?.employeeName || promptEmployeeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={!!session?.employeeName}
                  placeholder="اكتب اسمك الثلاثي بالحروف فقط..."
                  required
                  className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-lg px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] disabled:bg-slate-100 dark:disabled:bg-[#1C2838] disabled:text-slate-600 dark:disabled:text-[#8197AC] font-semibold"
                />
                {nameError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">{nameError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-[#8197AC] block mb-1 font-semibold">
                  كلمة المرور (المحامي أو المدير): <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="password"
                  value={session ? (session.role === 'admin' ? session.adminPassword : session.employeePassword) : promptPassword}
                  onChange={(e) => setPromptPassword(e.target.value)}
                  disabled={!!session}
                  placeholder={session ? 'تم التحقق من الجلسة' : 'اكتب كلمة المرور (افتراضي: كيان 1423)'}
                  required
                  className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-lg px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] disabled:bg-slate-100 dark:disabled:bg-[#1C2838] disabled:text-slate-600 dark:disabled:text-[#8197AC]"
                />
              </div>
            </div>
          </div>

          {/* 1. رقم القضية & 2. اسم القضية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                1. رقم القضية: <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 4410982-ق"
                required
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#314B6E] dark:text-[#BDB3A3] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                2. اسم القضية: <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دعوى مطالبة بمستحقات توريد ومقاولات"
                required
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
              />
            </div>
          </div>

          {/* 3. نوع القضيه & 10. حالة القضية & 11. المحامي المسؤول */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                3. نوع القضيه:
              </label>
              <select
                value={caseType}
                onChange={(e: any) => setCaseType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
              >
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                10. حالة القضية:
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-[#EEF2F6] dark:bg-[#1C2838] border border-[#314B6E]/40 dark:border-[#BDB3A3]/60 rounded-xl px-3 py-2 text-xs text-[#314B6E] dark:text-[#BDB3A3] font-bold focus:bg-white dark:focus:bg-[#0E141C] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
              >
                {CASE_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                11. المحامي المسؤول:
              </label>
              <input
                type="text"
                value={lawyerInCharge}
                onChange={(e) => setLawyerInCharge(e.target.value)}
                placeholder="أ. عبد الرحمن السعدي"
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
              />
            </div>
          </div>

          {/* 4. المدعي & 5. المدعي عليه */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>4. المدعي:</span> <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم المدعي (الموكل)..."
                required
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-[#8197AC]" />
                <span>5. المدعي عليه:</span> <span className="text-rose-600 dark:text-rose-400 font-bold">*</span>
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="اسم المدعى عليه (الخصم)..."
                required
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
              />
            </div>
          </div>

          {/* 6. المحكمة & 7. الدائرة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>6. المحكمة:</span>
              </label>
              <input
                type="text"
                list="popular-courts-list"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="اكتب أو اختر اسم المحكمة..."
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
              />
              <datalist id="popular-courts-list">
                {POPULAR_COURTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                7. الدائرة:
              </label>
              <input
                type="text"
                value={circleNumber}
                onChange={(e) => setCircleNumber(e.target.value)}
                placeholder="مثال: الدائرة التجارية السادسة"
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
              />
            </div>
          </div>

          {/* 8. موعد الجلسة القادم (ميلادي أو هجري مع زر التحويل التلقائي) */}
          <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#314B6E] pb-2">
              <label className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>8. موعد الجلسة القادم:</span>
                <span className="text-slate-500 dark:text-[#8197AC] text-[11px] font-normal">(اختر الإدخال بالهجري أو بالميلادي)</span>
              </label>

              {/* Calendar Mode Toggle Buttons */}
              <div className="flex items-center bg-[#F1F4F8] dark:bg-[#151E2A] p-1 rounded-lg border border-slate-200 dark:border-[#314B6E] text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSwitchCalendarMode('gregorian')}
                  className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                    calendarMode === 'gregorian'
                      ? 'bg-[#314B6E] text-white shadow-xs'
                      : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-white dark:hover:bg-[#1C2838]'
                  }`}
                >
                  <span>ميلادي</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchCalendarMode('hijri')}
                  className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                    calendarMode === 'hijri'
                      ? 'bg-[#314B6E] text-white shadow-xs'
                      : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-white dark:hover:bg-[#1C2838]'
                  }`}
                >
                  <span>هجري (أم القرى)</span>
                </button>
              </div>
            </div>

            {/* Date Inputs based on Active Mode */}
            {calendarMode === 'gregorian' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="date"
                      value={nextHearingDate}
                      onChange={(e) => handleGregorianDateChange(e.target.value)}
                      className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono font-bold"
                    />
                  </div>

                  {/* Switch to Hijri button */}
                  <button
                    type="button"
                    onClick={() => handleSwitchCalendarMode('hijri')}
                    title="التبديل إلى التاريخ الهجري المقابل"
                    className="px-3 py-2 bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#253549] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                    <span>تحويل وإدخال بالهجري</span>
                  </button>
                </div>

                {/* Live Converted Hijri Equivalent Badge */}
                {nextHearingDate ? (
                  <div className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#7A6B54] dark:text-[#BDB3A3] font-bold">الموافق بالهجري:</span>
                      <strong className="text-[#0E141C] dark:text-[#F2EFE9] font-semibold">{currentHijri?.formattedFull || '—'}</strong>
                    </div>
                    <span className="bg-[#EEF2F6] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-[#314B6E]/25 dark:border-[#314B6E]">
                      {currentHijri?.formattedNum} هـ
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                    يمكنك إدخال التاريخ الميلادي وسيتم حسابه وعرضه بالهجري تلقائياً.
                  </div>
                )}
              </div>
            ) : (
              /* Hijri Mode Input */
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Day Select */}
                  <div className="w-24">
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-bold">اليوم (هجري):</label>
                    <select
                      value={hijriDay}
                      onChange={(e) => handleHijriChange(parseInt(e.target.value, 10), hijriMonth, hijriYear)}
                      className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-xl px-2 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-mono font-bold focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Select */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-bold">الشهر الهجري:</label>
                    <select
                      value={hijriMonth}
                      onChange={(e) => handleHijriChange(hijriDay, parseInt(e.target.value, 10), hijriYear)}
                      className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-xl px-2.5 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-bold focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                    >
                      {HIJRI_MONTHS.map((m) => (
                        <option key={m.num} value={m.num}>
                          {m.num} - {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Select */}
                  <div className="w-28">
                    <label className="text-[10px] text-slate-600 dark:text-[#8197AC] block mb-0.5 font-bold">السنة (هجري):</label>
                    <select
                      value={hijriYear}
                      onChange={(e) => handleHijriChange(hijriDay, hijriMonth, parseInt(e.target.value, 10))}
                      className="w-full bg-white dark:bg-[#151E2A] border border-slate-300 dark:border-[#314B6E] rounded-xl px-2 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-mono font-bold focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                    >
                      {[1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451, 1452].map((y) => (
                        <option key={y} value={y}>
                          {y} هـ
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Switch to Gregorian button */}
                  <div className="self-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchCalendarMode('gregorian')}
                      title="التبديل إلى التاريخ الميلادي المقابل"
                      className="px-3 py-2 bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#253549] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                      <span>تحويل وإدخال بالميلادي</span>
                    </button>
                  </div>

                </div>

                {/* Live Converted Gregorian Equivalent Badge */}
                {nextHearingDate ? (
                  <div className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] rounded-lg p-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#7A6B54] dark:text-[#BDB3A3] font-bold">الموافق بالميلادي:</span>
                      <strong className="text-[#0E141C] dark:text-[#F2EFE9] font-semibold">{currentGregorianFormatted?.formattedFull || nextHearingDate}</strong>
                    </div>
                    <span className="bg-[#EEF2F6] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-[#314B6E]/25 dark:border-[#314B6E]">
                      {nextHearingDate} م
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 9. وقت الجلسة & 12. حالة الجلسة & تصنيف الحكم */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>9. وقت الجلسة:</span>
              </label>
              <input
                type="time"
                value={nextHearingTime}
                onChange={(e) => setNextHearingTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1">
                12. حالة الجلسة:
              </label>
              <select
                value={hearingStatus}
                onChange={(e: any) => setHearingStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] font-semibold"
              >
                {HEARING_STATUSES.map((hs) => (
                  <option key={hs} value={hs}>{hs}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                <span>تصنيف الحكم:</span>
              </label>
              <select
                value={rulingClassification}
                onChange={(e) => setRulingClassification(e.target.value)}
                className="w-full bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 rounded-xl px-3 py-2 text-xs text-[#0E141C] dark:text-[#F2EFE9] font-bold focus:bg-white dark:focus:bg-[#0E141C] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
              >
                <option value="">بدون حكم محدد بعد</option>
                {RULING_CLASSIFICATIONS.map((rc) => (
                  <option key={rc} value={rc}>{rc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 13. أخر إجراء / ملاحظات */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-[#8197AC] block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>13. أخر إجراء / ملاحظات:</span>
            </label>
            <textarea
              rows={3}
              value={hearingRequirement}
              onChange={(e) => setHearingRequirement(e.target.value)}
              placeholder="اكتب أخر إجراء تم في الدعوى، المطلوب للجلسة، أو أي ملاحظات هامة..."
              className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl p-3 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] leading-relaxed"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#314B6E] flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-[#151E2A]/95 backdrop-blur-sm py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !!nameError}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-[#314B6E] hover:bg-[#243954] text-white shadow-md shadow-slate-900/10 transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4 text-[#BDB3A3]" />
              )}
              <span>{isEditing ? 'حفظ تعديلات القضية' : 'اضافة القضية وحفظها'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
