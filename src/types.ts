export type CaseStatus = 
  | 'قيد التنفيذ'
  | 'منتهية'
  | 'مؤرشفة'
  | 'قيد النظر';

export type CaseType =
  | 'تجارية'
  | 'عمالية'
  | 'مدنية'
  | 'تنفيذ'
  | 'أحوال شخصية'
  | 'أخرى';

export type HearingStatus =
  | 'بانتظار التحديد'
  | 'محددة'
  | 'مؤجلة'
  | 'منعقدة'
  | 'ملغاة';

export interface HearingNote {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  employeeName: string; // اسم المحامي
  summary: string;
  requirement?: string;
  createdAt: string;
}

export interface LegalPleading {
  id: string;
  title: string;              // عنوان اللائحة / المذكرة
  lawyerName: string;         // اسم المحامي
  date: string;               // تاريخ الإيداع / التقديم
  notes?: string;             // ملخص وملاحظات اللائحة
  fileName?: string;          // اسم الملف المرفق (Word, Excel, etc.)
  fileSize?: string;          // حجم الملف
  fileType?: string;          // نوع الملف
  fileDataUrl?: string;       // بيانات الملف المرفق للتحميل
  createdAt: string;
}

export interface CaseItem {
  id: string;
  caseNumber: string;        // رقم القضية
  title: string;             // اسم القضية / موضوع القضية
  caseType: CaseType | string;// نوع القضية (تجارية-عمالية-مدنية-تنفيذ-أحوال شخصية-أخرى)
  clientName: string;        // المدعي
  opponentName: string;      // المدعى عليه
  court: string;             // المحكمة
  circleNumber?: string;     // الدائرة
  nextHearingDate?: string;  // موعد الجلسة القادم (ميلادي)
  nextHearingTime?: string;  // وقت الجلسة
  status: CaseStatus;        // حالة القضية (قيد التنفيذ-منتهية-مؤرشفة-قيد النظر)
  lawyerInCharge: string;    // المحامي المسؤول
  hearingStatus?: HearingStatus;// حالة الجلسة (بانتظار التحديد-محددة-مؤجلة-منعقدة-ملغاة)
  hearingRequirement?: string;// أخر إجراء / ملاحظات
  caseDetails?: string;      // تفاصيل إضافية
  clientPhone?: string;      // هاتف الموكل
  clientType?: string;       // صفة الموكل
  clientIdNumber?: string;
  opponentIdNumber?: string;
  opponentLawyer?: string;
  claimAmount?: number;
  najizUrl?: string;
  notesHistory: HearingNote[];// سجل الجلسات والملاحظات
  pleadings?: LegalPleading[];// اللوائح والمذكرات والمستندات المرفقة
  createdByName: string;     // اسم المحامي الذي أنشأها
  createdAt: string;         // تاريخ الإنشاء
  lastModifiedByName: string;// اسم آخر محامي عدلها
  lastModifiedAt: string;    // تاريخ آخر تعديل
}

export type ActionType = 
  | 'إضافة قضية'
  | 'تعديل قضية'
  | 'حذف قضية'
  | 'تغيير حالة'
  | 'إضافة جلسة أو ملاحظة'
  | 'إضافة لائحة'
  | 'استعادة نسخة احتياطية'
  | 'تغيير كلمة المرور';

export interface AuditLogItem {
  id: string;
  timestamp: string;         // ISO string
  formattedDate: string;     // عرض بالعربية
  employeeName: string;      // اسم المحامي بدون أرقام أو رموز
  actionType: ActionType;
  caseId?: string;
  caseNumber?: string;
  caseTitle?: string;
  details: string;           // تفصيل ما حدث بدقة
  ip?: string;
}

export interface SystemSettings {
  employeePassword: string;  // افتراضي: "كيان 1423"
  adminPassword: string;     // افتراضي: "123456789"
  firmName: string;          // كيان الإجادة للمحاماة والاستشارات القانونية
  lastBackupAt?: string;
  totalBackupsCount?: number;
}

export interface BackupMetadata {
  filename: string;
  timestamp: string;
  sizeBytes: number;
  casesCount: number;
  logsCount: number;
  type: 'تلقائي' | 'يدوي';
}
