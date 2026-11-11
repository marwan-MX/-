import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const CASES_FILE = path.join(DATA_DIR, 'cases.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Initial Default Settings
const DEFAULT_SETTINGS = {
  employeePassword: 'كيان 1423',
  adminPassword: '123456789',
  firmName: 'كيان الإجادة للمحاماة والاستشارات القانونية',
  lastBackupAt: new Date().toISOString(),
  totalBackupsCount: 1,
};

// Seed Cases if not exist
const SEED_CASES = [
  {
    id: 'case-101',
    caseNumber: '4410291-ق',
    title: 'دعوى مطالبة بمستحقات توريد ومقاولات',
    clientName: 'شركة الإنجاز للتطوير العقاري',
    clientPhone: '0551234567',
    clientType: 'مدعي',
    opponentName: 'مؤسسة البناء المتطور للمقاولات',
    court: 'المحكمة التجارية بالرياض',
    circleNumber: 'الدائرة التجارية السادسة',
    caseType: 'قضايا تجارية',
    status: 'قيد النظر',
    nextHearingDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    nextHearingTime: '10:30',
    hearingRequirement: 'تقديم مذكرة الرد على تقرير الخبير المحاسبي',
    lawyerInCharge: 'أ. عبد الرحمن السعدي',
    notesHistory: [
      {
        id: 'note-1',
        date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
        time: '11:00',
        employeeName: 'محمد الشهري',
        summary: 'حضور الجلسة التمهيدية وتحديد موعد لرد الخبير',
        requirement: 'إرفاق كشف الحساب البنكي',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ],
    createdByName: 'أحمد القحطاني',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    lastModifiedByName: 'محمد الشهري',
    lastModifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'case-102',
    caseNumber: '4430982-ع',
    title: 'دعوى عمالية - مستحقات نهاية خدمة ومكافأة',
    clientName: 'م. خالد إبراهيم العتيبي',
    clientPhone: '0509876543',
    clientType: 'مدعي',
    opponentName: 'شركة التقنية الحديثة للاتصالات',
    court: 'المحكمة العمالية بجدة',
    circleNumber: 'الدائرة العمالية الثالثة',
    caseType: 'قضايا عمالية',
    status: 'قيد التنفيذ',
    nextHearingDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    nextHearingTime: '09:00',
    hearingRequirement: 'إيداع صك الحكم التمهيدي والمسيرات',
    lawyerInCharge: 'أ. فهد التميمي',
    notesHistory: [],
    createdByName: 'سارة المطيري',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    lastModifiedByName: 'سارة المطيري',
    lastModifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'case-103',
    caseNumber: '4399120-ح',
    title: 'فسخ عقد إيجار تجاري وإخلاء عقار',
    clientName: 'سليمان عبد العزيز الراجحي',
    clientPhone: '0543322114',
    clientType: 'مدعي',
    opponentName: 'شركة الواحة للمطاعم',
    court: 'المحكمة العامة بالدمام',
    circleNumber: 'الدائرة العقارية الثانية',
    caseType: 'قضايا عقارية',
    status: 'منتهية',
    nextHearingDate: '',
    nextHearingTime: '',
    hearingRequirement: 'استلام الصك النهائي وإحالته لقاضي التنفيذ',
    lawyerInCharge: 'أ. تركي الدوسري',
    notesHistory: [
      {
        id: 'note-2',
        date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        time: '12:15',
        employeeName: 'أحمد القحطاني',
        summary: 'صدور الحكم بفسخ العقد وإلزام المدعى عليه بالإخلاء ودفع الأجرة المتبقية',
        requirement: 'الانتظار لمضي مدة الاستئناف النظامية',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    createdByName: 'أحمد القحطاني',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    lastModifiedByName: 'أحمد القحطاني',
    lastModifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'case-104',
    caseNumber: '4451004-ت',
    title: 'طلب تنفيذ سند لأمر وشيك بدون رصيد',
    clientName: 'مؤسسة الرؤية للتسويق',
    clientPhone: '0567788990',
    clientType: 'طالب تنفيذ',
    opponentName: 'مؤسسة الشامل للتجارة',
    court: 'محكمة التنفيذ بالرياض',
    circleNumber: 'دائرة التنفيذ الخامسة',
    caseType: 'تنفيذ',
    status: 'قيد التنفيذ',
    nextHearingDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    nextHearingTime: '11:30',
    hearingRequirement: 'تفعيل قرارات المادة 46 ضد المنفذ ضده',
    lawyerInCharge: 'أ. عبد الرحمن السعدي',
    notesHistory: [],
    createdByName: 'خالد الزهراني',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    lastModifiedByName: 'خالد الزهراني',
    lastModifiedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Helper functions for reading and writing files safely
function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Helpers
function getSettings() {
  return readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
}

function getCases(): any[] {
  return readJSON<any[]>(CASES_FILE, SEED_CASES);
}

function getLogs(): any[] {
  return readJSON<any[]>(LOGS_FILE, [
    {
      id: 'log-seed-1',
      timestamp: new Date(Date.now() - 86400000 * 20).toISOString(),
      formattedDate: new Date(Date.now() - 86400000 * 20).toLocaleString('ar-SA'),
      employeeName: 'أحمد القحطاني',
      actionType: 'إضافة قضية',
      caseId: 'case-101',
      caseNumber: '4410291-ق',
      caseTitle: 'دعوى مطالبة بمستحقات توريد ومقاولات',
      details: 'تم إنشاء ملف القضية وتعيين المحامي عبد الرحمن السعدي',
      ip: '127.0.0.1',
    },
  ]);
}

// Automated backup snapshot creator
function createAutoBackup(type: 'تلقائي' | 'يدوي' = 'تلقائي') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type === 'تلقائي' ? 'auto' : 'manual'}-${timestamp}.json`;
    const backupData = {
      timestamp: new Date().toISOString(),
      type,
      settings: getSettings(),
      cases: getCases(),
      logs: getLogs(),
    };
    fs.writeFileSync(path.join(BACKUPS_DIR, filename), JSON.stringify(backupData, null, 2), 'utf-8');

    // Keep max 50 backups
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    if (files.length > 50) {
      files.sort();
      const toDelete = files.slice(0, files.length - 50);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUPS_DIR, file));
      }
    }

    const currentSettings = getSettings();
    currentSettings.lastBackupAt = new Date().toISOString();
    currentSettings.totalBackupsCount = (currentSettings.totalBackupsCount || 0) + 1;
    writeJSON(SETTINGS_FILE, currentSettings);
    return filename;
  } catch (err) {
    console.error('Failed to create backup:', err);
    return null;
  }
}

// Validate lawyer name: STRICTLY Arabic and English letters and spaces only. No numbers, no symbols!
function validateEmployeeName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'اسم المحامي مطلوب' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'اسم المحامي يجب أن يتكون من حرفين على الأقل' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'اسم المحامي طويل جداً' };
  }
  // Check if it contains digits:
  if (/[0-9\u0660-\u0669]/.test(trimmed)) {
    return { valid: false, error: 'ممنوع إدخال الأرقام في خانة اسم المحامي نهائياً' };
  }
  // Check if it contains symbols/punctuation:
  // Allow only Arabic letters [\u0600-\u06FF], Latin letters [a-zA-Z], and spaces.
  const validRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
  if (!validRegex.test(trimmed)) {
    return { valid: false, error: 'ممنوع إدخال الرموز الخاصة أو العلامات في خانة اسم المحامي. يُسمح فقط بالحروف العربية والإنجليزية والمسافات' };
  }
  return { valid: true };
}

// Authenticate helper
function verifyPassword(password: string, allowAdminOnly = false): { success: boolean; role?: 'admin' | 'employee'; error?: string } {
  if (!password) {
    return { success: false, error: 'كلمة المرور مطلوبة' };
  }
  const settings = getSettings();
  const trimmed = password.trim();

  if (trimmed === settings.adminPassword.trim()) {
    return { success: true, role: 'admin' };
  }

  if (!allowAdminOnly && trimmed === settings.employeePassword.trim()) {
    return { success: true, role: 'employee' };
  }

  return { success: false, error: 'كلمة المرور غير صحيحة' };
}

// Add an audit log entry
function addAuditLog(entry: {
  employeeName: string;
  actionType: string;
  caseId?: string;
  caseNumber?: string;
  caseTitle?: string;
  details: string;
  ip?: string;
}) {
  const logs = getLogs();
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }),
    employeeName: entry.employeeName.trim(),
    actionType: entry.actionType,
    caseId: entry.caseId,
    caseNumber: entry.caseNumber,
    caseTitle: entry.caseTitle,
    details: entry.details,
    ip: entry.ip || '127.0.0.1',
  };
  logs.unshift(newLog);
  writeJSON(LOGS_FILE, logs);
  return newLog;
}

// Initialize files if not existing
if (!fs.existsSync(SETTINGS_FILE)) {
  writeJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
}
if (!fs.existsSync(CASES_FILE)) {
  writeJSON(CASES_FILE, SEED_CASES);
}
if (!fs.existsSync(LOGS_FILE)) {
  writeJSON(LOGS_FILE, []);
}

// Periodically create auto backup every 30 minutes
setInterval(() => {
  createAutoBackup('تلقائي');
}, 30 * 60 * 1000);

// ======================= API ROUTES =======================

// Public: Get all cases
app.get('/api/cases', (req, res) => {
  const cases = getCases();
  res.json({
    success: true,
    data: cases,
    serverTime: new Date().toISOString(),
  });
});

// Public: Get firm info
app.get('/api/firm-info', (req, res) => {
  const settings = getSettings();
  res.json({
    success: true,
    firmName: settings.firmName,
    lastBackupAt: settings.lastBackupAt,
  });
});

// Auth Verification
app.post('/api/auth/verify', (req, res) => {
  const { password, employeeName, requiredRole } = req.body;
  const isTargetAdmin = requiredRole === 'admin';
  const auth = verifyPassword(password, isTargetAdmin);

  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  // If employee name provided, validate it
  if (employeeName) {
    const val = validateEmployeeName(employeeName);
    if (!val.valid) {
      return res.status(400).json({ success: false, message: val.error });
    }
  }

  return res.json({
    success: true,
    role: auth.role,
    message: auth.role === 'admin' ? 'تم الدخول بصلاحيات المدير بنجاح' : 'تم التحقق من كلمة مرور المحامي بنجاح',
  });
});

// Add Case (Protected: requires employeeName & password)
app.post('/api/cases', (req, res) => {
  const { password, employeeName, caseData } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  if (!caseData || !caseData.title || !caseData.caseNumber || !caseData.clientName) {
    return res.status(400).json({ success: false, message: 'بيانات القضية الأساسية ناقصة' });
  }

  const cases = getCases();
  const newCaseId = `case-${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newCase = {
    ...caseData,
    id: newCaseId,
    createdByName: employeeName.trim(),
    createdAt: nowIso,
    lastModifiedByName: employeeName.trim(),
    lastModifiedAt: nowIso,
    notesHistory: Array.isArray(caseData.notesHistory) ? caseData.notesHistory : [],
  };

  cases.unshift(newCase);
  writeJSON(CASES_FILE, cases);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'إضافة قضية',
    caseId: newCase.id,
    caseNumber: newCase.caseNumber,
    caseTitle: newCase.title,
    details: `تمت إضافة قضية جديدة برقم (${newCase.caseNumber}) للموكل (${newCase.clientName}) ضد (${newCase.opponentName || 'بدون'}) في محكمة (${newCase.court || 'غير محددة'})`,
    ip: req.ip,
  });

  // Create immediate backup snapshot
  createAutoBackup('تلقائي');

  return res.json({
    success: true,
    data: newCase,
    message: 'تم إضافة القضية بنجاح وتسجيل العملية في سجل الرقابة',
  });
});

// Edit Case (Protected)
app.put('/api/cases/:id', (req, res) => {
  const { id } = req.params;
  const { password, employeeName, caseData } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  const cases = getCases();
  const index = cases.findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'القضية غير موجودة' });
  }

  const oldCase = cases[index];
  const changes: string[] = [];

  if (oldCase.status !== caseData.status) {
    changes.push(`تغيير الحالة من [${oldCase.status}] إلى [${caseData.status}]`);
  }
  if (oldCase.nextHearingDate !== caseData.nextHearingDate) {
    changes.push(`تعديل موعد الجلسة إلى [${caseData.nextHearingDate || 'غير محدد'}]`);
  }
  if (oldCase.hearingRequirement !== caseData.hearingRequirement) {
    changes.push(`تعديل متطلبات الجلسة`);
  }
  if (oldCase.court !== caseData.court) {
    changes.push(`تعديل المحكمة إلى [${caseData.court}]`);
  }
  if (oldCase.lawyerInCharge !== caseData.lawyerInCharge) {
    changes.push(`تغيير المحامي المسؤول إلى [${caseData.lawyerInCharge}]`);
  }
  if (changes.length === 0) {
    changes.push('تحديث وتعديل عام في بيانات القضية');
  }

  const nowIso = new Date().toISOString();
  const updatedCase = {
    ...oldCase,
    ...caseData,
    id: oldCase.id,
    createdByName: oldCase.createdByName,
    createdAt: oldCase.createdAt,
    lastModifiedByName: employeeName.trim(),
    lastModifiedAt: nowIso,
  };

  cases[index] = updatedCase;
  writeJSON(CASES_FILE, cases);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'تعديل قضية',
    caseId: updatedCase.id,
    caseNumber: updatedCase.caseNumber,
    caseTitle: updatedCase.title,
    details: `تم تعديل بيانات القضية: ${changes.join(' • ')}`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    data: updatedCase,
    message: 'تم حفظ التعديلات بنجاح وتسجيل المحامي في سجل الرقابة',
  });
});

