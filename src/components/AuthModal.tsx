import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, User, Key, CheckCircle, AlertCircle, X } from 'lucide-react';
import { verifyAuth, saveSession, AuthSession } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  initialRole?: 'admin' | 'employee';
  actionTitle?: string;
  actionDescription?: string;
  requireName?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'employee',
  actionTitle = 'التحقق من الهوية والصلاحية',
  actionDescription = 'لإجراء أي عملية (إضافة، تعديل، حذف)، يجب إدخال اسم المحامي وكلمة المرور لحماية البيانات ومنع تعديل العملاء.',
  requireName = true,
}) => {
  const [role, setRole] = useState<'admin' | 'employee'>(initialRole);
  const [employeeName, setEmployeeName] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setGeneralError(null);
      setNameError(null);
      setPassword('');
      try {
        const raw = localStorage.getItem('kayan_cached_employee_name');
        if (raw) setEmployeeName(raw);
      } catch {}
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmployeeName(val);

    if (!val.trim()) {
      setNameError(null);
      return;
    }

    if (/[0-9\u0660-\u0669]/.test(val)) {
      setNameError('عذراً: ممنوع إدخال الأرقام في خانة اسم المحامي نهائياً وفقاً للتعليمات.');
      return;
    }

    const validRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!validRegex.test(val)) {
      setNameError('عذراً: ممنوع إدخال الرموز أو العلامات الخاصة (@#$%). يُسمح بالحروف والمسافات فقط.');
      return;
    }

    setNameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (role === 'employee' || requireName) {
      const trimmedName = employeeName.trim();
      if (!trimmedName) {
        setNameError('اسم المحامي مطلوب لتسجيل العملية في السجل الرقابي للمدير.');
        return;
      }
      if (/[0-9\u0660-\u0669]/.test(trimmedName)) {
        setNameError('ممنوع إدخال الأرقام في خانة الاسم.');
        return;
      }
      const validRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
      if (!validRegex.test(trimmedName)) {
        setNameError('الاسم يجب أن يتكون من أحرف فقط دون أرقام أو رموز.');
        return;
      }
    }

    if (!password.trim()) {
      setGeneralError('يرجى كتابة كلمة المرور.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyAuth({
        password: password.trim(),
        employeeName: role === 'employee' ? employeeName.trim() : undefined,
        requiredRole: role,
      });

      const session: AuthSession = {
        role: res.role,
        employeeName: role === 'admin' ? (employeeName.trim() || 'المدير العام') : employeeName.trim(),
        adminPassword: res.role === 'admin' ? password.trim() : undefined,
        employeePassword: res.role === 'employee' ? password.trim() : undefined,
      };

      if (rememberMe) {
        saveSession(session);
        if (employeeName.trim()) {
          localStorage.setItem('kayan_cached_employee_name', employeeName.trim());
        }
      }

      onSuccess(session);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative text-[#0E141C] dark:text-[#F2EFE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Pattern */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-5 text-center text-[#0E141C] dark:text-[#F2EFE9] relative border-b border-slate-200 dark:border-[#314B6E]">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-200/70 dark:hover:bg-[#1C2838] transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50 flex items-center justify-center mb-2 shadow-2xs">
            <Lock className="w-6 h-6 text-[#314B6E] dark:text-[#BDB3A3]" />
          </div>

          <h3 className="text-lg font-bold text-[#0E141C] dark:text-[#F2EFE9]">
            {actionTitle}
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#8197AC] mt-1 max-w-sm mx-auto leading-relaxed">
            {actionDescription}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#314B6E] bg-[#F1F4F8] dark:bg-[#0E141C]/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRole('employee');
              setGeneralError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'employee'
                ? 'bg-[#314B6E] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-white/70 dark:hover:bg-[#1C2838]'
            }`}
          >
            <User className={`w-4 h-4 ${role === 'employee' ? 'text-[#BDB3A3]' : 'text-slate-500 dark:text-[#8197AC]'}`} />
            <span>دخول محامي</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setGeneralError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-[#314B6E] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-white/70 dark:hover:bg-[#1C2838]'
            }`}
          >
            <Key className={`w-4 h-4 ${role === 'admin' ? 'text-[#BDB3A3]' : 'text-slate-500 dark:text-[#8197AC]'}`} />
            <span>دخول الإدارة والمدير</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Employee Name Input (Strict Validation) */}
          {(role === 'employee' || requireName) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1">
                  <span>اسم المحامي المسئول:</span>
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-[#7A6B54] dark:text-[#BDB3A3] font-bold bg-[#F6F2EB] dark:bg-[#1C2838] px-2 py-0.5 rounded border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50">
                  ممنوع الأرقام والرموز
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={employeeName}
                  onChange={handleNameChange}
                  placeholder="مثال: أحمد عبد الله السعدي"
                  required
                  className={`w-full bg-slate-50 dark:bg-[#0E141C] border rounded-xl px-3.5 py-2.5 text-sm text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#151E2A] focus:outline-none transition ${
                    nameError 
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                      : 'border-slate-300 dark:border-[#314B6E] focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:ring-1 focus:ring-[#314B6E]/25 dark:focus:ring-[#BDB3A3]/30'
                  }`}
                />
              </div>

              {nameError && (
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-xs mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{nameError}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-[#8197AC] leading-snug">
                سيتم تسجيل هذا الاسم في سجل العمليات الخاص بالمدير عند كل إضافة أو تعديل أو حذف.
              </p>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1">
                <span>{role === 'admin' ? 'كلمة مرور المدير / الإدارة:' : 'كلمة مرور المحامي:'}</span>
                <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-[#8197AC] font-mono">
                {role === 'admin' ? 'الافتراضية: 123456789' : 'الافتراضية: كيان 1423'}
              </span>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اكتب كلمة المرور هنا..."
              required
              className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-3.5 py-2.5 text-sm text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#151E2A] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] focus:ring-1 focus:ring-[#314B6E]/25 dark:focus:ring-[#BDB3A3]/30 transition"
            />
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#8197AC] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-[#314B6E] bg-white dark:bg-[#0E141C] accent-[#314B6E] dark:accent-[#BDB3A3]"
              />
              <span>تذكر جلستي لتسهيل متابعة العمل دون إعادة كتابة كلمة المرور</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!nameError}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#314B6E] hover:bg-[#243954] text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle className="w-4 h-4 text-[#BDB3A3]" />
            )}
            <span>تأكيد المتابعة والدخول</span>
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3 border-t border-slate-200 dark:border-[#314B6E] text-[11px] text-slate-600 dark:text-[#8197AC] text-center flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
          <span>هذا النظام مخصص لمحامي كيان الإجادة والمدير فقط؛ يمنع مشاركة كلمة المرور مع العملاء.</span>
        </div>
      </div>
    </div>
  );
};
