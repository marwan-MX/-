import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { CaseTable } from './components/CaseTable';
import { CaseModal } from './components/CaseModal';
import { CaseDetailsModal } from './components/CaseDetailsModal';
import { LegalWorkTable } from './components/LegalWorkTable';
import { LegalWorkModal } from './components/LegalWorkModal';
import { LegalWorkDetailsModal } from './components/LegalWorkDetailsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { 
  fetchCases, 
  fetchLegalWorks,
  fetchFirmInfo, 
  createCase, 
  updateCase, 
  deleteCase, 
  addHearingNote, 
  addLegalPleading,
  updateCaseStatus,
  updateCaseRuling,
  createLegalWork,
  updateLegalWork,
  deleteLegalWork,
  updateLegalWorkStatus,
  addLegalWorkDocument,
  getSavedSession, 
  saveSession, 
  AuthSession 
} from './services/api';
import { CaseItem, CaseStatus, LegalWorkItem, LegalWorkStatus } from './types';
import { ShieldCheck, AlertCircle, Database, CheckCircle, Scale, Trash2, Briefcase } from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [legalWorks, setLegalWorks] = useState<LegalWorkItem[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'cases' | 'works'>('cases');
  const [firmName, setFirmName] = useState('كيان الإجادة للمحاماة والاستشارات القانونية');
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(getSavedSession());
  const [activeFilter, setActiveFilter] = useState('all');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('kayan_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('kayan_theme', theme);
    } catch {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    initialRole: 'admin' | 'employee';
    actionTitle: string;
    actionDescription: string;
    onSuccessCallback?: (session: AuthSession) => void;
  }>({
    initialRole: 'employee',
    actionTitle: 'التحقق من الهوية والصلاحية',
    actionDescription: 'يُرجى إدخال اسم المحامي وكلمة المرور لإتمام العملية وحماية القضايا.',
  });

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Legal Works Modals state
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<LegalWorkItem | null>(null);
  const [isWorkDetailsModalOpen, setIsWorkDetailsModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<LegalWorkItem | null>(null);
  const [deleteTargetWork, setDeleteTargetWork] = useState<LegalWorkItem | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Delete confirmation modal state for cases
  const [deleteTargetCase, setDeleteTargetCase] = useState<CaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global toast / notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load cases and legal works from server
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [casesRes, worksRes, firmRes] = await Promise.all([
        fetchCases(),
        fetchLegalWorks(),
        fetchFirmInfo(),
      ]);
      setCases(casesRes.cases);
      setLegalWorks(worksRes.works);
      if (firmRes.firmName) setFirmName(firmRes.firmName);
      if (firmRes.lastBackupAt) setLastBackupAt(firmRes.lastBackupAt);
    } catch (err: any) {
      if (!silent) {
        showToast('فشل التزامن مع الخادم المركزي: ' + err.message, 'error');
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic automatic background synchronization (every 5 seconds)
  // Ensures any edit by an employee appears immediately on all other devices without changing link!
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Logout handler
  const handleLogout = () => {
    saveSession(null);
    setSession(null);
    showToast('تم تسجيل الخروج بنجاح. اللوحة الآن في وضع المشاهدة المحمي.', 'info');
  };

  // Protected action runner helper
  const requireAuthAndRun = (action: (validSession: AuthSession) => void, requiredRole: 'admin' | 'employee' = 'employee', title?: string) => {
    if (session && (session.role === 'admin' || session.role === requiredRole)) {
      action(session);
      return;
    }

    setAuthModalConfig({
      initialRole: requiredRole,
      actionTitle: title || (requiredRole === 'admin' ? 'دخول لوحة تحكم المدير' : 'تسجيل دخول محامي للمتابعة'),
      actionDescription: requiredRole === 'admin' 
        ? 'يتطلب الوصول للوحة الرقابة وإدارة كلمات المرور إدخال كلمة مرور المدير.'
        : 'لحماية بيانات القضايا ومنع تعديل العملاء، يجب إدخال اسم المحامي وكلمة المرور.',
      onSuccessCallback: (newSession) => {
        setSession(newSession);
        action(newSession);
      },
    });
    setIsAuthModalOpen(true);
  };

  // Add Case Trigger
  const handleOpenAddModal = () => {
    requireAuthAndRun((activeSession) => {
      setEditingCase(null);
      setIsCaseModalOpen(true);
    }, 'employee', 'إضافة قضية جديدة');
  };

  // Edit Case Trigger
  const handleEditCase = (item: CaseItem) => {
    requireAuthAndRun((activeSession) => {
      setEditingCase(item);
      setIsCaseModalOpen(true);
    }, 'employee', `تعديل القضية: ${item.caseNumber}`);
  };

  // Delete Case Trigger
  const handleDeleteCase = (item: CaseItem) => {
    requireAuthAndRun((activeSession) => {
      setDeleteTargetCase(item);
    }, 'employee', `حذف القضية: ${item.caseNumber}`);
  };

  // Confirm delete execution
  const executeDelete = async () => {
    if (!deleteTargetCase || !session) return;
    setIsDeleting(true);
    try {
      const activePass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
      await deleteCase(deleteTargetCase.id, session.employeeName, activePass || '');
      showToast(`تم حذف ملف القضية (${deleteTargetCase.caseNumber}) بنجاح وتسجيل الإجراء للمدير.`, 'success');
      setDeleteTargetCase(null);
      if (selectedCase?.id === deleteTargetCase.id) {
        setIsDetailsModalOpen(false);
      }
      loadData(false);
    } catch (err: any) {
      showToast(err.message || 'فشل حذف القضية', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Admin Panel Trigger
  const handleOpenAdminModal = () => {
    requireAuthAndRun((activeSession) => {
      setIsAdminModalOpen(true);
    }, 'admin', 'دخول لوحة الرقابة والإدارة المركزية');
  };

  // Save Case (Add or Edit)
  const handleSaveCase = async (caseData: Partial<CaseItem>, employeeName: string, password: string) => {
    if (editingCase) {
      await updateCase(editingCase.id, caseData, employeeName, password);
      showToast('تم تعديل القضية بنجاح وتسجيل العملية في سجل المدير.', 'success');
    } else {
      await createCase(caseData, employeeName, password);
      showToast('تمت إضافة القضية بنجاح وتسجيل المحامي في سجل المدير.', 'success');
    }
    loadData(false);
  };

  // Add Hearing Note
  const handleAddHearingNote = async (
    caseId: string,
    noteData: { summary: string; requirement?: string; nextHearingDate?: string; nextHearingTime?: string }
  ) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        await addHearingNote(caseId, noteData, activeSession.employeeName, pass || '');
        showToast('تمت إضافة الجلسة وتحديث السجل بنجاح.', 'success');
        loadData(false);
      }, 'employee', 'إضافة وقائع جلسة');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await addHearingNote(caseId, noteData, session.employeeName, pass || '');
    setSelectedCase(updated);
    showToast('تمت إضافة الجلسة بنجاح.', 'success');
    loadData(false);
  };

  // Add Legal Pleading with external Word / Excel / PDF file
  const handleAddLegalPleading = async (
    caseId: string,
    pleadingData: {
      title: string;
      date?: string;
      notes?: string;
      fileName?: string;
      fileSize?: string;
      fileType?: string;
      fileDataUrl?: string;
    }
  ) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        const updated = await addLegalPleading(caseId, pleadingData, activeSession.employeeName, pass || '');
        setSelectedCase(updated);
        showToast('تمت إضافة اللائحة وإرفاق الملف بنجاح.', 'success');
        loadData(false);
      }, 'employee', 'إضافة لائحة ومستند');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await addLegalPleading(caseId, pleadingData, session.employeeName, pass || '');
    setSelectedCase(updated);
    showToast('تمت إضافة اللائحة وإرفاق الملف بنجاح.', 'success');
    loadData(false);
  };

  // Quick Status Change
  const handleStatusChange = async (caseId: string, status: CaseStatus) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        await updateCaseStatus(caseId, status, activeSession.employeeName, pass || '');
        showToast(`تم تغيير الحالة إلى [${status}]`, 'success');
        loadData(false);
      }, 'employee', 'تغيير حالة القضية');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await updateCaseStatus(caseId, status, session.employeeName, pass || '');
    setSelectedCase(updated);
    showToast(`تم تغيير الحالة إلى [${status}]`, 'success');
    loadData(false);
  };

  // Quick Ruling Classification Change
  const handleRulingChange = async (caseId: string, rulingClassification: string) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        const updated = await updateCaseRuling(caseId, rulingClassification, activeSession.employeeName, pass || '');
        setSelectedCase(updated);
        showToast(`تم تحديث تصنيف الحكم إلى [${rulingClassification || 'غير محدد'}]`, 'success');
        loadData(false);
      }, 'employee', 'تغيير تصنيف الحكم');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await updateCaseRuling(caseId, rulingClassification, session.employeeName, pass || '');
    setSelectedCase(updated);
    showToast(`تم تحديث تصنيف الحكم إلى [${rulingClassification || 'غير محدد'}]`, 'success');
    loadData(false);
  };

  // ======================= LEGAL WORKS HANDLERS =======================

  // Add Legal Work Trigger
  const handleOpenAddWorkModal = () => {
    requireAuthAndRun((activeSession) => {
      setEditingWork(null);
      setIsWorkModalOpen(true);
    }, 'employee', 'إضافة عمل قانوني وتشغيلي جديد');
  };

  // Edit Legal Work Trigger
  const handleEditWork = (item: LegalWorkItem) => {
    requireAuthAndRun((activeSession) => {
      setEditingWork(item);
      setIsWorkModalOpen(true);
    }, 'employee', `تعديل المعاملة: ${item.workNumber}`);
  };

  // Delete Legal Work Trigger
  const handleDeleteWork = (item: LegalWorkItem) => {
    requireAuthAndRun((activeSession) => {
      setDeleteTargetWork(item);
    }, 'employee', `حذف المعاملة: ${item.workNumber}`);
  };

  // Confirm delete legal work
  const executeDeleteWork = async () => {
    if (!deleteTargetWork || !session) return;
    setIsDeleting(true);
    try {
      const activePass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
      await deleteLegalWork(deleteTargetWork.id, session.employeeName, activePass || '');
      showToast(`تم حذف المعاملة (${deleteTargetWork.workNumber}) بنجاح وتسجيل الإجراء.`, 'success');
      setDeleteTargetWork(null);
      if (selectedWork?.id === deleteTargetWork.id) {
        setIsWorkDetailsModalOpen(false);
      }
      loadData(false);
    } catch (err: any) {
      showToast(err.message || 'فشل حذف العمل القانوني', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Legal Work (Add or Edit)
  const handleSaveLegalWork = async (workData: Partial<LegalWorkItem>, employeeName: string, password: string) => {
    if (editingWork) {
      await updateLegalWork(editingWork.id, workData, employeeName, password);
      showToast('تم تعديل العمل القانوني بنجاح وتسجيل العملية.', 'success');
    } else {
      await createLegalWork(workData, employeeName, password);
      showToast('تم تسجيل العمل القانوني بنجاح وإضافته للجدول.', 'success');
    }
    loadData(false);
  };

  // Quick Status Change for Legal Work
  const handleStatusChangeLegalWork = async (workId: string, status: LegalWorkStatus) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        const updated = await updateLegalWorkStatus(workId, status, activeSession.employeeName, pass || '');
        setSelectedWork(updated);
        showToast(`تم تغيير حالة المعاملة إلى [${status}]`, 'success');
        loadData(false);
      }, 'employee', 'تغيير حالة العمل القانوني');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await updateLegalWorkStatus(workId, status, session.employeeName, pass || '');
    setSelectedWork(updated);
    showToast(`تم تغيير حالة المعاملة إلى [${status}]`, 'success');
    loadData(false);
  };

  // Add Document / File Attachment to Legal Work
  const handleAddLegalWorkDocument = async (
    workId: string,
    documentData: {
      title: string;
      date?: string;
      notes?: string;
      fileName?: string;
      fileSize?: string;
      fileType?: string;
      fileDataUrl?: string;
    }
  ) => {
    if (!session) {
      requireAuthAndRun(async (activeSession) => {
        const pass = activeSession.role === 'admin' ? activeSession.adminPassword : activeSession.employeePassword;
        const updated = await addLegalWorkDocument(workId, documentData, activeSession.employeeName, pass || '');
        setSelectedWork(updated);
        showToast('تم إرفاق المستند بالمعاملة بنجاح.', 'success');
        loadData(false);
      }, 'employee', 'إرفاق مستند بالمعاملة');
      return;
    }

    const pass = session.role === 'admin' ? session.adminPassword : session.employeePassword;
    const updated = await addLegalWorkDocument(workId, documentData, session.employeeName, pass || '');
    setSelectedWork(updated);
    showToast('تم إرفاق المستند بالمعاملة بنجاح.', 'success');
    loadData(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0E141C] text-[#0E141C] dark:text-[#F2EFE9] flex flex-col font-['Cairo',sans-serif] selection:bg-[#314B6E]/15 dark:selection:bg-[#BDB3A3]/30 selection:text-[#314B6E] dark:selection:text-[#F2EFE9]">
      
      {/* Top Header */}
      <Header
        session={session}
        firmName={firmName}
        casesCount={cases.length}
        legalWorksCount={legalWorks.length}
        lastBackupAt={lastBackupAt}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onRefresh={() => loadData(false)}
        onOpenAddModal={handleOpenAddModal}
        onOpenAddWorkModal={handleOpenAddWorkModal}
        onOpenAdminModal={handleOpenAdminModal}
        onOpenAuthModal={() => {
          setAuthModalConfig({
            initialRole: 'employee',
            actionTitle: 'تسجيل دخول محامي',
            actionDescription: 'سجل دخولك لتتمكن من إضافة وتعديل القضايا والمعاملات.',
            onSuccessCallback: (s) => setSession(s),
          });
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 animate-bounce">
          <div className={`p-3.5 px-5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
              : toast.type === 'info'
              ? 'bg-[#314B6E] border-[#314B6E] dark:border-[#607EA2] text-white'
              : 'bg-white dark:bg-[#151E2A] border-[#314B6E]/30 dark:border-[#BDB3A3]/50 text-[#0E141C] dark:text-[#F2EFE9]'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle className={`w-4 h-4 ${toast.type === 'info' ? 'text-[#BDB3A3]' : 'text-[#314B6E] dark:text-[#BDB3A3]'}`} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* System Information Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#151E2A] border border-slate-200 dark:border-[#314B6E] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3]/70 dark:border-[#BDB3A3]/50 flex items-center justify-center text-[#314B6E] dark:text-[#BDB3A3] flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0E141C] dark:text-[#F2EFE9] flex items-center gap-2 flex-wrap">
                <span>المنصة القانونية والتشغيلية الموحدة</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-[#8197AC]">· قاعدة بيانات سحابية متزامنة لحظياً</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#8197AC] mt-0.5">
                متابعة قضايا المحاكم والجلسات، إلى جانب إدارة السندات لأمر والعقود والاستشارات والمطالبات وخدمات الشركات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-[#0E141C] border border-slate-200 dark:border-[#314B6E] rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-slate-600 dark:text-[#8197AC] font-medium">
              <Database className="w-3.5 h-3.5 text-[#314B6E] dark:text-[#BDB3A3]" />
              <span>النسخ التلقائي: <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-bold">نشط كل 30 دقيقة</strong></span>
            </div>
          </div>
        </div>

        {/* Primary View Switcher: Court Cases vs Legal Works & Operations */}
        <div className="mb-6 bg-white dark:bg-[#151E2A] p-2 rounded-2xl border border-slate-200 dark:border-[#314B6E] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            
            {/* Cases Tab Button */}
            <button
              onClick={() => setActiveMainTab('cases')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeMainTab === 'cases'
                  ? 'bg-[#314B6E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838]'
              }`}
            >
              <Scale className={`w-4 h-4 ${activeMainTab === 'cases' ? 'text-[#BDB3A3]' : 'text-slate-500 dark:text-[#8197AC]'}`} />
              <span>قضايا المحاكم والجلسات</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold ${
                activeMainTab === 'cases' ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#BDB3A3]'
              }`}>
                {cases.length}
              </span>
            </button>

            {/* Legal Works Tab Button */}
            <button
              onClick={() => setActiveMainTab('works')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeMainTab === 'works'
                  ? 'bg-[#314B6E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838]'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeMainTab === 'works' ? 'text-[#BDB3A3]' : 'text-slate-500 dark:text-[#8197AC]'}`} />
              <span>الأعمال والخدمات القانونية</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold ${
                activeMainTab === 'works' ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-[#0E141C] text-slate-700 dark:text-[#BDB3A3]'
              }`}>
                {legalWorks.length}
              </span>
            </button>

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8197AC] px-2 font-medium">
            {activeMainTab === 'cases' ? (
              <span>الدوائر، الجلسات، التواريخ، واللوائح المرفوعة للمحاكم</span>
            ) : (
              <span>سندات لأمر، عقود واتفاقيات، استشارات، ومطالبات وتحصيل</span>
            )}
          </div>
        </div>

        {/* TAB 1: Court Cases & Hearings */}
        {activeMainTab === 'cases' && (
          <div className="space-y-6">
            <StatsCards
              cases={cases}
              legalWorksCount={legalWorks.length}
              onFilterChange={(f) => setActiveFilter(f)}
              onOpenLegalWorks={() => setActiveMainTab('works')}
              activeFilter={activeFilter}
            />

            <CaseTable
              cases={cases}
              onViewDetails={(item) => {
                setSelectedCase(item);
                setIsDetailsModalOpen(true);
              }}
              onEditCase={handleEditCase}
              onDeleteCase={handleDeleteCase}
              onAddHearing={(item) => {
                setSelectedCase(item);
                setIsDetailsModalOpen(true);
              }}
              session={session}
              activeFilter={activeFilter}
              onFilterChange={(f) => setActiveFilter(f)}
              onOpenAddModal={handleOpenAddModal}
            />
          </div>
        )}

        {/* TAB 2: Legal Operations & Works */}
        {activeMainTab === 'works' && (
          <div className="space-y-6">
            <LegalWorkTable
              works={legalWorks}
              onViewDetails={(item) => {
                setSelectedWork(item);
                setIsWorkDetailsModalOpen(true);
              }}
              onEditWork={handleEditWork}
              onDeleteWork={handleDeleteWork}
              onOpenAddModal={handleOpenAddWorkModal}
              session={session}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#151E2A] border-t border-slate-200 dark:border-[#314B6E] py-6 text-center text-xs text-slate-600 dark:text-[#8197AC]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#F6F2EB] dark:bg-[#1C2838] border border-[#BDB3A3] dark:border-[#BDB3A3]/60 flex items-center justify-center">
              <img src="/assets/aistudio/image_c88a22bd.png" alt="لوجو كيان" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-[#0E141C] dark:text-[#F2EFE9] font-bold">{firmName}</span>
            <span>— جميع الحقوق محفوظة</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-[#8197AC]">
            <span>نظام الحماية والرقابة الإدارية</span>
            <span className="text-slate-300 dark:text-[#314B6E]">·</span>
            <span className="text-[#314B6E] dark:text-[#BDB3A3] font-bold">قاعدة البيانات سحابية مركزية</span>
          </div>
        </div>
      </footer>

      {/* Auth Verification Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalConfig.initialRole}
        actionTitle={authModalConfig.actionTitle}
        actionDescription={authModalConfig.actionDescription}
        onSuccess={(newSession) => {
          setSession(newSession);
          if (authModalConfig.onSuccessCallback) {
            authModalConfig.onSuccessCallback(newSession);
          }
          showToast(`أهلاً بك، تم التحقق بصلاحية: ${newSession.employeeName}`, 'success');
        }}
      />

      {/* Case Add/Edit Modal */}
      <CaseModal
        isOpen={isCaseModalOpen}
        onClose={() => {
          setIsCaseModalOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSaveCase}
        initialCase={editingCase}
        session={session}
        onRequireAuth={() => {
          setIsCaseModalOpen(false);
          handleOpenAddModal();
        }}
      />

      {/* Case Details & Print Modal */}
      <CaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
        onEdit={(item) => {
          setIsDetailsModalOpen(false);
          handleEditCase(item);
        }}
        onAddNote={handleAddHearingNote}
        onAddPleading={handleAddLegalPleading}
        onStatusChange={handleStatusChange}
        onRulingChange={handleRulingChange}
        session={session}
        onRequireAuth={() => {
          setAuthModalConfig({
            initialRole: 'employee',
            actionTitle: 'التحقق لإضافة جلسة أو لائحة',
            actionDescription: 'يُرجى إدخال اسم المحامي وكلمة المرور لتدوين الجلسة أو اللائحة باسمك.',
            onSuccessCallback: (s) => setSession(s),
          });
          setIsAuthModalOpen(true);
        }}
      />

      {/* Legal Work Add/Edit Modal */}
      <LegalWorkModal
        isOpen={isWorkModalOpen}
        onClose={() => {
          setIsWorkModalOpen(false);
          setEditingWork(null);
        }}
        onSave={handleSaveLegalWork}
        initialWork={editingWork}
        session={session}
      />

      {/* Legal Work Details Modal */}
      <LegalWorkDetailsModal
        isOpen={isWorkDetailsModalOpen}
        onClose={() => {
          setIsWorkDetailsModalOpen(false);
          setSelectedWork(null);
        }}
        work={selectedWork}
        onEdit={(work) => {
          setIsWorkDetailsModalOpen(false);
          handleEditWork(work);
        }}
        onAddDocument={handleAddLegalWorkDocument}
        onStatusChange={handleStatusChangeLegalWork}
        session={session}
        onRequireAuth={() => {
          setAuthModalConfig({
            initialRole: 'employee',
            actionTitle: 'التحقق لإرفاق مستند بالمعاملة',
            actionDescription: 'يُرجى إدخال اسم المحامي وكلمة المرور لتدوين المستند باسمك.',
            onSuccessCallback: (s) => setSession(s),
          });
          setIsAuthModalOpen(true);
        }}
      />

      {/* Admin Panel Modal (Audit Logs, Passwords, Backups) */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        adminPassword={session?.adminPassword || ''}
        onAdminPasswordChanged={(newPass) => {
          if (session) {
            const updated = { ...session, adminPassword: newPass };
            setSession(updated);
            saveSession(updated);
          }
        }}
        onDataRestored={() => {
          loadData(false);
          showToast('تم تحديث الشاشة بالبيانات المستعادة بنجاح.', 'success');
        }}
      />

      {/* Delete Confirmation Modal for Case */}
      {deleteTargetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-[#151E2A] border border-rose-200 dark:border-rose-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-[#0E141C] dark:text-[#F2EFE9]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-300">تأكيد حذف ملف القضية نهائياً</h3>
              <p className="text-xs text-slate-600 dark:text-[#8197AC] mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف ملف القضية رقم:{' '}
                <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-mono font-bold">{deleteTargetCase.caseNumber}</strong>؟
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-1">
                سيتم تدوين عملية الحذف باسم المحامي ({session?.employeeName}) في سجل الرقابة التابع للمدير العام.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838] transition"
              >
                إلغاء التراجع
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center gap-2"
              >
                {isDeleting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>نعم، حذف القضية الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Legal Work */}
      {deleteTargetWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-[#070B10]/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-[#151E2A] border border-rose-200 dark:border-rose-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-[#0E141C] dark:text-[#F2EFE9]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-300">تأكيد حذف المعاملة القانونية</h3>
              <p className="text-xs text-slate-600 dark:text-[#8197AC] mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف المعاملة رقم:{' '}
                <strong className="text-[#314B6E] dark:text-[#BDB3A3] font-mono font-bold">{deleteTargetWork.workNumber}</strong>؟
              </p>
              <p className="text-xs font-bold text-[#0E141C] dark:text-[#F2EFE9] mt-1">
                {deleteTargetWork.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#8197AC] mt-1">
                سيتم تدوين عملية الحذف باسم المحامي ({session?.employeeName}) في سجل الرقابة التابع للمدير العام.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetWork(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8197AC] hover:text-[#0E141C] dark:hover:text-[#F2EFE9] hover:bg-slate-100 dark:hover:bg-[#1C2838] transition"
              >
                إلغاء التراجع
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteWork}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center gap-2"
              >
                {isDeleting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>نعم، حذف المعاملة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
