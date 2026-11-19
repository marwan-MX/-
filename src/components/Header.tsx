import React from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  RefreshCw, 
  PlusCircle, 
  Database,
  Lock,
  FilePlus2,
  Sun,
  Moon
} from 'lucide-react';
import { AuthSession } from '../services/api';

interface HeaderProps {
  session: AuthSession | null;
  firmName: string;
  casesCount: number;
  legalWorksCount?: number;
  lastBackupAt?: string;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenAddWorkModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  firmName,
  casesCount,
  legalWorksCount = 0,
  lastBackupAt,
  isSyncing,
  theme,
  onToggleTheme,
  onRefresh,
  onOpenAddModal,
  onOpenAddWorkModal,
  onOpenAdminModal,
  onOpenAuthModal,
  onLogout,
}) => {
  const formatTime = (iso?: string) => {
    if (!iso) return 'منذ قليل';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'منذ قليل';
    }
  };

  return (
    <header className="bg-white/95 dark:bg-[#151E2A]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#314B6E] sticky top-0 z-30 shadow-xs">
      {/* Top bar */}
      <div className="bg-[#F1F4F8] dark:bg-[#0E141C] px-4 py-1.5 text-xs text-slate-600 dark:text-[#8197AC] border-b border-slate-200 dark:border-[#314B6E]/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#314B6E] dark:text-[#BDB3A3]">نظام المزامنة اللحظية الفورية:</span>
          <span className="text-slate-600 dark:text-[#8197AC]">يتم حفظ وتحديث القضايا مركزياً لكافة الأجهزة والروابط بدون الحاجة لإعادة الإرسال.</span>
        </div>
        
        <div className="flex items-center gap-4 text-slate-600 dark:text-[#8197AC] text-[11px]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
            <span>آخر نسخة احتياطية: <strong className="text-[#0E141C] dark:text-[#F2EFE9] font-semibold tabular-nums">{formatTime(lastBackupAt)}</strong></span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-[#314B6E]">|</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
            <span>حماية البيانات مشفرة</span>
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] p-1 shadow-xs border-2 border-[#BDB3A3] dark:border-[#BDB3A3]/70 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/aistudio/image_c88a22bd.png" 
                alt="شعار كيان الإجادة" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-[#0E141C] dark:text-[#F2EFE9]">
                  {firmName || 'كيان الإجادة'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8197AC] font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>للمحاماة والاستشارات القانونية والشرعية</span>
                <span className="text-slate-300 dark:text-[#314B6E]">·</span>
                <span className="text-[#314B6E] dark:text-[#BDB3A3] font-bold tabular-nums">{casesCount} قضية</span>
                <span className="text-slate-300 dark:text-[#314B6E]">·</span>
                <span className="text-[#0E141C] dark:text-[#F2EFE9] font-bold tabular-nums">{legalWorksCount} عمل وخدمة قانونية</span>
              </p>
            </div>
          </div>

          {/* User Session & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            
            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] hover:border-[#607EA2] dark:hover:border-[#BDB3A3] text-[#0E141C] dark:text-[#F2EFE9] text-xs font-bold transition shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-[#BDB3A3]" />
                  <span>الوضع الفاتح</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#314B6E]" />
                  <span>الوضع الداكن</span>
                </>
              )}
            </button>

            {/* Sync Refresh Button */}
            <button
              onClick={onRefresh}
              title="تحديث البيانات لحظياً من الخادم"
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] hover:border-[#607EA2] dark:hover:border-[#BDB3A3] text-slate-600 dark:text-[#8197AC] hover:text-[#314B6E] dark:hover:text-[#F2EFE9] transition shadow-2xs flex items-center justify-center active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#314B6E] dark:text-[#BDB3A3]' : ''}`} />
            </button>

            {/* Session State Badge */}
            {session ? (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] rounded-xl px-3 py-1.5 text-xs shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-[#314B6E] dark:bg-[#BDB3A3]"></div>
                <div className="text-right">
                  <div className="text-[10px] text-[#607EA2] dark:text-[#8197AC] font-bold">
                    {session.role === 'admin' ? 'المدير العام' : 'محامي مصرح'}
                  </div>
                  <div className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-xs">
                    {session.employeeName}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج أو تبديل الحساب"
                  className="mr-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-[#8197AC]">
                <Lock className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                <span className="hidden sm:inline">وضع المشاهدة للعملاء (الأزرار محمية)</span>
                <button
                  onClick={onOpenAuthModal}
                  className="text-[#314B6E] dark:text-[#BDB3A3] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] underline font-bold mr-1 transition"
                >
                  دخول محامي
                </button>
              </div>
            )}

            {/* Admin Panel Button */}
            <button
              onClick={onOpenAdminModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs active:scale-95 whitespace-nowrap shrink-0 ${
                session?.role === 'admin'
                  ? 'bg-[#314B6E] hover:bg-[#243954] text-white border border-[#314B6E]'
                  : 'bg-white dark:bg-[#1C2838] border border-slate-200 dark:border-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] hover:bg-slate-50 dark:hover:bg-[#314B6E] hover:border-[#607EA2]'
              }`}
            >
              <KeyRound className={`w-4 h-4 ${session?.role === 'admin' ? 'text-[#BDB3A3]' : 'text-[#314B6E] dark:text-[#BDB3A3]'}`} />
              <span>لوحة الإدارة والرقابة</span>
            </button>

            {/* Add New Legal Work Button */}
            <button
              onClick={onOpenAddWorkModal}
              title="تسجيل السندات لأمر والعقود والاستشارات والمطالبات والتحصيل وخدمات الشركات"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EAE3D5] dark:hover:bg-[#253549] text-[#0E141C] dark:text-[#F2EFE9] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 transition shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>إضافة عمل جديد</span>
            </button>

            {/* Add Case Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#314B6E] hover:bg-[#243954] text-white transition shadow-sm active:scale-95 whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-[#BDB3A3]" />
              <span>إضافة قضية جديدة</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
