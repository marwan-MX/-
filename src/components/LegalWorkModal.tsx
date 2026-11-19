import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  AlertCircle, 
  Calendar, 
  Shield, 
  User, 
  FileText, 
  DollarSign,
  Save,
  ArrowLeftRight,
  Phone
} from 'lucide-react';
import { LegalWorkItem, LegalWorkType, LegalWorkStatus } from '../types';
import { AuthSession } from '../services/api';
import { 
  gregorianToHijri, 
  hijriToGregorian, 
  HIJRI_MONTHS, 
  getCurrentHijriDate, 
  formatGregorian 
} from '../utils/dateUtils';

interface LegalWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workData: Partial<LegalWorkItem>, employeeName: string, password: string) => Promise<void>;
  initialWork?: LegalWorkItem | null;
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

const LAWYERS_LIST = [
  'أ. عبد الرحمن السعدي',
  'أ. فهد التميمي',
  'أ. تركي الدوسري',
  'أ. سارة المطيري',
  'أ. خالد الزهراني',
  'أ. محمد الشهري',
];

export const LegalWorkModal: React.FC<LegalWorkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWork,
  session,
}) => {
  const isEditing = !!initialWork;

  const [workNumber, setWorkNumber] = useState('');
  const [workType, setWorkType] = useState<LegalWorkType>('سند لأمر');
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<LegalWorkStatus>('قيد التنفيذ');
  const [priority, setPriority] = useState<'عاجل' | 'عادي' | 'منخفض'>('عادي');
  const [lawyerInCharge, setLawyerInCharge] = useState(LAWYERS_LIST[0]);
  const [notes, setNotes] = useState('');

  // Date Handling (Due Date)
  const [dateInputMode, setDateInputMode] = useState<'gregorian' | 'hijri'>('gregorian');
  const [dueDate, setDueDate] = useState('');
  const [hijriDay, setHijriDay] = useState(1);
  const [hijriMonth, setHijriMonth] = useState(1);
  const [hijriYear, setHijriYear] = useState(1448);

  // Security Credentials
  const [promptEmployeeName, setPromptEmployeeName] = useState('');
  const [promptPassword, setPromptPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentHijri = gregorianToHijri(dueDate);
  const currentGregorianFormatted = formatGregorian(dueDate);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setNameError(null);
      if (initialWork) {
        setWorkNumber(initialWork.workNumber || '');
        setWorkType((initialWork.workType as LegalWorkType) || 'سند لأمر');
        setTitle(initialWork.title || '');
        setClientName(initialWork.clientName || '');
        setClientPhone(initialWork.clientPhone || '');
        setOpponentName(initialWork.opponentName || '');
        setAmount(initialWork.amount ? String(initialWork.amount) : '');
        setStatus(initialWork.status || 'قيد التنفيذ');
        setPriority(initialWork.priority || 'عادي');
        setLawyerInCharge(initialWork.lawyerInCharge || LAWYERS_LIST[0]);
        setNotes(initialWork.notes || '');

        const gDue = initialWork.dueDate || '';
        setDueDate(gDue);
        if (gDue) {
          const h = gregorianToHijri(gDue);
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
      } else {
        const generatedNum = `معاملة-${Math.floor(1000 + Math.random() * 9000)}`;
        setWorkNumber(generatedNum);
        setWorkType('سند لأمر');
        setTitle('');
        setClientName('');
        setClientPhone('');
        setOpponentName('');
        setAmount('');
        setStatus('قيد التنفيذ');
        setPriority('عادي');
        setLawyerInCharge(session?.employeeName || LAWYERS_LIST[0]);
        setNotes('');
        
        const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        setDueDate(defaultDue);
        const h = gregorianToHijri(defaultDue);
        if (h) {
          setHijriDay(h.day);
          setHijriMonth(h.month);
          setHijriYear(h.year);
        }
      }

      if (session) {
        setPromptEmployeeName(session.employeeName || '');
        setPromptPassword(session.role === 'admin' ? (session.adminPassword || '') : (session.employeePassword || ''));
      } else {
        setPromptEmployeeName('');
        setPromptPassword('');
      }
    }
  }, [isOpen, initialWork, session]);

  if (!isOpen) return null;

  const handleApplyHijriDate = () => {
    const convertedG = hijriToGregorian(hijriYear, hijriMonth, hijriDay);
    if (convertedG) setDueDate(convertedG);
  };

  const handleToggleDateMode = () => {
    if (dateInputMode === 'gregorian') {
      if (dueDate) {
        const h = gregorianToHijri(dueDate);
        if (h) {
          setHijriDay(h.day);
          setHijriMonth(h.month);
          setHijriYear(h.year);
        }
      }
      setDateInputMode('hijri');
    } else {
      const convertedG = hijriToGregorian(hijriYear, hijriMonth, hijriDay);
      if (convertedG) setDueDate(convertedG);
      setDateInputMode('gregorian');
    }
  };

  const handleNameChange = (val: string) => {
    setPromptEmployeeName(val);
    if (!val.trim()) {
      setNameError(null);
      return;
    }
    if (/[0-9\u0660-\u0669]/.test(val)) {
      setNameError('ممنوع إدخال الأرقام في اسم المحامي.');
      return;
    }
    const validLetters = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!validLetters.test(val)) {
      setNameError('ممنوع إدخال الرموز أو العلامات الخاصة.');
      return;
    }
    setNameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('يُرجى إدخال موضوع أو وصف العمل القانوني');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('يُرجى إدخال اسم العميل أو المستفيد');
      return;
    }

    const empName = promptEmployeeName.trim();
    if (!empName) {
      setErrorMessage('يُرجى إدخال اسم المحامي للتحقق وتسجيل العملية');
      return;
    }
    if (nameError) {
      setErrorMessage(nameError);
      return;
    }
    if (!promptPassword) {
      setErrorMessage('يُرجى إدخال كلمة المرور لاعتماد العملية');
      return;
    }

    const effectiveDueDate = (dateInputMode === 'hijri'
      ? hijriToGregorian(hijriYear, hijriMonth, hijriDay)
      : dueDate) || '';

    const effectiveHijriObj = effectiveDueDate ? gregorianToHijri(effectiveDueDate) : null;
    const effectiveHijriFormatted = effectiveHijriObj ? effectiveHijriObj.formattedText : '';

    const payload: Partial<LegalWorkItem> = {
      workNumber: workNumber.trim(),
      workType,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      opponentName: opponentName.trim() || '—',
      amount: amount ? Number(amount) : undefined,
      status,
      priority,
      lawyerInCharge: lawyerInCharge.trim(),
      dueDate: effectiveDueDate,
      dueDateHijri: effectiveHijriFormatted,
      notes: notes.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSave(payload, empName, promptPassword);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ العمل القانوني');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-6 text-[#0E141C] dark:text-[#F2EFE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] p-5 flex items-center justify-between border-b border-slate-200 dark:border-[#314B6E]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 flex items-center justify-center shadow-xs text-[#7A6B54] dark:text-[#BDB3A3]">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0E141C] dark:text-[#F2EFE9]">
                {isEditing ? 'تعديل المعاملة / العمل القانوني' : 'إضافة عمل قانوني وتشغيلي جديد'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8197AC] mt-0.5">
                سندات لأمر، عقود واتفاقيات، استشارات، مطالبات، تحصيل، وخدمات الشركات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C2838] hover:bg-slate-200/70 dark:hover:bg-[#314B6E] border border-slate-200 dark:border-[#314B6E] flex items-center justify-center text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2.5 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Work Type & Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                نوع العمل القانوني <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as LegalWorkType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#BDB3A3] dark:border-[#BDB3A3]/60 focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none text-xs font-bold bg-[#F6F2EB] dark:bg-[#1C2838] text-[#0E141C] dark:text-[#F2EFE9]"
              >
                {WORK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                رقم السند / العقد / المعاملة
              </label>
              <input
                type="text"
                value={workNumber}
                onChange={(e) => setWorkNumber(e.target.value)}
                placeholder="مثال: سند-448/01 أو عقد-992"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 2: Title / Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
              موضوع العمل / وصف المعاملة <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تحصيل سند لأمر بمبلغ 150,000 ريال أو صياغة عقد شراكة تجارية"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-medium"
            />
          </div>

          {/* Row 3: Client & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#8197AC]" />
                <span>العميل / المستفيد <span className="text-rose-600 dark:text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم شركة الموكل أو الفرد"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-[#8197AC]" />
                <span>هاتف العميل (اختياري)</span>
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-mono text-right"
              />
            </div>
          </div>

          {/* Row 4: Opponent & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                الطرف الآخر / المدين / الطرف الثاني
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="اسم المدين أو الطرف الثاني بالعقد"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                <span>قيمة السند / المطالبة / العقد (ريال سعودي)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 50000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#7A6B54] dark:text-[#BDB3A3] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 5: Date Input with Gregorian & Hijri toggle */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span>تاريخ الاستحقاق / الإنجاز المستهدف:</span>
              </label>

              <button
                type="button"
                onClick={handleToggleDateMode}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-[#0E141C] dark:text-[#F2EFE9] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] flex items-center gap-1 transition shadow-2xs"
              >
                <ArrowLeftRight className="w-3 h-3 text-[#7A6B54] dark:text-[#BDB3A3]" />
                <span>التبديل إلى {dateInputMode === 'gregorian' ? 'الهجري' : 'الميلادي'}</span>
              </button>
            </div>

            {dateInputMode === 'gregorian' ? (
              <div className="space-y-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-mono font-bold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9]"
                />
                {dueDate && currentHijri && (
                  <div className="text-[11px] text-[#0E141C] dark:text-[#F2EFE9] bg-white dark:bg-[#151E2A] p-2 rounded-lg border border-slate-200 dark:border-[#314B6E] flex items-center justify-between">
                    <span className="font-semibold text-[#7A6B54] dark:text-[#BDB3A3]">الموافق بالهجري: <strong className="text-[#0E141C] dark:text-[#F2EFE9]">{currentHijri.formattedText}</strong></span>
                    <span className="text-[10px] text-slate-500 dark:text-[#8197AC]">(تقويم أم القرى)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 dark:text-[#8197AC] mb-1 font-semibold">اليوم</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={hijriDay}
                      onChange={(e) => {
                        const d = Number(e.target.value);
                        setHijriDay(d);
                        const g = hijriToGregorian(hijriYear, hijriMonth, d);
                        if (g) setDueDate(g);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs text-center font-bold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 dark:text-[#8197AC] mb-1 font-semibold">الشهر</label>
                    <select
                      value={hijriMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setHijriMonth(m);
                        const g = hijriToGregorian(hijriYear, m, hijriDay);
                        if (g) setDueDate(g);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs font-semibold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none"
                    >
                      {HIJRI_MONTHS.map((m) => (
                        <option key={m.num} value={m.num}>{m.num} - {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 dark:text-[#8197AC] mb-1 font-semibold">السنة الهجرية</label>
                    <input
                      type="number"
                      min="1440"
                      max="1460"
                      value={hijriYear}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setHijriYear(y);
                        const g = hijriToGregorian(y, hijriMonth, hijriDay);
                        if (g) setDueDate(g);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#314B6E] text-xs text-center font-bold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-[#8197AC] bg-white dark:bg-[#151E2A] p-2 rounded-lg border border-slate-200 dark:border-[#314B6E] flex items-center justify-between">
                  <span>الموافق بالميلادي: <strong className="text-[#314B6E] dark:text-[#BDB3A3]">{currentGregorianFormatted?.formattedText || dueDate}</strong></span>
                  <button
                    type="button"
                    onClick={handleApplyHijriDate}
                    className="text-[10px] text-[#314B6E] dark:text-[#BDB3A3] font-bold hover:underline"
                  >
                    تأكيد التحويل
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Lawyer, Status, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                المحامي المسؤول <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lawyerInCharge}
                onChange={(e) => setLawyerInCharge(e.target.value)}
                placeholder="اكتب اسم المحامي المسؤول..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-semibold bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                حالة العمل
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LegalWorkStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-semibold bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9]"
              >
                {WORK_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5">
                الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-semibold bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9]"
              >
                <option value="عاجل">عاجل (أولوية قصوى)</option>
                <option value="عادي">عادي</option>
                <option value="منخفض">منخفض</option>
              </select>
            </div>
          </div>

          {/* Row 7: Notes & Last Action */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-[#8197AC] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>أخر إجراء وملاحظات العمل</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سجل الخطوات المنجزة أو الإجراء المطلوب قريباً..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#314B6E] bg-slate-50 dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-medium resize-none"
            />
          </div>

          {/* Security Credentials Section */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] space-y-3">
            <div className="flex items-center gap-2 text-[#0E141C] dark:text-[#F2EFE9] font-bold text-xs">
              <Shield className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>إثبات هوية المحامي لحفظ السجل الرقابي:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                  اسم المحامي <span className="text-rose-600 dark:text-rose-400">*</span>
                  <span className="text-[10px] text-slate-500 dark:text-[#8197AC] font-normal mr-1">(حروف فقط)</span>
                </label>
                <input
                  type="text"
                  required
                  value={promptEmployeeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: فهد التميمي"
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:outline-none ${
                    nameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3]'
                  }`}
                />
                {nameError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8197AC] mb-1">
                  كلمة المرور <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={promptPassword}
                  onChange={(e) => setPromptPassword(e.target.value)}
                  placeholder="كلمة مرور المحامي أو المدير"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:outline-none text-xs font-semibold bg-white dark:bg-[#151E2A] text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#314B6E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !!nameError}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#314B6E] hover:bg-[#243954] text-white shadow-md shadow-slate-900/10 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#BDB3A3]" />
              )}
              <span>{isEditing ? 'حفظ التعديلات' : 'تسجيل العمل القانوني الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
