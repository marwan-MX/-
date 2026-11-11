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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white border border-emerald-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Pattern */}
        <div className="bg-emerald-900 p-5 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-lg font-bold text-white">
            {actionTitle}
          </h3>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto leading-relaxed">
            {actionDescription}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRole('employee');
              setGeneralError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'employee'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
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
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>دخول الإدارة والمدير</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Employee Name Input (Strict Validation) */}
          {(role === 'employee' || requireName) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>اسم المحامي المسئول:</span>
                  <span className="text-emerald-700">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition ${
                    nameError 
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>

              {nameError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 leading-snug">
                سيتِم تسجيل هذا الاسم في سجل العمليات الخاص بالمدير عند كل إضافة أو تعديل أو حذف.
              </p>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{role === 'admin' ? 'كلمة مرور المدير / الإدارة:' : 'كلمة مرور المحامي:'}</span>
                <span className="text-emerald-700">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {role === 'admin' ? 'الافتراضية: 123456789' : 'الافتراضية: كيان 1423'}
              </span>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اكتب كلمة المرور هنا..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span>تذكر جلستي لتسهيل متابعة العمل دون إعادة كتابة كلمة المرور</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!nameError}
            className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>تأكيد المتابعة والدخول</span>
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
          <span>هذا النظام مخصص لمحامي كيان الإجادة والمدير فقط؛ يمنع مشاركة كلمة المرور مع العملاء.</span>
        </div>
      </div>
    </div>
  );
};