// Delete Case (Protected)
app.delete('/api/cases/:id', (req, res) => {
  const { id } = req.params;
  const { password, employeeName } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  const cases = getCases();
  const targetCase = cases.find((c: any) => c.id === id);
  if (!targetCase) {
    return res.status(404).json({ success: false, message: 'القضية غير موجودة' });
  }

  const filtered = cases.filter((c: any) => c.id !== id);
  writeJSON(CASES_FILE, filtered);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'حذف قضية',
    caseId: targetCase.id,
    caseNumber: targetCase.caseNumber,
    caseTitle: targetCase.title,
    details: `تم حذف ملف القضية رقم (${targetCase.caseNumber}) للموكل (${targetCase.clientName}) نهائياً من اللوحة`,
    ip: req.ip,
  });

  createAutoBackup('يدوي');

  return res.json({
    success: true,
    message: 'تم حذف القضية بنجاح وتسجيل عملية الحذف في سجل الرقابة للمدير',
  });
});

// Quick Hearing / Note Add (Protected)
app.post('/api/cases/:id/notes', (req, res) => {
  const { id } = req.params;
  const { password, employeeName, noteData } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  const cases = getCases();
  const caseItem = cases.find((c: any) => c.id === id);
  if (!caseItem) {
    return res.status(404).json({ success: false, message: 'القضية غير موجودة' });
  }

  const newNote = {
    id: `note-${Date.now()}`,
    date: noteData.date || new Date().toISOString().split('T')[0],
    time: noteData.time || '',
    employeeName: employeeName.trim(),
    summary: noteData.summary,
    requirement: noteData.requirement || '',
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(caseItem.notesHistory)) {
    caseItem.notesHistory = [];
  }
  caseItem.notesHistory.unshift(newNote);
  caseItem.lastModifiedByName = employeeName.trim();
  caseItem.lastModifiedAt = new Date().toISOString();

  // If next hearing date is provided, update it
  if (noteData.nextHearingDate) {
    caseItem.nextHearingDate = noteData.nextHearingDate;
  }
  if (noteData.nextHearingTime) {
    caseItem.nextHearingTime = noteData.nextHearingTime;
  }
  if (noteData.requirement) {
    caseItem.hearingRequirement = noteData.requirement;
  }

  writeJSON(CASES_FILE, cases);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'إضافة جلسة أو ملاحظة',
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber,
    caseTitle: caseItem.title,
    details: `تمت إضافة ملخص جلسة/إجراء: ${noteData.summary.substring(0, 100)}${noteData.requirement ? ` (المطلوب: ${noteData.requirement})` : ''}`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    data: caseItem,
    message: 'تم إضافة الجلسة وتحديث السجل',
  });
});

