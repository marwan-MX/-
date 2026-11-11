import * as XLSX from 'xlsx';
import { CaseItem } from '../types';

/**
 * Format currency in Saudi Riyals
 */
const formatMoney = (val?: number) => {
  if (val === undefined || val === null) return '0 ر.س';
  return `${Number(val).toLocaleString('ar-SA')} ر.س`;
};

/**
 * Export cases table to an Excel file (.xlsx) with RTL orientation and formatted columns
 */
export const exportToExcel = (cases: CaseItem[], customTitle = 'قضايا_كيان_الإجادة') => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${customTitle}_${dateStr}.xlsx`;

  // Prepare formatted rows
  const data = cases.map((c, index) => {
    return {
      'م': index + 1,
      'رقم القضية': c.caseNumber || '-',
      'عنوان وموضوع القضية': c.title || '-',
      'المدعي': c.clientName || '-',
      'المدعى عليه': c.opponentName || '-',
      'نوع القضية': c.caseType || '-',
      'المحكمة': c.court || '-',
      'الدائرة القضائية': c.circleNumber || '-',
      'حالة القضية': c.status || '-',
      'المحامي المسؤول': c.lawyerInCharge || '-',
      'تاريخ الجلسة القادمة': c.nextHearingDate || 'غير محدد',
      'وقت الجلسة': c.nextHearingTime || '-',
      'حالة الجلسة': c.hearingStatus || 'بانتظار التحديد',
      'أخر إجراء / ملاحظات': c.hearingRequirement || '-',
      'آخر تعديل بواسطة (المحامي)': c.lastModifiedByName || c.createdByName || '-',
      'تاريخ آخر تعديل': c.lastModifiedAt ? new Date(c.lastModifiedAt).toLocaleDateString('ar-SA') : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set RTL orientation for Arabic Excel
  worksheet['!views'] = [{ RTL: true }];

  // Column widths
  worksheet['!cols'] = [
    { wch: 5 },  // م
    { wch: 16 }, // رقم القضية
    { wch: 35 }, // عنوان القضية
    { wch: 25 }, // المدعي
    { wch: 25 }, // المدعى عليه
    { wch: 14 }, // نوع القضية
    { wch: 22 }, // المحكمة
    { wch: 18 }, // الدائرة القضائية
    { wch: 15 }, // حالة القضية
    { wch: 20 }, // المحامي المسؤول
    { wch: 16 }, // تاريخ الجلسة
    { wch: 12 }, // وقت الجلسة
    { wch: 16 }, // حالة الجلسة
    { wch: 35 }, // أخر إجراء
    { wch: 22 }, // آخر تعديل
    { wch: 16 }, // تاريخ آخر تعديل
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'جدول القضايا');

  // Trigger download
  XLSX.writeFile(workbook, filename);
};

/**
 * Export cases table to a Microsoft Word document (.doc) formatted with professional styling and RTL
 */
export const exportToWord = (cases: CaseItem[], customTitle = 'كشف_قضايا_كيان_الإجادة') => {
  const dateStr = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const fileDateStr = new Date().toISOString().split('T')[0];
  const filename = `${customTitle}_${fileDateStr}.doc`;

  const rowsHtml = cases
    .map((c, index) => {
      const isEven = index % 2 === 0;
      const rowBg = isEven ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt;">${index + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; color: #047857; font-size: 11pt; direction: ltr;">${c.caseNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; font-size: 11pt;">${c.title || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${c.clientName || '-'} <br><small style="color: #64748b;">(${c.clientType || 'موكل'})</small></td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11pt;">${c.opponentName || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5pt;">${c.court || '-'}<br><small style="color: #64748b;">${c.circleNumber || ''}</small></td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt;">
            <span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
              ${c.status || '-'}
            </span>
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5pt;">${c.lawyerInCharge || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11pt;">
            ${c.nextHearingDate ? `<strong>${c.nextHearingDate}</strong><br><small style="color: #64748b;">${c.nextHearingTime || ''}</small>` : '<span style="color: #94a3b8;">غير محدد</span>'}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5pt;">${c.hearingRequirement || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: center; color: #475569;">
            ${c.lastModifiedByName || c.createdByName || '-'}<br>
            <small style="color: #94a3b8;">${c.lastModifiedAt ? new Date(c.lastModifiedAt).toLocaleDateString('ar-SA') : ''}</small>
          </td>
        </tr>
      `;
    })
    .join('');

  const wordHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>تقرير جدول القضايا - كيان الإجادة</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 landscape;
          margin: 1.5cm 1cm 1.5cm 1cm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
          text-align: right;
          color: #0f172a;
          background-color: #ffffff;
          margin: 0;
          padding: 20px;
        }
        .header-box {
          border-bottom: 3px double #047857;
          padding-bottom: 15px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 {
          color: #047857;
          font-size: 18pt;
          margin: 0 0 5px 0;
        }
        h2 {
          color: #334155;
          font-size: 13pt;
          margin: 0 0 10px 0;
          font-weight: normal;
        }
        .meta-info {
          font-size: 10.5pt;
          color: #64748b;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 11pt;
        }
        th {
          background-color: #047857;
          color: #ffffff;
          border: 1px solid #065f46;
          padding: 10px 6px;
          font-size: 11pt;
          text-align: center;
        }
        .footer-note {
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-size: 10pt;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body dir="rtl">
      <div class="header-box">
        <table style="width: 100%; border: none; margin-bottom: 10px;">
          <tr style="border: none; background: none;">
            <td style="border: none; text-align: right; vertical-align: top;">
              <h1>كيان الإجادة للمحاماة والاستشارات القانونية</h1>
              <h2>كشف وبيان القضايا المعتمد</h2>
              <div class="meta-info">
                تاريخ الاستخراج: <strong>${dateStr}</strong> | إجمالي القضايا بالقائمة: <strong>${cases.length} قضية</strong>
              </div>
            </td>
            <td style="border: none; text-align: left; vertical-align: top; width: 220px;">
              <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center; font-size: 10pt;">
                <strong>نظام إدارة القضايا المركزي</strong><br>
                نسخة موثقة ومحدثة
              </div>
            </td>
          </tr>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">م</th>
            <th style="width: 90px;">رقم القضية</th>
            <th>موضوع الدعوى</th>
            <th>الموكل</th>
            <th>الخصم</th>
            <th>المحكمة والدائرة</th>
            <th>الحالة</th>
            <th>المحامي</th>
            <th>الجلسة القادمة</th>
            <th>المطلوب / أخر إجراء</th>
            <th>آخر تعديل</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <table style="width: 100%; border: none; margin-top: 40px;">
        <tr style="border: none; background: none;">
          <td style="border: none; text-align: right; width: 50%;">
            <strong>إعداد المحامي المختص:</strong> .....................................<br>
            <small style="color: #64748b;">التوقيع: .....................................</small>
          </td>
          <td style="border: none; text-align: left; width: 50%;">
            <strong>اعتماد الإدارة العامة / الشريك المدير:</strong> .....................................<br>
            <small style="color: #64748b;">الختم الرسمي: .....................................</small>
          </td>
        </tr>
      </table>

      <div class="footer-note">
        <span>مكتب كيان الإجادة للمحاماة والاستشارات القانونية - جميع البيانات سرية ومحمية نظاماً.</span>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};
