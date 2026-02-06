/**
 * Time and Date API - Complete VB6 Time/Date Implementation
 * Provides comprehensive time and date manipulation functions
 */

// Time API Constants
export enum TIME_ZONE_ID {
  TIME_ZONE_ID_UNKNOWN = 0,
  TIME_ZONE_ID_STANDARD = 1,
  TIME_ZONE_ID_DAYLIGHT = 2,
}

export interface SYSTEMTIME {
  wYear: number;
  wMonth: number;
  wDayOfWeek: number;
  wDay: number;
  wHour: number;
  wMinute: number;
  wSecond: number;
  wMilliseconds: number;
}

export interface FILETIME {
  dwLowDateTime: number;
  dwHighDateTime: number;
}

export interface TIME_ZONE_INFORMATION {
  Bias: number;
  StandardName: string;
  StandardDate: SYSTEMTIME;
  StandardBias: number;
  DaylightName: string;
  DaylightDate: SYSTEMTIME;
  DaylightBias: number;
}

// Time and Date API Implementation
class TimeAPI {
  // BROWSER COMPATIBILITY FIX: Performance API with fallback
  private static performanceStart = TimeAPI.getHighResolutionTime();

  // System Time Functions
  static GetSystemTime(): SYSTEMTIME {
    const now = new Date();
    return {
      wYear: now.getUTCFullYear(),
      wMonth: now.getUTCMonth() + 1, // VB6 months are 1-based
      wDayOfWeek: now.getUTCDay(),
      wDay: now.getUTCDate(),
      wHour: now.getUTCHours(),
      wMinute: now.getUTCMinutes(),
      wSecond: now.getUTCSeconds(),
      wMilliseconds: now.getUTCMilliseconds(),
    };
  }

  static GetLocalTime(): SYSTEMTIME {
    const now = new Date();
    return {
      wYear: now.getFullYear(),
      wMonth: now.getMonth() + 1, // VB6 months are 1-based
      wDayOfWeek: now.getDay(),
      wDay: now.getDate(),
      wHour: now.getHours(),
      wMinute: now.getMinutes(),
      wSecond: now.getSeconds(),
      wMilliseconds: now.getMilliseconds(),
    };
  }

  static SetSystemTime(systemTime: SYSTEMTIME): boolean {
    // Cannot actually set system time in browser environment
    console.warn('SetSystemTime: Cannot modify system time in browser environment');
    return false;
  }

  static SetLocalTime(systemTime: SYSTEMTIME): boolean {
    // Cannot actually set local time in browser environment
    console.warn('SetLocalTime: Cannot modify local time in browser environment');
    return false;
  }

  // File Time Functions
  static SystemTimeToFileTime(systemTime: SYSTEMTIME): FILETIME {
    const date = new Date(
      systemTime.wYear,
      systemTime.wMonth - 1, // Convert from 1-based to 0-based
      systemTime.wDay,
      systemTime.wHour,
      systemTime.wMinute,
      systemTime.wSecond,
      systemTime.wMilliseconds
    );

    // Convert to Windows FILETIME (100-nanosecond intervals since Jan 1, 1601)
    const windowsEpoch = new Date(1601, 0, 1).getTime();
    const fileTime = (date.getTime() - windowsEpoch) * 10000;

    return {
      dwLowDateTime: fileTime & 0xffffffff,
      dwHighDateTime: Math.floor(fileTime / 0x100000000),
    };
  }

  static FileTimeToSystemTime(fileTime: FILETIME): SYSTEMTIME {
    // Convert from Windows FILETIME to Date
    const windowsEpoch = new Date(1601, 0, 1).getTime();
    const combinedTime = fileTime.dwHighDateTime * 0x100000000 + fileTime.dwLowDateTime;
    const jsTime = windowsEpoch + combinedTime / 10000;

    const date = new Date(jsTime);
    return {
      wYear: date.getFullYear(),
      wMonth: date.getMonth() + 1,
      wDayOfWeek: date.getDay(),
      wDay: date.getDate(),
      wHour: date.getHours(),
      wMinute: date.getMinutes(),
      wSecond: date.getSeconds(),
      wMilliseconds: date.getMilliseconds(),
    };
  }