// Add Legal Pleading with file attachment (Word, Excel, etc.) (Protected)
app.post('/api/cases/:id/pleadings', (req, res) => {
  const { id } = req.params;
  const { password, employeeName, pleadingData } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  if (!pleadingData || !pleadingData.title) {
    return res.status(400).json({ success: false, message: 'عنوان وموضوع اللائحة مطلوب' });
  }

  const cases = getCases();
  const caseItem = cases.find((c: any) => c.id === id);
  if (!caseItem) {
    return res.status(404).json({ success: false, message: 'القضية غير موجودة' });
  }

  const newPleading = {
    id: `pleading-${Date.now()}`,
    title: pleadingData.title.trim(),
    lawyerName: employeeName.trim(),
    date: pleadingData.date || new Date().toISOString().split('T')[0],
    notes: pleadingData.notes || '',
    fileName: pleadingData.fileName || '',
    fileSize: pleadingData.fileSize || '',
    fileType: pleadingData.fileType || '',
    fileDataUrl: pleadingData.fileDataUrl || '',
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(caseItem.pleadings)) {
    caseItem.pleadings = [];
  }
  caseItem.pleadings.unshift(newPleading);
  caseItem.lastModifiedByName = employeeName.trim();
  caseItem.lastModifiedAt = new Date().toISOString();

  writeJSON(CASES_FILE, cases);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'إضافة لائحة',
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber,
    caseTitle: caseItem.title,
    details: `تمت إضافة لائحة جديدة بعنوان (${newPleading.title})${newPleading.fileName ? ` ومرفق ملف (${newPleading.fileName})` : ''}`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    data: caseItem,
    message: 'تم إضافة اللائحة وإرفاق الملف بنجاح',
  });
});

