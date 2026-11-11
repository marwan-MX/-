import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { CaseTable } from './components/CaseTable';
import { CaseModal } from './components/CaseModal';
import { CaseDetailsModal } from './components/CaseDetailsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { 
  fetchCases, 
  fetchFirmInfo, 
  createCase, 
  updateCase, 
  deleteCase, 
  addHearingNote, 
  addLegalPleading,
  updateCaseStatus,
  getSavedSession, 
  saveSession, 
  AuthSession 
} from './services/api';
import { CaseItem, CaseStatus } from './types';
import { ShieldCheck, AlertCircle, Database, CheckCircle, Scale, Trash2 } from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [firmName, setFirmName] = useState('كيان الإجادة للمحاماة والاستشارات القانونية');
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(getSavedSession());
  const [activeFilter, setActiveFilter] = useState('all');

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

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Delete confirmation modal state
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

  // Load cases from server
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [casesRes, firmRes] = await Promise.all([
        fetchCases(),
        fetchFirmInfo(),
      ]);
      setCases(casesRes.cases);
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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-600/20 selection:text-emerald-950">
      
      {/* Top Header */}
      <Header
        session={session}
        firmName={firmName}
        casesCount={cases.length}
        lastBackupAt={lastBackupAt}
        isSyncing={isSyncing}
        onRefresh={() => loadData(false)}
        onOpenAddModal={handleOpenAddModal}
        onOpenAdminModal={handleOpenAdminModal}
        onOpenAuthModal={() => {
          setAuthModalConfig({
            initialRole: 'employee',
            actionTitle: 'تسجيل دخول محامي',
            actionDescription: 'سجل دخولك لتتمكن من إضافة وتعديل القضايا والجلسات.',
            onSuccessCallback: (s) => setSession(s),
          });
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 animate-bounce">
          <div className={`p-3.5 px-5 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'error'
              ? 'bg-rose-900 border-rose-500 text-white'
              : toast.type === 'info'
              ? 'bg-blue-900 border-blue-500 text-white'
              : 'bg-emerald-800 border-emerald-500 text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* System Information Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>لوحة القضايا المركزية الموحدة</span>
                <span className="text-[11px] font-normal text-slate-500">• قاعدة بيانات متزامنة تلقائياً</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                كل تعديل أو إضافة يقوم بها أي محامي تظهر فوراً لدى المدير وبقية الفريق على كافة الأجهزة دون الحاجة لإرسال روابط جديدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-emerald-900 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>النسخ التلقائي: <strong className="text-emerald-700 font-bold">نشط كل 30 دقيقة</strong></span>
            </div>
          </div>
        </div>

        {/* Stats & KPI Cards */}
        <StatsCards
          cases={cases}
          onFilterChange={(f) => setActiveFilter(f)}
          activeFilter={activeFilter}
        />

        {/* Cases Table */}
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

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <img src="/assets/aistudio/image_c88a22bd.png" alt="لوجو كيان" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-emerald-950 font-bold">{firmName}</span>
            <span>— جميع الحقوق محفوظة</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>نظام الحماية والرقابة الإدارية</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">قاعدة البيانات سحابية مركزية</span>
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

      {/* Delete Confirmation Modal */}
      {deleteTargetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white border border-rose-200 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-rose-900">تأكيد حذف ملف القضية نهائياً</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف ملف القضية رقم:{' '}
                <strong className="text-emerald-800 font-mono font-bold">{deleteTargetCase.caseNumber}</strong>؟
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                سيتم تدوين عملية الحذف باسم المحامي ({session?.employeeName}) في سجل الرقابة التابع للمدير العام.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                إلغاء التراجع
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
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

    </div>
  );
}
