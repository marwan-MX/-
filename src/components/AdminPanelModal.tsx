import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  FileText, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  User, 
  HardDrive, 
  CheckCircle, 
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { AuditLogItem, SystemSettings, BackupMetadata } from '../types';
import { 
  fetchAdminLogs, 
  fetchAdminSettings, 
  updateAdminSettings, 
  fetchBackups, 
  triggerManualBackup, 
  restoreBackupData,
  deleteAdminLog,
  clearAllAdminLogs
} from '../services/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPassword?: string;
  onAdminPasswordChanged: (newPass: string) => void;
  onDataRestored: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminPassword = '',
  onAdminPasswordChanged,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'security' | 'backups' | 'stats'>('logs');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Security Form State
  const [newEmployeePass, setNewEmployeePass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [firmTitle, setFirmTitle] = useState('');
  const [showEmployeePass, setShowEmployeePass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Search & Filter State for Audit Log
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen && adminPassword) {
      loadAllAdminData();
    }
  }, [isOpen, adminPassword]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const [logsData, settingsData, backupsData] = await Promise.all([
        fetchAdminLogs(adminPassword),
        fetchAdminSettings(adminPassword),
        fetchBackups(adminPassword),
      ]);
      setLogs(logsData);
      setSettings(settingsData);
      setBackups(backupsData);
      setNewEmployeePass(settingsData.employeePassword);
      setNewAdminPass(settingsData.adminPassword);
      setFirmTitle(settingsData.firmName);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'فشل تحميل بيانات الإدارة', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const distinctEmployees = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.employeeName) set.add(log.employeeName);
    });
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        !searchQuery ||
        log.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.caseNumber && log.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.caseTitle && log.caseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
      const matchesEmployee = employeeFilter === 'all' || log.employeeName === employeeFilter;

      return matchesSearch && matchesAction && matchesEmployee;
    });
  }, [logs, searchQuery, actionFilter, employeeFilter]);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    try {
      const updated = await updateAdminSettings(adminPassword, {
        newEmployeePassword: newEmployeePass.trim(),
        newAdminPassword: newAdminPass.trim(),
        firmName: firmTitle.trim(),
      });
      setSettings(updated);
      if (newAdminPass.trim() && newAdminPass.trim() !== adminPassword) {
        onAdminPasswordChanged(newAdminPass.trim());
      }
      setFeedbackMessage({ text: 'تم حفظ وتحديث كلمات المرور والإعدادات بنجاح!', type: 'success' });
      const logsData = await fetchAdminLogs(newAdminPass.trim() || adminPassword);
      setLogs(logsData);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'فشل حفظ الإعدادات', type: 'error' });
    }
  };

  const handleCreateBackup = async () => {
    setFeedbackMessage(null);
    try {
      const filename = await triggerManualBackup(adminPassword);
      setFeedbackMessage({ text: `تم إنشاء نسخة احتياطية جديدة بنجاح (${filename})`, type: 'success' });
      const [backupsData, logsData] = await Promise.all([
        fetchBackups(adminPassword),
        fetchAdminLogs(adminPassword),
      ]);
      setBackups(backupsData);
      setLogs(logsData);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'فشل إنشاء النسخة الاحتياطية', type: 'error' });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.cases && !Array.isArray(parsed)) {
          throw new Error('الملف لا يحتوي على بيانات قضايا صحيحة');
        }
        const cases = parsed.cases || parsed;
        const backupData = { cases, logs: parsed.logs || [] };
        
        await restoreBackupData(adminPassword, backupData);
        setFeedbackMessage({ text: 'تمت استعادة البيانات بنجاح من الملف!', type: 'success' });
        onDataRestored();
        loadAllAdminData();
      } catch (err: any) {
        setFeedbackMessage({ text: 'الملف غير صالح: ' + err.message, type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportLogsCSV = () => {
    const headers = ['تاريخ ووقت العملية', 'اسم المحامي', 'نوع الإجراء', 'رقم القضية', 'عنوان القضية', 'تفاصيل التعديل'];
    const rows = filteredLogs.map((l) => [
      `"${l.formattedDate || l.timestamp}"`,
      `"${l.employeeName}"`,
      `"${l.actionType}"`,
      `"${l.caseNumber || ''}"`,
      `"${l.caseTitle || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kayan-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLogs = () => {
    window.print();
  };

  const handleDeleteSingleLog = async (id: string) => {
    try {
      await deleteAdminLog(adminPassword, id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setFeedbackMessage({ text: 'تم حذف هذا السجل بنجاح', type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'فشل حذف السجل', type: 'error' });
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تفريغ ومسح سجل الرقابة كاملاً؟')) return;
    try {
      await clearAllAdminLogs(adminPassword);
      setLogs([]);
      setFeedbackMessage({ text: 'تم تفريغ ومسح سجل الرقابة كاملاً', type: 'success' });
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'فشل مسح السجل', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0E141C] dark:text-[#F2EFE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#314B6E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#314B6E] border border-[#243954] flex items-center justify-center text-[#BDB3A3] shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#0E141C] dark:text-[#F2EFE9]">
                  لوحة التحكم والرقابة الإدارية للمدير
                </h2>
                <span className="bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] text-[10px] font-bold px-2 py-0.5 rounded border border-[#BDB3A3] dark:border-[#BDB3A3]/60">
                  سري ومحمي
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8197AC]">
                متابعة دقيقة لكل ما يضيفه ويعدله المحامون، وإدارة كلمات المرور، والنسخ الاحتياطي الدوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllAdminData}
              title="تحديث البيانات"
              className="p-2 rounded-xl bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] transition shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-slate-500 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] transition shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`p-3 px-6 text-xs flex items-center gap-2 border-b ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 font-medium'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#314B6E] bg-[#F1F4F8] dark:bg-[#0E141C]/80 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#151E2A] border-slate-200 dark:border-[#314B6E] text-[#314B6E] dark:text-[#F2EFE9] border-b-white dark:border-b-[#151E2A] -mb-px'
                : 'border-transparent text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل الرقابة وتتبع المحامين ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'security'
                ? 'bg-white dark:bg-[#151E2A] border-slate-200 dark:border-[#314B6E] text-[#314B6E] dark:text-[#F2EFE9] border-b-white dark:border-b-[#151E2A] -mb-px'
                : 'border-transparent text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>إدارة كلمات المرور والأمان</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'backups'
                ? 'bg-white dark:bg-[#151E2A] border-slate-200 dark:border-[#314B6E] text-[#314B6E] dark:text-[#F2EFE9] border-b-white dark:border-b-[#151E2A] -mb-px'
                : 'border-transparent text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>النسخ الاحتياطي وحماية البيانات ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-[#151E2A] border-slate-200 dark:border-[#314B6E] text-[#314B6E] dark:text-[#F2EFE9] border-b-white dark:border-b-[#151E2A] -mb-px'
                : 'border-transparent text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>إحصائيات إنجاز الفريق</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#0E141C]">
          
          {/* TAB 1: AUDIT LOGS TABLE */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              
              {/* Search & Action Bar */}
              <div className="bg-white dark:bg-[#151E2A] p-3.5 rounded-xl border border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 dark:text-[#8197AC] absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث باسم المحامي، رقم القضية، أو تفاصيل العملية..."
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg pr-9 pl-3 py-1.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                    />
                  </div>

                  {/* Filter by Action Type */}
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg px-2.5 py-1.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                  >
                    <option value="all">جميع الإجراءات</option>
                    <option value="إضافة قضية">إضافة قضية</option>
                    <option value="تعديل قضية">تعديل قضية</option>
                    <option value="حذف قضية">حذف قضية</option>
                    <option value="تغيير حالة">تغيير حالة</option>
                    <option value="تغيير تصنيف الحكم">تغيير تصنيف الحكم</option>
                    <option value="إضافة جلسة أو ملاحظة">إضافة جلسة/ملاحظة</option>
                    <option value="إضافة لائحة">إضافة لائحة ومستند</option>
                    <option value="تغيير كلمة المرور">تغيير كلمة المرور</option>
                  </select>

                  {/* Filter by Employee */}
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-lg px-2.5 py-1.5 text-xs text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                  >
                    <option value="all">جميع المحامين</option>
                    {distinctEmployees.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Export / Print / Clear Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLogsCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F2EB] dark:bg-[#1C2838] hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                    <span>تصدير Excel/CSV</span>
                  </button>

                  <button
                    onClick={handlePrintLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-xs font-semibold text-[#0E141C] dark:text-[#F2EFE9] transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                    <span>طباعة</span>
                  </button>

                  {logs.length > 0 && (
                    <button
                      onClick={handleClearAllLogs}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 border border-rose-200 dark:border-rose-500/40 text-xs font-bold text-rose-700 dark:text-rose-200 transition"
                      title="مسح وتفريغ سجل الرقابة كاملاً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح السجل</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Organized Audit Table */}
              <div className="bg-white dark:bg-[#151E2A] rounded-xl border border-slate-200 dark:border-[#314B6E] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs text-[#0E141C] dark:text-[#F2EFE9]">
                    <thead className="bg-[#F1F4F8] dark:bg-[#0E141C] text-[#314B6E] dark:text-[#BDB3A3] font-bold border-b border-slate-200 dark:border-[#314B6E]">
                      <tr>
                        <th className="py-3 px-3 w-32">التاريخ والوقت</th>
                        <th className="py-3 px-3 w-40">اسم المحامي المسئول</th>
                        <th className="py-3 px-3 w-32">نوع الإجراء</th>
                        <th className="py-3 px-3 w-36">رقم القضية</th>
                        <th className="py-3 px-4">التفاصيل والتغييرات بدقة</th>
                        <th className="py-3 px-3 w-16 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#314B6E]/60">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-[#8197AC]">
                            لا توجد سجلات مسجلة حالياً أو مطابقة للبحث والتصفية.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          let badgeBg = 'bg-slate-100 dark:bg-[#1C2838] text-slate-600 dark:text-[#8197AC] border-slate-200 dark:border-[#314B6E]';
                          if (log.actionType === 'إضافة قضية') {
                            badgeBg = 'bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border-[#BDB3A3] dark:border-[#BDB3A3]/60 font-bold';
                          } else if (log.actionType === 'تعديل قضية') {
                            badgeBg = 'bg-[#EEF2F6] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#8197AC] border-[#314B6E]/25 dark:border-[#314B6E]';
                          } else if (log.actionType === 'حذف قضية') {
                            badgeBg = 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-500/40';
                          } else if (log.actionType === 'تغيير حالة' || log.actionType === 'تغيير تصنيف الحكم') {
                            badgeBg = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/40';
                          } else if (log.actionType === 'إضافة جلسة أو ملاحظة') {
                            badgeBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/40';
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/90 dark:hover:bg-[#1C2838]/70 transition">
                              <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-[#8197AC] font-mono text-[11px]">
                                {log.formattedDate || new Date(log.timestamp).toLocaleDateString('ar-SA')}
                              </td>

                              <td className="py-3 px-3 font-semibold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#314B6E] text-[#BDB3A3] font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                  {log.employeeName.charAt(0)}
                                </span>
                                <span>{log.employeeName}</span>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeBg}`}>
                                  {log.actionType}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono font-bold text-[#314B6E] dark:text-[#BDB3A3] whitespace-nowrap">
                                {log.caseNumber || '—'}
                              </td>

                              <td className="py-3 px-4 text-[#0E141C]/90 dark:text-[#F2EFE9]/90 leading-relaxed">
                                <div>{log.details}</div>
                                {log.caseTitle && (
                                  <div className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-0.5 font-medium">
                                    القضية: {log.caseTitle}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteSingleLog(log.id)}
                                  title="حذف هذا السجل نهائياً"
                                  className="p-1.5 rounded-lg text-slate-400 dark:text-[#8197AC] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORDS */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="bg-[#EEF2F6] dark:bg-[#1C2838] border border-[#314B6E]/25 dark:border-[#314B6E] p-4 rounded-xl text-xs text-[#0E141C] dark:text-[#F2EFE9] leading-relaxed flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#314B6E] dark:text-[#BDB3A3] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#314B6E] dark:text-[#BDB3A3] mb-1">التحكم بكلمات المرور والصلاحيات</h4>
                  <p className="text-slate-600 dark:text-[#8197AC]">
                    أنت الآن بصفتك المدير العام تملك الصلاحية الكاملة لتغيير كلمة مرور المحامين لمنع أي شخص غير مصرح،
                    وكذلك تغيير كلمة مرور المدير لتأمين النظام بشكل دائم.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSecurity} className="bg-white dark:bg-[#151E2A] p-6 rounded-2xl border border-slate-200 dark:border-[#314B6E] space-y-5 shadow-xs">
                
                {/* Employee Password Setting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                      <span>كلمة مرور المحامين (المستخدمة عند الإضافة والتعديل):</span>
                    </label>
                    <span className="text-xs text-slate-500 dark:text-[#8197AC]">الافتراضية: <strong className="text-[#7A6B54] dark:text-[#BDB3A3]">كيان 1423</strong></span>
                  </div>

                  <div className="relative">
                    <input
                      type={showEmployeePass ? 'text' : 'password'}
                      value={newEmployeePass}
                      onChange={(e) => setNewEmployeePass(e.target.value)}
                      required
                      placeholder="اكتب كلمة مرور المحامين..."
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-4 py-2.5 text-sm text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] pr-4 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmployeePass(!showEmployeePass)}
                      className="absolute left-3 top-2.5 text-slate-400 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]"
                    >
                      {showEmployeePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                    هذه هي الكلمة التي يُطلب من المحامي إدخالها مع اسمه عند إضافة قضية، تعديلها، أو حذفها.
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-[#314B6E] pt-4"></div>

                {/* Admin Password Setting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                      <span>كلمة مرور المدير / الإدارة (الوصول للسجلات والتحكم):</span>
                    </label>
                    <span className="text-xs text-slate-500 dark:text-[#8197AC]">الافتراضية: <strong className="text-[#7A6B54] dark:text-[#BDB3A3]">123456789</strong></span>
                  </div>

                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      required
                      placeholder="اكتب كلمة مرور المدير الجديدة..."
                      className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-4 py-2.5 text-sm text-[#0E141C] dark:text-[#F2EFE9] placeholder-slate-400 dark:placeholder-[#8197AC]/60 focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3] pr-4 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute left-3 top-2.5 text-slate-400 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9]"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                    هذه الكلمة خاصة بالمدير فقط وتمنح الصلاحية لرؤية سجل الرقابة والنسخ الاحتياطي والتحكم.
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-[#314B6E] pt-4"></div>

                {/* Firm Name Setting */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9]">
                    اسم المنشأة أو المكتب في الترويسة:
                  </label>
                  <input
                    type="text"
                    value={firmTitle}
                    onChange={(e) => setFirmTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0E141C] border border-slate-300 dark:border-[#314B6E] rounded-xl px-4 py-2.5 text-sm text-[#0E141C] dark:text-[#F2EFE9] focus:bg-white dark:focus:bg-[#1C2838] focus:outline-none focus:border-[#314B6E] dark:focus:border-[#BDB3A3]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-black text-sm bg-[#314B6E] hover:bg-[#243954] text-white shadow-md shadow-slate-900/10 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 text-[#BDB3A3]" />
                  <span>حفظ وتثبيت التعديلات الأمنية فورياً</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: BACKUPS & DATA PROTECTION */}
          {activeTab === 'backups' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Instant Backup */}
                <div className="bg-white dark:bg-[#151E2A] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2F6] dark:bg-[#1C2838] border border-[#314B6E]/20 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] flex items-center justify-center mb-3">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm mb-1">نسخة احتياطية فورية</h3>
                    <p className="text-xs text-slate-500 dark:text-[#8197AC] leading-relaxed mb-4">
                      إنشاء نقطة استعادة فورية لكافة القضايا والسجلات وحفظها على الخادم.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    className="w-full py-2.5 rounded-xl bg-[#314B6E] text-white font-black text-xs hover:bg-[#243954] transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#BDB3A3]" />
                    <span>إنشاء نسخة الآن</span>
                  </button>
                </div>

                {/* Download Backup to Computer */}
                <div className="bg-white dark:bg-[#151E2A] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-[#7A6B54] dark:text-[#BDB3A3] flex items-center justify-center mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm mb-1">تنزيل نسخة على جهازك</h3>
                    <p className="text-xs text-slate-500 dark:text-[#8197AC] leading-relaxed mb-4">
                      حفظ ملف JSON كامل على جهاز الكمبيوتر لضمان أعلى معايير الأمان.
                    </p>
                  </div>
                  <a
                    href={`/api/admin/export?adminPassword=${encodeURIComponent(adminPassword)}`}
                    download
                    className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2838] border border-slate-300 dark:border-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#314B6E] transition flex items-center justify-center gap-2 text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
                    <span>تنزيل الملف (JSON)</span>
                  </a>
                </div>

                {/* Restore Backup */}
                <div className="bg-white dark:bg-[#151E2A] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2F6] dark:bg-[#1C2838] border border-[#314B6E]/20 dark:border-[#314B6E] text-[#314B6E] dark:text-[#BDB3A3] flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0E141C] dark:text-[#F2EFE9] text-sm mb-1">استعادة من ملف سابق</h3>
                    <p className="text-xs text-slate-500 dark:text-[#8197AC] leading-relaxed mb-4">
                      استرجاع بيانات القضايا في حال أردت العودة لنسخة سابقة.
                    </p>
                  </div>
                  <label className="w-full py-2.5 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 text-[#0E141C] dark:text-[#F2EFE9] font-bold text-xs hover:bg-[#EDE6DA] dark:hover:bg-[#314B6E] transition flex items-center justify-center gap-2 text-center cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#7A6B54] dark:text-[#BDB3A3]" />
                    <span>اختيار ملف للاستعادة</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Automatic Periodic Backups List */}
              <div className="bg-white dark:bg-[#151E2A] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-[#0E141C] dark:text-[#F2EFE9]">سجل النسخ الاحتياطية المحفوظة في الخادم</h4>
                    <p className="text-xs text-slate-500 dark:text-[#8197AC]">يقوم النظام تلقائياً بأخذ نسخ دورية منتظمة لحماية البيانات من أي فقدان.</p>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/40 font-semibold">
                    النسخ الدوري مفعل
                  </span>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-[#314B6E]/60 max-h-60 overflow-y-auto">
                  {backups.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 dark:text-[#8197AC]">لا توجد نسخ احتياطية مسجلة بعد.</div>
                  ) : (
                    backups.map((b) => (
                      <div key={b.filename} className="py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2.5">
                          <HardDrive className="w-4 h-4 text-[#314B6E] dark:text-[#BDB3A3]" />
                          <span className="font-mono text-[#0E141C] dark:text-[#F2EFE9]">{b.filename}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            b.type === 'تلقائي'
                              ? 'bg-[#EEF2F6] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#8197AC] border-[#314B6E]/25 dark:border-[#314B6E]'
                              : 'bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] border-[#BDB3A3] dark:border-[#BDB3A3]/60'
                          }`}>
                            {b.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 dark:text-[#8197AC] font-mono text-[11px]">
                          <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                          <span>{new Date(b.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TEAM PERFORMANCE STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#151E2A] p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] text-center shadow-xs">
                  <div className="text-2xl font-black text-[#7A6B54] dark:text-[#BDB3A3] font-mono tabular-nums">{logs.length}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC] mt-1">إجمالي العمليات المسجلة بالسجل</div>
                </div>

                <div className="bg-white dark:bg-[#151E2A] p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] text-center shadow-xs">
                  <div className="text-2xl font-black text-[#0E141C] dark:text-[#F2EFE9] font-mono tabular-nums">
                    {logs.filter((l) => l.actionType === 'إضافة قضية').length}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC] mt-1">قضايا جديدة أضافها المحامون</div>
                </div>

                <div className="bg-white dark:bg-[#151E2A] p-4 rounded-xl border border-slate-200 dark:border-[#314B6E] text-center shadow-xs">
                  <div className="text-2xl font-black text-[#314B6E] dark:text-[#8197AC] font-mono tabular-nums">
                    {logs.filter((l) => l.actionType === 'تعديل قضية' || l.actionType === 'تغيير حالة' || l.actionType === 'تغيير تصنيف الحكم').length}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#8197AC] mt-1">عمليات تحديث وتعديل للقضايا</div>
                </div>
              </div>

              {/* Employee Breakdown List */}
              <div className="bg-white dark:bg-[#151E2A] p-5 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs">
                <h4 className="font-bold text-sm text-[#0E141C] dark:text-[#F2EFE9] mb-3">تفصيل نشاط المحامين في النظام:</h4>
                <div className="space-y-3">
                  {distinctEmployees.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-[#8197AC] py-4 text-center">لا توجد عمليات مسجلة بعد.</div>
                  ) : (
                    distinctEmployees.map((emp) => {
                      const empLogs = logs.filter((l) => l.employeeName === emp);
                      const adds = empLogs.filter((l) => l.actionType === 'إضافة قضية').length;
                      const edits = empLogs.filter((l) => l.actionType === 'تعديل قضية' || l.actionType === 'تغيير حالة' || l.actionType === 'تغيير تصنيف الحكم').length;
                      const notes = empLogs.filter((l) => l.actionType === 'إضافة جلسة أو ملاحظة').length;

                      return (
                        <div key={emp} className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#314B6E] text-[#BDB3A3] font-bold flex items-center justify-center text-xs">
                              {emp.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#0E141C] dark:text-[#F2EFE9]">{emp}</div>
                              <div className="text-[11px] text-slate-500 dark:text-[#8197AC]">
                                آخر نشاط: {empLogs[0]?.formattedDate || '—'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-[#F6F2EB] dark:bg-[#1C2838] text-[#7A6B54] dark:text-[#BDB3A3] font-semibold border border-[#BDB3A3] dark:border-[#BDB3A3]/60">
                              إضافة ({adds})
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-[#EEF2F6] dark:bg-[#1C2838] text-[#314B6E] dark:text-[#8197AC] border border-[#314B6E]/25 dark:border-[#314B6E] font-semibold">
                              تعديل ({edits})
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#151E2A] text-slate-600 dark:text-[#F2EFE9] border border-slate-200 dark:border-[#314B6E]">
                              جلسات ({notes})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8FAFC] dark:bg-[#0E141C] p-3 px-6 border-t border-slate-200 dark:border-[#314B6E] flex items-center justify-between text-xs text-slate-600 dark:text-[#8197AC]">
          <div>
            نظام الرقابة والحماية لـ: <strong className="text-[#314B6E] dark:text-[#BDB3A3]">{settings?.firmName || 'كيان الإجادة'}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#1C2838] hover:bg-slate-100 dark:hover:bg-[#314B6E] border border-slate-300 dark:border-[#314B6E] text-[#0E141C] dark:text-[#F2EFE9] transition font-semibold"
          >
            إغلاق لوحة الإدارة
          </button>
        </div>
      </div>
    </div>
  );
};