// Quick Status Update (Protected)
app.patch('/api/cases/:id/status', (req, res) => {
  const { id } = req.params;
  const { password, employeeName, status } = req.body;

  const auth = verifyPassword(password);
  if (!auth.success) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  const nameVal = validateEmployeeName(employeeName);
  if (!nameVal.valid) {
    return res.status(400).json({ success: false, message: nameVal.error });
  }

  const cases = getCases();
  const caseItem = cases.find((c: any) => c.id === id);
  if (!caseItem) {
    return res.status(404).json({ success: false, message: 'القضية غير موجودة' });
  }

  const oldStatus = caseItem.status;
  caseItem.status = status;
  caseItem.lastModifiedByName = employeeName.trim();
  caseItem.lastModifiedAt = new Date().toISOString();

  writeJSON(CASES_FILE, cases);

  // Audit Log
  addAuditLog({
    employeeName,
    actionType: 'تغيير حالة',
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber,
    caseTitle: caseItem.title,
    details: `تم تغيير حالة القضية من [${oldStatus}] إلى [${status}]`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    data: caseItem,
    message: 'تم تحديث حالة القضية وتسجيل الإجراء',
  });
});

// ======================= ADMIN ONLY ROUTES =======================

// Middleware to verify admin password for all /api/admin/*
app.use('/api/admin', (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'] || req.body.adminPassword || req.query.adminPassword;
  const auth = verifyPassword(String(adminPassword || ''), true);
  if (!auth.success) {
    return res.status(403).json({ success: false, message: 'عذراً، يتطلب الوصول صلاحيات المدير (كلمة مرور المدير)' });
  }
  next();
});

