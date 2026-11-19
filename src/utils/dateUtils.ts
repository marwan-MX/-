/**
 * Accurate Hijri (Umm al-Qura) and Gregorian Date Conversion Utilities
 * Utilizes the official Saudi Umm al-Qura astronomical calendar engine built into Intl.
 */

export interface HijriMonth {
  num: number;
  name: string;
}

export const HIJRI_MONTHS: HijriMonth[] = [
  { num: 1, name: 'محرم' },
  { num: 2, name: 'صفر' },
  { num: 3, name: 'ربيع الأول' },
  { num: 4, name: 'ربيع الثاني' },
  { num: 5, name: 'جمادى الأولى' },
  { num: 6, name: 'جمادى الآخرة' },
  { num: 7, name: 'رجب' },
  { num: 8, name: 'شعبان' },
  { num: 9, name: 'رمضان' },
  { num: 10, name: 'شوال' },
  { num: 11, name: 'ذو القعدة' },
  { num: 12, name: 'ذو الحجة' },
];

export interface HijriDateResult {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
  formattedNum: string;    // e.g. "1448/06/02"
  formattedText: string;   // e.g. "2 جمادى الآخرة 1448 هـ"
  formattedFull: string;   // e.g. "الخميس 2 جمادى الآخرة 1448 هـ"
}

export interface GregorianDateResult {
  year: number;
  month: number;
  day: number;
  formattedNum: string;    // e.g. "2026-11-12"
  formattedText: string;   // e.g. "12 نوفمبر 2026 م"
  formattedFull: string;   // e.g. "الخميس 12 نوفمبر 2026 م"
  dayName: string;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const GREGORIAN_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Converts a Gregorian date string (YYYY-MM-DD) to Umm al-Qura Hijri.
 */
export function gregorianToHijri(gDateStr?: string | null): HijriDateResult | null {
  if (!gDateStr || typeof gDateStr !== 'string') return null;
  const parts = gDateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const gDate = new Date(y, m, d);
  if (isNaN(gDate.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const fParts = formatter.formatToParts(gDate);
    let year = 0;
    let month = 0;
    let day = 0;

    for (const p of fParts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
    }

    if (!year || !month || !day) return null;

    const monthObj = HIJRI_MONTHS.find((hm) => hm.num === month);
    const monthName = monthObj ? monthObj.name : `شهر ${month}`;
    const dayName = ARABIC_DAYS[gDate.getDay()];

    return {
      year,
      month,
      day,
      monthName,
      dayName,
      formattedNum: `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
      formattedText: `${day} ${monthName} ${year} هـ`,
      formattedFull: `${dayName} ${day} ${monthName} ${year} هـ`,
    };
  } catch {
    return null;
  }
}

/**
 * Formats a Gregorian date nicely in Arabic (e.g. "الخميس 12 نوفمبر 2026 م")
 */
export function formatGregorian(gDateStr?: string | null): GregorianDateResult | null {
  if (!gDateStr || typeof gDateStr !== 'string') return null;
  const parts = gDateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const gDate = new Date(y, m, d);
  if (isNaN(gDate.getTime())) return null;

  const dayName = ARABIC_DAYS[gDate.getDay()];
  const monthName = GREGORIAN_MONTHS_AR[m] || '';

  return {
    year: y,
    month: m + 1,
    day: d,
    formattedNum: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    formattedText: `${d} ${monthName} ${y} م`,
    formattedFull: `${dayName} ${d} ${monthName} ${y} م`,
    dayName,
  };
}

/**
 * Converts a Hijri (Umm al-Qura) date to Gregorian (YYYY-MM-DD).
 */
export function hijriToGregorian(hYear: number, hMonth: number, hDay: number): string | null {
  if (!hYear || !hMonth || !hDay) return null;
  if (hYear < 1300 || hYear > 1600) return null;
  if (hMonth < 1 || hMonth > 12) return null;
  if (hDay < 1 || hDay > 30) return null;

  try {
    // Approximate Gregorian starting point:
    // 1 Muharram 1440 = 2018-09-11
    const hDays = (hYear - 1440) * 354.367 + (hMonth - 1) * 29.53 + (hDay - 1);
    const baseTime = new Date(2018, 8, 11).getTime();
    const approxTime = baseTime + hDays * 86400000;

    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const getHijriFromDate = (d: Date) => {
      const fParts = formatter.formatToParts(d);
      let y = 0, m = 0, day = 0;
      for (const p of fParts) {
        if (p.type === 'year') y = parseInt(p.value, 10);
        if (p.type === 'month') m = parseInt(p.value, 10);
        if (p.type === 'day') day = parseInt(p.value, 10);
      }
      return { y, m, day };
    };

    const candidate = new Date(approxTime);
    candidate.setHours(12, 0, 0, 0);

    for (let offset = 0; offset <= 35; offset++) {
      for (const sign of [1, -1]) {
        const testDate = new Date(candidate.getTime() + sign * offset * 86400000);
        const h = getHijriFromDate(testDate);
        if (h.y === hYear && h.m === hMonth && h.day === hDay) {
          const yStr = testDate.getFullYear();
          const mStr = String(testDate.getMonth() + 1).padStart(2, '0');
          const dStr = String(testDate.getDate()).padStart(2, '0');
          return `${yStr}-${mStr}-${dStr}`;
        }
        if (offset === 0) break;
      }
    }

    // Fallback: if day was 30 but month in that year only has 29 days, map to day 29 + 1 day
    if (hDay === 30) {
      const g29 = hijriToGregorian(hYear, hMonth, 29);
      if (g29) {
        const d29 = new Date(g29);
        d29.setDate(d29.getDate() + 1);
        const yStr = d29.getFullYear();
        const mStr = String(d29.getMonth() + 1).padStart(2, '0');
        const dStr = String(d29.getDate()).padStart(2, '0');
        return `${yStr}-${mStr}-${dStr}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns today's Hijri date
 */
export function getCurrentHijriDate(): HijriDateResult {
  const todayStr = new Date().toISOString().split('T')[0];
  const res = gregorianToHijri(todayStr);
  if (res) return res;
  return {
    year: 1448,
    month: 6,
    day: 2,
    monthName: 'جمادى الآخرة',
    dayName: 'الخميس',
    formattedNum: '1448/06/02',
    formattedText: '2 جمادى الآخرة 1448 هـ',
    formattedFull: 'الخميس 2 جمادى الآخرة 1448 هـ',
  };
}