  static FileTimeToLocalFileTime(fileTime: FILETIME): FILETIME {
    const systemTime = TimeAPI.FileTimeToSystemTime(fileTime);
    const utcDate = new Date(
      Date.UTC(
        systemTime.wYear,
        systemTime.wMonth - 1,
        systemTime.wDay,
        systemTime.wHour,
        systemTime.wMinute,
        systemTime.wSecond,
        systemTime.wMilliseconds
      )
    );

    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    const localSystemTime: SYSTEMTIME = {
      wYear: localDate.getFullYear(),
      wMonth: localDate.getMonth() + 1,
      wDayOfWeek: localDate.getDay(),
      wDay: localDate.getDate(),
      wHour: localDate.getHours(),
      wMinute: localDate.getMinutes(),
      wSecond: localDate.getSeconds(),
      wMilliseconds: localDate.getMilliseconds(),
    };

    return TimeAPI.SystemTimeToFileTime(localSystemTime);
  }

  static LocalFileTimeToFileTime(localFileTime: FILETIME): FILETIME {
    const systemTime = TimeAPI.FileTimeToSystemTime(localFileTime);
    const localDate = new Date(
      systemTime.wYear,
      systemTime.wMonth - 1,
      systemTime.wDay,
      systemTime.wHour,
      systemTime.wMinute,
      systemTime.wSecond,
      systemTime.wMilliseconds
    );

    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
    const utcSystemTime: SYSTEMTIME = {
      wYear: utcDate.getFullYear(),
      wMonth: utcDate.getMonth() + 1,
      wDayOfWeek: utcDate.getDay(),
      wDay: utcDate.getDate(),
      wHour: utcDate.getHours(),
      wMinute: utcDate.getMinutes(),
      wSecond: utcDate.getSeconds(),
      wMilliseconds: utcDate.getMilliseconds(),
    };

    return TimeAPI.SystemTimeToFileTime(utcSystemTime);
  }

  // Time Zone Functions
  static GetTimeZoneInformation(): { result: TIME_ZONE_ID; timeZoneInfo: TIME_ZONE_INFORMATION } {
    const now = new Date();
    const january = new Date(now.getFullYear(), 0, 1);
    const july = new Date(now.getFullYear(), 6, 1);
    const standardOffset = Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());
    const daylightOffset = Math.min(january.getTimezoneOffset(), july.getTimezoneOffset());
    const isDST = now.getTimezoneOffset() === daylightOffset;

    // Get timezone name (limited in browser)
    const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

    const timeZoneInfo: TIME_ZONE_INFORMATION = {
      Bias: now.getTimezoneOffset(),
      StandardName: `${timeZoneName} Standard Time`,
      StandardDate: {
        wYear: 0,
        wMonth: 11, // November (approximate)
        wDayOfWeek: 0,
        wDay: 1,
        wHour: 2,
        wMinute: 0,
        wSecond: 0,
        wMilliseconds: 0,
      },
      StandardBias: 0,
      DaylightName: `${timeZoneName} Daylight Time`,
      DaylightDate: {
        wYear: 0,
        wMonth: 3, // March (approximate)
        wDayOfWeek: 0,
        wDay: 2,
        wHour: 2,
        wMinute: 0,
        wSecond: 0,
        wMilliseconds: 0,
      },
      DaylightBias: -60, // -1 hour
    };

    const result = isDST ? TIME_ZONE_ID.TIME_ZONE_ID_DAYLIGHT : TIME_ZONE_ID.TIME_ZONE_ID_STANDARD;

