import { CaseItem, AuditLogItem, SystemSettings, BackupMetadata } from '../types';

export const API_BASE = '/api';

export interface AuthSession {
  role: 'admin' | 'employee';
  employeeName: string;
  adminPassword?: string;
  employeePassword?: string;
}

// Local storage session helpers
const SESSION_KEY = 'kayan_user_session';

export function getSavedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export async function fetchCases(): Promise<{ cases: CaseItem[]; serverTime: string }> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) {
    throw new Error('فشل جلب بيانات القضايا من الخادم');
  }
  const json = await res.json();
  return { cases: json.data || [], serverTime: json.serverTime };
}

export async function fetchFirmInfo(): Promise<{ firmName: string; lastBackupAt?: string }> {
  const res = await fetch(`${API_BASE}/firm-info`);
  const json = await res.json();
  return { firmName: json.firmName, lastBackupAt: json.lastBackupAt };
}

export async function verifyAuth(payload: {
  password: string;
  employeeName?: string;
  requiredRole?: 'admin' | 'employee';
}): Promise<{ role: 'admin' | 'employee'; message: string }> {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل التحقق من كلمة المرور');
  }
  return { role: data.role, message: data.message };
}

export async function createCase(
  caseData: Partial<CaseItem>,
  employeeName: string,
  password: string
): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData, employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل إضافة القضية');
  }
  return data.data;
}

export async function updateCase(
  id: string,
  caseData: Partial<CaseItem>,
  employeeName: string,
  password: string
): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData, employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل تعديل القضية');
  }
  return data.data;
}

export async function deleteCase(
  id: string,
  employeeName: string,
  password: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل حذف القضية');
  }
}

export async function addHearingNote(
  caseId: string,
  noteData: { summary: string; requirement?: string; nextHearingDate?: string; nextHearingTime?: string },
  employeeName: string,
  password: string
): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteData, employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل إضافة الجلسة');
  }
  return data.data;
}

export async function updateCaseStatus(
  caseId: string,
  status: string,
  employeeName: string,
  password: string
): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل تحديث حالة القضية');
  }
  return data.data;
}

export async function addLegalPleading(
  caseId: string,
  pleadingData: {
    title: string;
    date?: string;
    notes?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    fileDataUrl?: string;
  },
  employeeName: string,
  password: string
): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/pleadings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pleadingData, employeeName, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل إضافة اللائحة وإرفاق الملف');
  }
  return data.data;
}

// ======================= ADMIN API =======================

export async function fetchAdminLogs(adminPassword: string): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/admin/logs`, {
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'تعذر تحميل سجل الرقابة');
  }
  return data.data;
}

export async function fetchAdminSettings(adminPassword: string): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'تعذر تحميل إعدادات النظام');
  }
  return data.data;
}

export async function updateAdminSettings(
  adminPassword: string,
  payload: { newEmployeePassword?: string; newAdminPassword?: string; firmName?: string }
): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل تحديث كلمات المرور');
  }
  return data.data;
}

export async function fetchBackups(adminPassword: string): Promise<BackupMetadata[]> {
  const res = await fetch(`${API_BASE}/admin/backups`, {
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل جلب قائمة النسخ الاحتياطية');
  }
  return data.data;
}

export async function triggerManualBackup(adminPassword: string): Promise<string> {
  const res = await fetch(`${API_BASE}/admin/backups/create`, {
    method: 'POST',
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل إنشاء النسخة الاحتياطية');
  }
  return data.filename;
}

export async function deleteAdminLog(adminPassword: string, logId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/logs/${logId}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل حذف هذا السجل');
  }
}

export async function clearAllAdminLogs(adminPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/logs`, {
    method: 'DELETE',
    headers: { 'x-admin-password': adminPassword },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل تفريغ السجل');
  }
}

export async function restoreBackupData(adminPassword: string, backupData: any): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword,
    },
    body: JSON.stringify({ backupData }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'فشل استعادة النسخة الاحتياطية');
  }
}


