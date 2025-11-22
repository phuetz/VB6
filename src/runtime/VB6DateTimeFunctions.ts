/**
 * VB6 Date/Time Functions Implementation
 * 
 * Complete implementation of VB6 date and time manipulation functions
 */

// VB6 Date/Time constants
export const VB6DateTimeConstants = {
  // DateAdd intervals
  vbYear: 'yyyy',
  vbQuarter: 'q',
  vbMonth: 'm',
  vbDayOfYear: 'y',
  vbDay: 'd',
  vbWeekday: 'w',
  vbWeek: 'ww',
  vbHour: 'h',
  vbMinute: 'n',
  vbSecond: 's',
  
  // Weekday constants
  vbSunday: 1,
  vbMonday: 2,
  vbTuesday: 3,
  vbWednesday: 4,
  vbThursday: 5,
  vbFriday: 6,
  vbSaturday: 7,
  
  // FirstDayOfWeek constants
  vbUseSystemDayOfWeek: 0,
  vbFirstDayOfWeek: 1,
  
  // FirstWeekOfYear constants
  vbUseSystem: 0,
  vbFirstJan1: 1,
  vbFirstFourDays: 2,
  vbFirstFullWeek: 3
};

/**
 * Add time interval to date
 * DateAdd(interval, number, date)
 */
export function DateAdd(interval: string, number: number, date: Date | string): Date {
  if (!date) throw new Error('Invalid procedure call or argument');
  
  const baseDate = date instanceof Date ? new Date(date) : new Date(date);
  if (isNaN(baseDate.getTime())) {
    throw new Error('Type mismatch - invalid date');
  }
  
  const num = Number(number);
  if (isNaN(num)) {
    throw new Error('Type mismatch - invalid number');
  }
  
  const result = new Date(baseDate);
  
  switch (interval.toLowerCase()) {
    case 'yyyy': // Year
      result.setFullYear(result.getFullYear() + num);
      break;
    case 'q': // Quarter
      result.setMonth(result.getMonth() + (num * 3));
      break;
    case 'm': // Month
      result.setMonth(result.getMonth() + num);
      break;
    case 'y': // Day of year
    case 'd': // Day
      result.setDate(result.getDate() + num);
      break;
    case 'w': // Weekday
      result.setDate(result.getDate() + num);
      break;
    case 'ww': // Week
      result.setDate(result.getDate() + (num * 7));
      break;
    case 'h': // Hour
      result.setHours(result.getHours() + num);
      break;
    case 'n': // Minute
      result.setMinutes(result.getMinutes() + num);
      break;
    case 's': // Second
      result.setSeconds(result.getSeconds() + num);
      break;
    default:
      throw new Error('Invalid procedure call or argument - invalid interval');
  }
  
  return result;
}

/**
 * Calculate difference between two dates
 * DateDiff(interval, date1, date2, [firstdayofweek], [firstweekofyear])
 */
export function DateDiff(
  interval: string, 
  date1: Date | string, 
  date2: Date | string,
  firstDayOfWeek: number = VB6DateTimeConstants.vbSunday,
  firstWeekOfYear: number = VB6DateTimeConstants.vbFirstJan1
): number {
  if (!date1 || !date2) throw new Error('Invalid procedure call or argument');
  
  const d1 = date1 instanceof Date ? new Date(date1) : new Date(date1);
  const d2 = date2 instanceof Date ? new Date(date2) : new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Type mismatch - invalid date');
  }
  
  switch (interval.toLowerCase()) {
    case 'yyyy': // Year
      return d2.getFullYear() - d1.getFullYear();
      
    case 'q': { // Quarter
      const q1 = Math.floor(d1.getMonth() / 3) + 1;
      const q2 = Math.floor(d2.getMonth() / 3) + 1;
      return (d2.getFullYear() - d1.getFullYear()) * 4 + (q2 - q1);
    }
      
    case 'm': // Month
      return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
      
    case 'y': // Day of year
    case 'd': { // Day
      const msPerDay = 24 * 60 * 60 * 1000;
      const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
      return Math.floor((utc2 - utc1) / msPerDay);
    }
      
    case 'w': // Weekday
      return DateDiff('d', date1, date2);
      
    case 'ww': { // Week
      const days = DateDiff('d', date1, date2);
      return Math.floor(days / 7);
    }
      
    case 'h': // Hour
      return Math.floor((d2.getTime() - d1.getTime()) / (60 * 60 * 1000));
      
    case 'n': // Minute
      return Math.floor((d2.getTime() - d1.getTime()) / (60 * 1000));
      
    case 's': // Second
      return Math.floor((d2.getTime() - d1.getTime()) / 1000);
      
    default:
      throw new Error('Invalid procedure call or argument - invalid interval');
  }
}

/**
 * Extract part of date
 * DatePart(interval, date, [firstdayofweek], [firstweekofyear])
 */