    return { result, timeZoneInfo };
  }

  // Performance Counter Functions
  static GetTickCount(): number {
    // HARDWARE CACHE TIMING BUG FIX: Add jitter and reduce precision
    const baseTime = Math.floor(TimeAPI.getHighResolutionTime());
    return baseTime + Math.floor(TimeAPI.getTimingJitter());
  }

  static GetTickCount64(): bigint {
    // HARDWARE CACHE TIMING BUG FIX: Add jitter and reduce precision
    const baseTime = Math.floor(TimeAPI.getHighResolutionTime());
    const jitter = Math.floor(TimeAPI.getTimingJitter());
    return BigInt(baseTime + jitter);
  }

  static QueryPerformanceCounter(): bigint {
    // HARDWARE CACHE TIMING BUG FIX: Add timing jitter to prevent cache timing attacks
    const baseTime = Math.floor(
      (TimeAPI.getHighResolutionTime() - TimeAPI.performanceStart) * 1000
    );
    const jitter = Math.floor(TimeAPI.getTimingJitter() * 1000);
    return BigInt(baseTime + jitter);
  }

  // HARDWARE CACHE TIMING BUG FIX: Reduced precision timing to prevent cache timing attacks
  private static getHighResolutionTime(): number {
    // Check for Performance API
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      try {
        const highResTime = performance.now();
        // HARDWARE CACHE TIMING BUG FIX: Reduce precision to prevent cache state inference
        const reducedPrecision = Math.floor(highResTime / 5) * 5; // 5ms quantization
        return reducedPrecision + TimeAPI.getTimingJitter();
      } catch (err) {
        console.warn('performance.now() failed, using Date fallback:', err);
      }
    }

    // Fallback to Date.now() with reduced precision
    const dateTime = Date.now();
    const reducedPrecision = Math.floor(dateTime / 100) * 100; // 100ms quantization
    return reducedPrecision + TimeAPI.getTimingJitter();
  }

  static QueryPerformanceFrequency(): bigint {
    // HARDWARE CACHE TIMING BUG FIX: Reduce frequency to prevent high-precision timing attacks
    return BigInt(200); // 200 Hz (5ms precision) instead of 1MHz to prevent cache timing
  }

  // VB6-compatible Date/Time Functions
  static Now(): Date {
    return new Date();
  }

  static Today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  static Time(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS format
  }

  static Date(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US'); // MM/DD/YYYY format
  }

  static Timer(): number {
    // VB6 Timer function - seconds since midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (now.getTime() - midnight.getTime()) / 1000;
  }

  static DateAdd(interval: string, number: number, date: Date): Date {
    const result = new Date(date);

    switch (interval.toLowerCase()) {
      case 'yyyy': // Year
        result.setFullYear(result.getFullYear() + number);
        break;
      case 'q': // Quarter
        result.setMonth(result.getMonth() + number * 3);
        break;
      case 'm': // Month
        result.setMonth(result.getMonth() + number);
        break;
      case 'y': // Day of year
      case 'd': // Day
        result.setDate(result.getDate() + number);
        break;
      case 'w': // Weekday
        result.setDate(result.getDate() + number);
        break;
      case 'ww': // Week
        result.setDate(result.getDate() + number * 7);
        break;
      case 'h': // Hour
        result.setHours(result.getHours() + number);
        break;
      case 'n': // Minute
        result.setMinutes(result.getMinutes() + number);
        break;
      case 's': // Second
        result.setSeconds(result.getSeconds() + number);
        break;
    }

    return result;
  }

  static DateDiff(interval: string, date1: Date, date2: Date): number {
    const diffMs = date2.getTime() - date1.getTime();

    switch (interval.toLowerCase()) {
      case 'yyyy': // Year
        return date2.getFullYear() - date1.getFullYear();
      case 'q': {
        // Quarter
        const q1 = Math.floor(date1.getMonth() / 3) + 1;
        const q2 = Math.floor(date2.getMonth() / 3) + 1;
        return (date2.getFullYear() - date1.getFullYear()) * 4 + (q2 - q1);
      }
      case 'm': // Month
        return (
          (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth())
        );
      case 'y': // Day of year
      case 'd': // Day
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'w': // Weekday
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'ww': // Week
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'h': // Hour
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'n': // Minute
        return Math.floor(diffMs / (1000 * 60));
      case 's': // Second
        return Math.floor(diffMs / 1000);
      default:
        return 0;
    }
  }

  static DatePart(interval: string, date: Date): number {
    switch (interval.toLowerCase()) {
      case 'yyyy': // Year
        return date.getFullYear();
      case 'q': // Quarter
        return Math.floor(date.getMonth() / 3) + 1;
      case 'm': // Month
        return date.getMonth() + 1; // 1-based
      case 'y': {
        // Day of year
        const start = new Date(date.getFullYear(), 0, 1);
        return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      case 'd': // Day
        return date.getDate();
      case 'w': // Weekday
        return date.getDay() + 1; // 1-based (Sunday = 1)
      case 'ww': {
        // Week
        const jan1 = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((days + jan1.getDay() + 1) / 7);
      }
      case 'h': // Hour
        return date.getHours();
      case 'n': // Minute
        return date.getMinutes();
      case 's': // Second
        return date.getSeconds();
      default:
        return 0;
    }
  }

  static DateSerial(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day); // Convert to 0-based month
  }

  static TimeSerial(hour: number, minute: number, second: number): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, second);
  }

  static DateValue(dateString: string): Date {
    return new Date(dateString);
  }

  static TimeValue(timeString: string): Date {
    const today = new Date();
    const timeDate = new Date(`${today.toDateString()} ${timeString}`);
    return timeDate;
  }

  static Year(date: Date): number {
    return date.getFullYear();
  }

  static Month(date: Date): number {
    return date.getMonth() + 1; // 1-based
  }

  static Day(date: Date): number {
    return date.getDate();
  }

  static Hour(date: Date): number {
    return date.getHours();
  }

  static Minute(date: Date): number {
    return date.getMinutes();
  }

  static Second(date: Date): number {
    return date.getSeconds();
  }

  static Weekday(date: Date): number {
    return date.getDay() + 1; // 1-based (Sunday = 1)
  }

  static MonthName(month: number, abbreviate: boolean = false): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthsShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (month < 1 || month > 12) {
      return '';
    }

    return abbreviate ? monthsShort[month - 1] : months[month - 1];
  }

  static WeekdayName(weekday: number, abbreviate: boolean = false): string {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (weekday < 1 || weekday > 7) {
      return '';
    }

    return abbreviate ? weekdaysShort[weekday - 1] : weekdays[weekday - 1];
  }

  static IsDate(expression: any): boolean {
    if (expression instanceof Date) {
      return !isNaN(expression.getTime());
    }

    if (typeof expression === 'string') {
      const date = new Date(expression);
      return !isNaN(date.getTime());
    }

    return false;
  }

  static FormatDateTime(date: Date, format: number = 0): string {
    switch (format) {
      case 0: // vbGeneralDate - Display date and time if present
        return date.toString();
      case 1: // vbLongDate - Display date using long date format
        return date.toDateString();
      case 2: // vbShortDate - Display date using short date format
        return date.toLocaleDateString();
      case 3: // vbLongTime - Display time using long time format
        return date.toTimeString();
      case 4: // vbShortTime - Display time using short time format
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      default:
        return date.toString();
    }
  }

  // Sleep function (async)
  static Sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  // High-resolution timing
  static GetSystemTimeAsFileTime(): FILETIME {
    const systemTime = TimeAPI.GetSystemTime();
    return TimeAPI.SystemTimeToFileTime(systemTime);
  }

  static CompareFileTime(fileTime1: FILETIME, fileTime2: FILETIME): number {
    const time1 = fileTime1.dwHighDateTime * 0x100000000 + fileTime1.dwLowDateTime;
    const time2 = fileTime2.dwHighDateTime * 0x100000000 + fileTime2.dwLowDateTime;

    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Generate cache-timing resistant jitter
   */
  private static getTimingJitter(): number {
    // Generate cryptographically secure timing jitter to prevent cache timing attacks
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      // ±2.5ms jitter to prevent cache state inference
      return (array[0] / 0xffffffff - 0.5) * 5;
    } else {
      // Fallback with multiple entropy sources
      const r1 = Math.random();
      const r2 = Math.random();
      const r3 = Date.now() % 100;
      return ((r1 + r2 + r3 / 100) / 3 - 0.5) * 5;
    }
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Cache-timing resistant delay
   */
  static async constantTimeDelay(baseDelayMs: number): Promise<void> {
    // Add random jitter to prevent timing analysis
    const jitter = Math.abs(TimeAPI.getTimingJitter());
    const totalDelay = baseDelayMs + jitter;

    // Use multiple delay mechanisms to resist timing analysis
    const promises = [
      new Promise(resolve => setTimeout(resolve, totalDelay * 0.6)),
      new Promise(resolve => {
        const start = Date.now();
        while (Date.now() - start < totalDelay * 0.4) {
          // Busy wait with cache-unfriendly operations
          Math.random();
        }
        resolve(undefined);
      }),
    ];

    await Promise.all(promises);
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Memory access pattern randomization
   */
  static randomizeMemoryAccess(): void {
    // Perform random memory accesses to obfuscate cache state
    const dummy = new Array(1000);
    for (let i = 0; i < 100; i++) {
      const randomIndex = Math.floor(Math.random() * 1000);
      dummy[randomIndex] = Math.random();
    }
  }
}

export { TimeAPI };
export default TimeAPI;
