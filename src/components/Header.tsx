import React from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  RefreshCw, 
  PlusCircle, 
  Database,
  Lock
} from 'lucide-react';
import { AuthSession } from '../services/api';

interface HeaderProps {
  session: AuthSession | null;
  firmName: string;
  casesCount: number;
  lastBackupAt?: string;
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  firmName,
  casesCount,
  lastBackupAt,
  isSyncing,
  onRefresh,
  onOpenAddModal,
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
    <header className="bg-white/95 backdrop-blur-md border-b border-emerald-200/80 sticky top-0 z-30 shadow-sm">
      {/* Top green announcement bar */}
      <div className="bg-emerald-900 px-4 py-1.5 text-xs text-emerald-50 border-b border-emerald-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-bold text-white">نظام المزامنة اللحظية الفورية:</span>
          <span className="text-emerald-100">يتم حفظ وتحديث القضايا مركزياً لكافة الأجهزة والروابط بدون الحاجة لإعادة الإرسال.</span>
        </div>
        
        <div className="flex items-center gap-4 text-emerald-100 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>آخر نسخة احتياطية: <strong className="text-white font-semibold">{formatTime(lastBackupAt)}</strong></span>
          </span>
          <span className="hidden sm:inline text-emerald-700">|</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>حماية البيانات مشفرة</span>
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand Identity (Targeted Element) */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-md border-2 border-emerald-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/aistudio/image_c88a22bd.png" 
                alt="شعار كيان الإجادة" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-emerald-950">
                  {firmName || 'كيان الإجادة'}
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  لوحة القضايا بالشعار
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                <span>للمحاماة والاستشارات القانونية والشرعية</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold">{casesCount} قضية مسجلة</span>
              </p>
            </div>
          </div>

          {/* User Session & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            
            {/* Sync Refresh Button */}
            <button
              onClick={onRefresh}
              title="تحديث البيانات لحظياً من الخادم"
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 transition shadow-xs flex items-center justify-center active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Session State Badge */}
            {session ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-700 font-bold">
                    {session.role === 'admin' ? 'المدير العام' : 'محامي مصرح'}
                  </div>
                  <div className="font-bold text-emerald-950 text-xs">
                    {session.employeeName}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج أو تبديل الحساب"
                  className="mr-1 p-1 hover:bg-emerald-100 text-rose-600 hover:text-rose-700 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">وضع المشاهدة للعملاء (الأزرار محمية)</span>
                <button
                  onClick={onOpenAuthModal}
                  className="text-emerald-700 hover:text-emerald-800 underline font-bold mr-1"
                >
                  دخول محامي
                </button>
              </div>
            )}

            {/* Admin Panel Button */}
            <button
              onClick={onOpenAdminModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 ${
                session?.role === 'admin'
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20'
                  : 'bg-white border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>لوحة الإدارة والرقابة</span>
            </button>

            {/* Add Case Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-md shadow-emerald-700/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة قضية جديدة</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