export function DatePart(
  interval: string,
  date: Date | string,
  firstDayOfWeek: number = VB6DateTimeConstants.vbSunday,
  firstWeekOfYear: number = VB6DateTimeConstants.vbFirstJan1
): number {
  if (!date) throw new Error('Invalid procedure call or argument');
  
  const d = date instanceof Date ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Type mismatch - invalid date');
  }
  
  switch (interval.toLowerCase()) {
    case 'yyyy': // Year
      return d.getFullYear();
      
    case 'q': // Quarter
      return Math.floor(d.getMonth() / 3) + 1;
      
    case 'm': // Month
      return d.getMonth() + 1; // VB6 months are 1-based
      
    case 'y': { // Day of year
      const start = new Date(d.getFullYear(), 0, 1);
      return Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    }
      
    case 'd': // Day
      return d.getDate();
      
    case 'w': // Weekday
      return d.getDay() + 1; // VB6 weekdays are 1-based (Sunday = 1)
      
    case 'ww': // Week
      return getWeekNumber(d, firstDayOfWeek, firstWeekOfYear);
      
    case 'h': // Hour
      return d.getHours();
      
    case 'n': // Minute
      return d.getMinutes();
      
    case 's': // Second
      return d.getSeconds();
      
    default:
      throw new Error('Invalid procedure call or argument - invalid interval');
  }
}

/**
 * Create date from year, month, day
 * DateSerial(year, month, day)
 */
export function DateSerial(year: number, month: number, day: number): Date {
  const y = Math.floor(Number(year));
  const m = Math.floor(Number(month));
  const d = Math.floor(Number(day));
  
  // Handle 2-digit years like VB6
  let fullYear = y;
  if (y >= 0 && y <= 99) {
    fullYear = y <= 29 ? 2000 + y : 1900 + y;
  }
  
  // VB6 allows months outside 1-12 range
  return new Date(fullYear, m - 1, d); // JavaScript months are 0-based
}

/**
 * Parse date from string
 * DateValue(date)
 */
export function DateValue(dateString: string): Date {
  if (!dateString) throw new Error('Invalid procedure call or argument');
  
  const str = String(dateString).trim();
  const date = new Date(str);
  
  if (isNaN(date.getTime())) {
    // Try some VB6-specific formats
    const vb6Formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // MM/DD/YYYY or MM/DD/YY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // MM-DD-YYYY or MM-DD-YY
      /^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
      /^(\d{2,4})-(\d{1,2})-(\d{1,2})$/ // YYYY-MM-DD
    ];
    
    for (const format of vb6Formats) {
      const match = str.match(format);
      if (match) {
        const [, p1, p2, p3] = match;
        // Assume MM/DD/YYYY format for first two patterns
        if (format === vb6Formats[0] || format === vb6Formats[1]) {
          return DateSerial(Number(p3), Number(p1), Number(p2));
        } else {
          return DateSerial(Number(p1), Number(p2), Number(p3));
        }
      }
    }
    
    throw new Error('Type mismatch - invalid date string');
  }
  
  return date;
}

/**
 * Create time from hour, minute, second
 * TimeSerial(hour, minute, second)
 */
export function TimeSerial(hour: number, minute: number, second: number): Date {
  const h = Math.floor(Number(hour));
  const m = Math.floor(Number(minute));
  const s = Math.floor(Number(second));
  
  const date = new Date(1900, 0, 1); // VB6 date base
  
  // Handle hours outside 0-23 range
  let totalMinutes = h * 60 + m;
  const days = Math.floor(totalMinutes / (24 * 60));
  totalMinutes = totalMinutes % (24 * 60);
  
  date.setDate(date.getDate() + days);
  date.setHours(Math.floor(totalMinutes / 60));
  date.setMinutes(totalMinutes % 60);
  date.setSeconds(s);
  
  return date;
}

/**
 * Parse time from string
 * TimeValue(time)
 */
export function TimeValue(timeString: string): Date {
  if (!timeString) throw new Error('Invalid procedure call or argument');
  
  const str = String(timeString).trim();
  const timeFormats = [
    /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(AM|PM))?$/i,
    /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\s*(AM|PM))$/i
  ];
  
  for (const format of timeFormats) {
    const match = str.match(format);
    if (match) {
      const [, hours, minutes = '0', seconds = '0', ampm] = match;
      let h = Number(hours);
      const m = Number(minutes);
      const s = Number(seconds);
      
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && h !== 12) {
          h += 12;
        } else if (ampm.toUpperCase() === 'AM' && h === 12) {
          h = 0;
        }
      }
      
      return TimeSerial(h, m, s);
    }
  }
  
  throw new Error('Type mismatch - invalid time string');
}

/**
 * Get day of month
 * Day(date)
 */
export function Day(date: Date | string): number {
  if (!date) throw new Error('Invalid procedure call or argument');
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) throw new Error('Type mismatch - invalid date');
  return d.getDate();
}

/**
 * Get month
 * Month(date)
 */
export function Month(date: Date | string): number {
  if (!date) throw new Error('Invalid procedure call or argument');
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) throw new Error('Type mismatch - invalid date');
  return d.getMonth() + 1; // VB6 months are 1-based
}

/**
 * Get year
 * Year(date)
 */
export function Year(date: Date | string): number {
  if (!date) throw new Error('Invalid procedure call or argument');
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) throw new Error('Type mismatch - invalid date');
  return d.getFullYear();
}

