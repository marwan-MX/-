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
  CheckCircle2
} from 'lucide-react';
import { CaseItem, CaseStatus, CaseType, HearingStatus } from '../types';
import { AuthSession } from '../services/api';

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
  // 8. موعد الجلسة القادم (ميلادي)
  const [nextHearingDate, setNextHearingDate] = useState('');
  // 9. وقت الجلسة
  const [nextHearingTime, setNextHearingTime] = useState('');
  // 10. حالة القضية (قيد التنفيذ-منتهية-مؤرشفة-قيد النظر)
  const [status, setStatus] = useState<CaseStatus>('قيد النظر');
  // 11. المحامي المسؤول
  const [lawyerInCharge, setLawyerInCharge] = useState('أ. عبد الرحمن السعدي');
  // 12. حالة الجلسة (بانتظار التحديد-محددة-مؤجلة-منعقدة-ملغاة)
  const [hearingStatus, setHearingStatus] = useState<HearingStatus>('بانتظار التحديد');
  // 13. أخر إجراء / ملاحظات
  const [hearingRequirement, setHearingRequirement] = useState('');

  // Security Credentials
  const [promptEmployeeName, setPromptEmployeeName] = useState('');
  const [promptPassword, setPromptPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setNextHearingDate(initialCase.nextHearingDate || '');
        setNextHearingTime(initialCase.nextHearingTime || '');
        
        // Map status
        const validStatus: CaseStatus = initialCase.status === 'قيد التنفيذ' || initialCase.status === 'منتهية' || initialCase.status === 'مؤرشفة' || initialCase.status === 'قيد النظر'
          ? initialCase.status
          : 'قيد النظر';
        setStatus(validStatus);

        setLawyerInCharge(initialCase.lawyerInCharge || 'أ. عبد الرحمن السعدي');
        setHearingStatus(initialCase.hearingStatus || (initialCase.nextHearingDate ? 'محددة' : 'بانتظار التحديد'));
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
        setStatus('قيد النظر');
        setLawyerInCharge('أ. عبد الرحمن السعدي');
        setHearingStatus('بانتظار التحديد');
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
      const caseData: Partial<CaseItem> = {
        caseNumber: caseNumber.trim(),
        title: title.trim(),
        caseType,
        clientName: clientName.trim(),
        opponentName: opponentName.trim(),
        court: court.trim(),
        circleNumber: circleNumber.trim() || undefined,
        nextHearingDate: nextHearingDate || undefined,
        nextHearingTime: nextHearingTime || undefined,
        status,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white border border-emerald-300 w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Part Name strictly as requested: اضافة قضيه جديدة */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isEditing ? `تعديل القضية: ${initialCase?.caseNumber}` : 'اضافة قضيه جديدة'}
              </h3>
              <p className="text-xs text-emerald-100">
                كيان الإجادة للمحاماة والاستشارات القانونية • نظام إدارة القضايا المركزي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with the exact 13 fields */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verification Bar (Lawyer Name & Password) */}
          <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>إثبات هوية المحامي (لحماية التعديل وإدراج الاسم في السجل الرقابي):</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                حروف فقط بدون أرقام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  اسم المحامي المسئول: <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={session?.employeeName || promptEmployeeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={!!session?.employeeName}
                  placeholder="اكتب اسمك الثلاثي بالحروف فقط..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 disabled:opacity-85 disabled:bg-slate-100 font-semibold"
                />
                {nameError && (
                  <p className="text-[11px] text-rose-600 mt-1">{nameError}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  كلمة المرور (المحامي أو المدير): <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="password"
                  value={session ? (session.role === 'admin' ? session.adminPassword : session.employeePassword) : promptPassword}
                  onChange={(e) => setPromptPassword(e.target.value)}
                  disabled={!!session}
                  placeholder={session ? 'تم التحقق من الجلسة 🟢' : 'اكتب كلمة المرور (افتراضي: كيان 1423)'}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 disabled:opacity-85 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 1. رقم القضية & 2. اسم القضية & 3. نوع القضية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                1. رقم القضية: <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 4410982-ق"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                2. اسم القضية: <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دعوى مطالبة بمستحقات توريد ومقاولات"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
              />
            </div>
          </div>

          {/* 3. نوع القضيه & 10. حالة القضية & 11. المحامي المسؤول */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                3. نوع القضيه:
              </label>
              <select
                value={caseType}
                onChange={(e: any) => setCaseType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
              >
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                10. حالة القضية:
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs text-emerald-950 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                {CASE_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                11. المحامي المسؤول:
              </label>
              <input
                type="text"
                value={lawyerInCharge}
                onChange={(e) => setLawyerInCharge(e.target.value)}
                placeholder="أ. عبد الرحمن السعدي"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 4. المدعي & 5. المدعي عليه */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>4. المدعي:</span> <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم المدعي (الموكل)..."
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-rose-700" />
                <span>5. المدعي عليه:</span> <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="اسم المدعى عليه (الخصم)..."
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
              />
            </div>
          </div>

          {/* 6. المحكمة & 7. الدائرة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>6. المحكمة:</span>
              </label>
              <input
                type="text"
                list="popular-courts-list"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="اكتب أو اختر اسم المحكمة..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
              <datalist id="popular-courts-list">
                {POPULAR_COURTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                7. الدائرة:
              </label>
              <input
                type="text"
                value={circleNumber}
                onChange={(e) => setCircleNumber(e.target.value)}
                placeholder="مثال: الدائرة التجارية السادسة"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 8. موعد الجلسة القادم (ميلادي) & 9. وقت الجلسة & 12. حالة الجلسة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>8. موعد الجلسة القادم (ميلادي):</span>
              </label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={(e) => setNextHearingDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>9. وقت الجلسة:</span>
              </label>
              <input
                type="time"
                value={nextHearingTime}
                onChange={(e) => setNextHearingTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                12. حالة الجلسة:
              </label>
              <select
                value={hearingStatus}
                onChange={(e: any) => setHearingStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
              >
                {HEARING_STATUSES.map((hs) => (
                  <option key={hs} value={hs}>{hs}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 13. أخر إجراء / ملاحظات */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>13. أخر إجراء / ملاحظات:</span>
            </label>
            <textarea
              rows={3}
              value={hearingRequirement}
              onChange={(e) => setHearingRequirement(e.target.value)}
              placeholder="اكتب أخر إجراء تم في الدعوى، المطلوب للجلسة، أو أي ملاحظات هامة..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !!nameError}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'حفظ تعديلات القضية' : 'اضافة القضية وحفظها'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