// Get Audit Logs (Admin only)
app.get('/api/admin/logs', (req, res) => {
  const logs = getLogs();
  return res.json({
    success: true,
    data: logs,
  });
});

// Clear Audit Logs (Admin only)
app.delete('/api/admin/logs', (req, res) => {
  writeJSON(LOGS_FILE, []);
  return res.json({
    success: true,
    message: 'تم تفريغ السجل الرقابي بنجاح',
  });
});

// Delete single log entry (Admin only)
app.delete('/api/admin/logs/:id', (req, res) => {
  const { id } = req.params;
  const logs = getLogs();
  const filtered = logs.filter((l: any) => l.id !== id);
  writeJSON(LOGS_FILE, filtered);
  return res.json({
    success: true,
    message: 'تم حذف السجل بنجاح',
  });
});

// Get System Settings (Admin only)
app.get('/api/admin/settings', (req, res) => {
  const settings = getSettings();
  return res.json({
    success: true,
    data: {
      employeePassword: settings.employeePassword,
      adminPassword: settings.adminPassword,
      firmName: settings.firmName,
      lastBackupAt: settings.lastBackupAt,
      totalBackupsCount: settings.totalBackupsCount || 0,
    },
  });
});

// Update System Settings (e.g. Change Employee Password, Change Admin Password)
app.post('/api/admin/settings', (req, res) => {
  const { newEmployeePassword, newAdminPassword, firmName } = req.body;
  const settings = getSettings();

  const changes: string[] = [];
  if (newEmployeePassword && newEmployeePassword.trim() !== '') {
    settings.employeePassword = newEmployeePassword.trim();
    changes.push('تغيير كلمة مرور المحامين');
  }

  if (newAdminPassword && newAdminPassword.trim() !== '') {
    if (newAdminPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة مرور المدير يجب أن تكون 6 خانات على الأقل' });
    }
    settings.adminPassword = newAdminPassword.trim();
    changes.push('تغيير كلمة مرور المدير');
  }

  if (firmName && firmName.trim() !== '') {
    settings.firmName = firmName.trim();
    changes.push('تعديل اسم المنشأة القانونية');
  }

  writeJSON(SETTINGS_FILE, settings);

  addAuditLog({
    employeeName: 'المدير العام',
    actionType: 'تغيير كلمة المرور',
    details: `قام المدير بإجراء تعديلات على الإعدادات الأمنية: ${changes.join(' ، ')}`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    data: {
      employeePassword: settings.employeePassword,
      adminPassword: settings.adminPassword,
      firmName: settings.firmName,
    },
    message: 'تم تحديث الإعدادات وكلمات المرور بنجاح',
  });
});