/**
 * Get hour
 * Hour(time)
 */
export function Hour(time: Date | string): number {
  if (!time) throw new Error('Invalid procedure call or argument');
  const t = time instanceof Date ? time : new Date(time);
  if (isNaN(t.getTime())) throw new Error('Type mismatch - invalid time');
  return t.getHours();
}

/**
 * Get minute
 * Minute(time)
 */
export function Minute(time: Date | string): number {
  if (!time) throw new Error('Invalid procedure call or argument');
  const t = time instanceof Date ? time : new Date(time);
  if (isNaN(t.getTime())) throw new Error('Type mismatch - invalid time');
  return t.getMinutes();
}

/**
 * Get second
 * Second(time)
 */
export function Second(time: Date | string): number {
  if (!time) throw new Error('Invalid procedure call or argument');
  const t = time instanceof Date ? time : new Date(time);
  if (isNaN(t.getTime())) throw new Error('Type mismatch - invalid time');
  return t.getSeconds();
}

/**
 * Get weekday
 * Weekday(date, [firstdayofweek])
 */
export function Weekday(date: Date | string, firstDayOfWeek: number = VB6DateTimeConstants.vbSunday): number {
  if (!date) throw new Error('Invalid procedure call or argument');
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) throw new Error('Type mismatch - invalid date');
  
  let day = d.getDay(); // 0 = Sunday
  
  // Adjust for firstDayOfWeek
  if (firstDayOfWeek !== VB6DateTimeConstants.vbSunday) {
    day = ((day - (firstDayOfWeek - 1) + 7) % 7) + 1;
  } else {
    day = day + 1; // VB6 weekdays are 1-based
  }
  
  return day;
}

/**
 * Get month name
 * MonthName(month, [abbreviate])
 */
export function MonthName(month: number, abbreviate: boolean = false): string {
  const m = Math.floor(Number(month));
  if (m < 1 || m > 12) {
    throw new Error('Invalid procedure call or argument - month must be 1-12');
  }
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthsAbbr = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return abbreviate ? monthsAbbr[m - 1] : months[m - 1];
}

/**
 * Get weekday name
 * WeekdayName(weekday, [abbreviate], [firstdayofweek])
 */
export function WeekdayName(
  weekday: number, 
  abbreviate: boolean = false, 
  firstDayOfWeek: number = VB6DateTimeConstants.vbSunday
): string {
  const w = Math.floor(Number(weekday));
  if (w < 1 || w > 7) {
    throw new Error('Invalid procedure call or argument - weekday must be 1-7');
  }
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Adjust for firstDayOfWeek
  const index = (w - 1 + (firstDayOfWeek - 1)) % 7;
  
  return abbreviate ? weekdaysAbbr[index] : weekdays[index];
}

/**
 * Get current date
 * Date()
 */
export function VB6Date(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get current time
 * Time()
 */
export function VB6Time(): Date {
  return new Date();
}

/**
 * Get current date and time
 * Now()
 */
export function Now(): Date {
  return new Date();
}

/**
 * Get timer value (seconds since midnight)
 * Timer()
 */
export function Timer(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (now.getTime() - midnight.getTime()) / 1000;
}

// Helper function to calculate week number
function getWeekNumber(date: Date, firstDayOfWeek: number, firstWeekOfYear: number): number {
  const d = new Date(date);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  
  // Simple week calculation (can be enhanced for different firstWeekOfYear values)
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const jan1Day = jan1.getDay();
  
  // Adjust for first day of week
  const adjustedDayOfYear = dayOfYear + ((jan1Day - (firstDayOfWeek - 1) + 7) % 7);
  
  return Math.ceil(adjustedDayOfYear / 7);
}

// Extended date functions
/**
 * Check if year is leap year
 */
export function IsLeapYear(year: number): boolean {
  const y = Math.floor(Number(year));
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

/**
 * Get days in month
 */
export function DaysInMonth(year: number, month: number): number {
  const y = Math.floor(Number(year));
  const m = Math.floor(Number(month));
  
  if (m < 1 || m > 12) {
    throw new Error('Invalid procedure call or argument - month must be 1-12');
  }
  
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (m === 2 && IsLeapYear(y)) {
    return 29;
  }
  
  return daysInMonths[m - 1];
}

/**
 * Get Easter date for given year
 */
export function EasterDate(year: number): Date {
  const y = Math.floor(Number(year));
  
  // Anonymous Gregorian algorithm
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(y, month - 1, day);
}

// Export all date/time functions
export const VB6DateTimeFunctions = {
  // Core VB6 functions
  DateAdd,
  DateDiff,
  DatePart,
  DateSerial,
  DateValue,
  TimeSerial,
  TimeValue,
  Day,
  Month,
  Year,
  Hour,
  Minute,
  Second,
  Weekday,
  MonthName,
  WeekdayName,
  Date: VB6Date,
  Time: VB6Time,
  Now,
  Timer,
  
  // Extended functions
  IsLeapYear,
  DaysInMonth,
  EasterDate,
  
  // Constants
  VB6DateTimeConstants
};