// List Backups (Admin only)
app.get('/api/admin/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    const backups = files.map((filename) => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, filename));
      return {
        filename,
        timestamp: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        type: filename.includes('auto') ? 'تلقائي' : 'يدوي',
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({
      success: true,
      data: backups,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'تعذر جلب النسخ الاحتياطية' });
  }
});

// Trigger Instant Manual Backup (Admin only)
app.post('/api/admin/backups/create', (req, res) => {
  const filename = createAutoBackup('يدوي');
  if (filename) {
    addAuditLog({
      employeeName: 'المدير العام',
      actionType: 'إضافة قضية',
      details: `تم إنشاء نسخة احتياطية فورية وحفظها بنجاح: ${filename}`,
      ip: req.ip,
    });
    return res.json({
      success: true,
      filename,
      message: 'تم أخذ نسخة احتياطية آمنة بنجاح وحفظها في الخادم',
    });
  }
  return res.status(500).json({ success: false, message: 'فشل إنشاء النسخة الاحتياطية' });
});

// Download / Export All Data (Admin only)
app.get('/api/admin/export', (req, res) => {
  const data = {
    exportDate: new Date().toISOString(),
    firmName: getSettings().firmName,
    cases: getCases(),
    logs: getLogs(),
    settings: {
      employeePassword: getSettings().employeePassword,
      firmName: getSettings().firmName,
    },
  };
  res.setHeader('Content-disposition', `attachment; filename=kayan-backup-${Date.now()}.json`);
  res.setHeader('Content-type', 'application/json');
  return res.send(JSON.stringify(data, null, 2));
});

// Restore Backup (Admin only)
app.post('/api/admin/restore', (req, res) => {
  const { backupData } = req.body;
  if (!backupData || !Array.isArray(backupData.cases)) {
    return res.status(400).json({ success: false, message: 'بيانات النسخة الاحتياطية غير صالحة' });
  }

  // Backup current state first before restoring
  createAutoBackup('يدوي');

  writeJSON(CASES_FILE, backupData.cases);
  if (Array.isArray(backupData.logs)) {
    writeJSON(LOGS_FILE, backupData.logs);
  }

  addAuditLog({
    employeeName: 'المدير العام',
    actionType: 'استعادة نسخة احتياطية',
    details: `تمت استعادة نسخة احتياطية تحتوي على (${backupData.cases.length}) قضية بنجاح`,
    ip: req.ip,
  });

  return res.json({
    success: true,
    message: `تم استعادة النسخة الاحتياطية بنجاح (${backupData.cases.length} قضية)`,
  });
});

// ======================= FRONTEND HANDLING =======================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kayan Al-Ijada Legal Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
