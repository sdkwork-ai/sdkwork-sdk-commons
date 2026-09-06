export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type DateFormat = 'iso' | 'iso-date' | 'iso-time' | 'datetime' | 'date' | 'time' | 'time-24' | 'year-month' | 'month-day' | 'custom';

export interface DateComponents {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface Duration {
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
}

export const MILLISECONDS_IN_SECOND = 1000;
export const MILLISECONDS_IN_MINUTE = 60 * MILLISECONDS_IN_SECOND;
export const MILLISECONDS_IN_HOUR = 60 * MILLISECONDS_IN_MINUTE;
export const MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;
export const MILLISECONDS_IN_WEEK = 7 * MILLISECONDS_IN_DAY;

export const TIME_UNITS_IN_MS: Record<TimeUnit, number> = {
  millisecond: 1,
  second: MILLISECONDS_IN_SECOND,
  minute: MILLISECONDS_IN_MINUTE,
  hour: MILLISECONDS_IN_HOUR,
  day: MILLISECONDS_IN_DAY,
  week: MILLISECONDS_IN_WEEK,
  month: 30 * MILLISECONDS_IN_DAY,
  quarter: 90 * MILLISECONDS_IN_DAY,
  year: 365 * MILLISECONDS_IN_DAY,
};

export function now(): Date {
  return new Date();
}

export function today(): Date {
  return startOfDay(new Date());
}

export function yesterday(): Date {
  return addDays(today(), -1);
}

export function tomorrow(): Date {
  return addDays(today(), 1);
}

export function createDate(year: number, month: number, day: number, hours: number = 0, minutes: number = 0, seconds: number = 0, milliseconds: number = 0): Date {
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

export function fromTimestamp(timestamp: number): Date {
  return new Date(timestamp);
}

export function fromUnixTimestamp(unixTimestamp: number): Date {
  return new Date(unixTimestamp * MILLISECONDS_IN_SECOND);
}

export function parse(value: string | Date | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
}

export function parseIso(value: string): Date {
  return new Date(value);
}

export function parseFormat(value: string, format: string): Date {
  const formatTokens: Record<string, (date: Date, value: string) => void> = {
    'YYYY': (date, v) => date.setFullYear(parseInt(v, 10)),
    'YY': (date, v) => date.setFullYear(2000 + parseInt(v, 10)),
    'MM': (date, v) => date.setMonth(parseInt(v, 10) - 1),
    'M': (date, v) => date.setMonth(parseInt(v, 10) - 1),
    'DD': (date, v) => date.setDate(parseInt(v, 10)),
    'D': (date, v) => date.setDate(parseInt(v, 10)),
    'HH': (date, v) => date.setHours(parseInt(v, 10)),
    'H': (date, v) => date.setHours(parseInt(v, 10)),
    'mm': (date, v) => date.setMinutes(parseInt(v, 10)),
    'm': (date, v) => date.setMinutes(parseInt(v, 10)),
    'ss': (date, v) => date.setSeconds(parseInt(v, 10)),
    's': (date, v) => date.setSeconds(parseInt(v, 10)),
    'SSS': (date, v) => date.setMilliseconds(parseInt(v, 10)),
  };

  const date = new Date(0);
  let formatIndex = 0;
  let valueIndex = 0;

  while (formatIndex < format.length && valueIndex < value.length) {
    const token = Object.keys(formatTokens).find((t) => format.slice(formatIndex).startsWith(t));
    if (token) {
      const tokenLength = token.length;
      const tokenValue = value.slice(valueIndex, valueIndex + tokenLength);
      formatTokens[token]!(date, tokenValue);
      formatIndex += tokenLength;
      valueIndex += tokenLength;
    } else {
      formatIndex++;
      valueIndex++;
    }
  }

  return date;
}

export function isValid(value: Date | string | number): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime());
}

export function isBefore(date: Date, compare: Date): boolean {
  return date.getTime() < compare.getTime();
}

export function isAfter(date: Date, compare: Date): boolean {
  return date.getTime() > compare.getTime();
}

export function isSame(date: Date, compare: Date, unit: TimeUnit = 'millisecond'): boolean {
  const d1 = startOf(date, unit);
  const d2 = startOf(compare, unit);
  return d1.getTime() === d2.getTime();
}

export function isSameDay(date: Date, compare: Date): boolean {
  return isSame(date, compare, 'day');
}

export function isSameWeek(date: Date, compare: Date, weekStartsOn: number = 0): boolean {
  const d1 = startOfWeek(date, weekStartsOn);
  const d2 = startOfWeek(compare, weekStartsOn);
  return d1.getTime() === d2.getTime();
}

export function isSameMonth(date: Date, compare: Date): boolean {
  return isSame(date, compare, 'month');
}

export function isSameYear(date: Date, compare: Date): boolean {
  return isSame(date, compare, 'year');
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isYesterday(date: Date): boolean {
  return isSameDay(date, yesterday());
}

export function isTomorrow(date: Date): boolean {
  return isSameDay(date, tomorrow());
}

export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

export function isFuture(date: Date): boolean {
  return isAfter(date, new Date());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isInLeapYear(date: Date): boolean {
  return isLeapYear(date.getFullYear());
}

export function getYear(date: Date): number {
  return date.getFullYear();
}

export function getMonth(date: Date): number {
  return date.getMonth() + 1;
}

export function getDay(date: Date): number {
  return date.getDate();
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / MILLISECONDS_IN_DAY);
}

export function getWeek(date: Date, _weekStartsOn: number = 0): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / MILLISECONDS_IN_DAY;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getHours(date: Date): number {
  return date.getHours();
}

export function getMinutes(date: Date): number {
  return date.getMinutes();
}

export function getSeconds(date: Date): number {
  return date.getSeconds();
}

export function getMilliseconds(date: Date): number {
  return date.getMilliseconds();
}

export function getTimestamp(date: Date): number {
  return date.getTime();
}

export function getUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / MILLISECONDS_IN_SECOND);
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDaysInYear(date: Date): number {
  return isLeapYear(date.getFullYear()) ? 366 : 365;
}

export function setYear(date: Date, year: number): Date {
  const result = new Date(date);
  result.setFullYear(year);
  return result;
}

export function setMonth(date: Date, month: number): Date {
  const result = new Date(date);
  result.setMonth(month - 1);
  return result;
}

export function setDay(date: Date, day: number): Date {
  const result = new Date(date);
  result.setDate(day);
  return result;
}

export function setDayOfWeek(date: Date, day: number): Date {
  const result = new Date(date);
  const currentDay = result.getDay();
  const diff = day - currentDay;
  result.setDate(result.getDate() + diff);
  return result;
}

export function setHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours);
  return result;
}

export function setMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(minutes);
  return result;
}

export function setSeconds(date: Date, seconds: number): Date {
  const result = new Date(date);
  result.setSeconds(seconds);
  return result;
}

export function setMilliseconds(date: Date, milliseconds: number): Date {
  const result = new Date(date);
  result.setMilliseconds(milliseconds);
  return result;
}

export function startOf(date: Date, unit: TimeUnit): Date {
  const result = new Date(date);

  switch (unit) {
    case 'year':
      result.setMonth(0, 1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      result.setMonth(Math.floor(result.getMonth() / 3) * 3, 1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'month':
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'week':
      return startOfWeek(result);
    case 'day':
      result.setHours(0, 0, 0, 0);
      break;
    case 'hour':
      result.setMinutes(0, 0, 0);
      break;
    case 'minute':
      result.setSeconds(0, 0);
      break;
    case 'second':
      result.setMilliseconds(0);
      break;
  }

  return result;
}

export function endOf(date: Date, unit: TimeUnit): Date {
  const result = new Date(date);

  switch (unit) {
    case 'year':
      result.setMonth(11, 31);
      result.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      result.setMonth(Math.floor(result.getMonth() / 3) * 3 + 2);
      result.setDate(getDaysInMonth(result));
      result.setHours(23, 59, 59, 999);
      break;
    case 'month':
      result.setDate(getDaysInMonth(result));
      result.setHours(23, 59, 59, 999);
      break;
    case 'week':
      return endOfWeek(result);
    case 'day':
      result.setHours(23, 59, 59, 999);
      break;
    case 'hour':
      result.setMinutes(59, 59, 999);
      break;
    case 'minute':
      result.setSeconds(59, 999);
      break;
    case 'second':
      result.setMilliseconds(999);
      break;
  }

  return result;
}

export function startOfDay(date: Date): Date {
  return startOf(date, 'day');
}

export function endOfDay(date: Date): Date {
  return endOf(date, 'day');
}

export function startOfWeek(date: Date, weekStartsOn: number = 0): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date, weekStartsOn: number = 0): Date {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date): Date {
  return startOf(date, 'month');
}

export function endOfMonth(date: Date): Date {
  return endOf(date, 'month');
}

export function startOfYear(date: Date): Date {
  return startOf(date, 'year');
}

export function endOfYear(date: Date): Date {
  return endOf(date, 'year');
}

export function addMilliseconds(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMilliseconds(result.getMilliseconds() + amount);
  return result;
}

export function addSeconds(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_SECOND);
}

export function addMinutes(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_MINUTE);
}

export function addHours(date: Date, amount: number): Date {
  return addMilliseconds(date, amount * MILLISECONDS_IN_HOUR);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

export function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

export function addQuarters(date: Date, amount: number): Date {
  return addMonths(date, amount * 3);
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

export function add(date: Date, duration: Duration): Date {
  let result = new Date(date);

  if (duration.milliseconds) result = addMilliseconds(result, duration.milliseconds);
  if (duration.seconds) result = addSeconds(result, duration.seconds);
  if (duration.minutes) result = addMinutes(result, duration.minutes);
  if (duration.hours) result = addHours(result, duration.hours);
  if (duration.days) result = addDays(result, duration.days);
  if (duration.weeks) result = addWeeks(result, duration.weeks);
  if (duration.months) result = addMonths(result, duration.months);
  if (duration.years) result = addYears(result, duration.years);

  return result;
}

export function subtract(date: Date, duration: Duration): Date {
  const negativeDuration: Duration = {};
  for (const key in duration) {
    negativeDuration[key as keyof Duration] = -(duration[key as keyof Duration] ?? 0);
  }
  return add(date, negativeDuration);
}

export function diff(date1: Date, date2: Date, unit: TimeUnit = 'millisecond'): number {
  const diffMs = date1.getTime() - date2.getTime();

  switch (unit) {
    case 'millisecond':
      return diffMs;
    case 'second':
      return Math.floor(diffMs / MILLISECONDS_IN_SECOND);
    case 'minute':
      return Math.floor(diffMs / MILLISECONDS_IN_MINUTE);
    case 'hour':
      return Math.floor(diffMs / MILLISECONDS_IN_HOUR);
    case 'day':
      return Math.floor(diffMs / MILLISECONDS_IN_DAY);
    case 'week':
      return Math.floor(diffMs / MILLISECONDS_IN_WEEK);
    case 'month':
      const months = (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth());
      return months;
    case 'quarter':
      return Math.floor(diff(date1, date2, 'month') / 3);
    case 'year':
      return date1.getFullYear() - date2.getFullYear();
    default:
      return diffMs;
  }
}

export function format(date: Date, formatStr: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const tokens: Record<string, () => string> = {
    'YYYY': () => String(date.getFullYear()),
    'YY': () => String(date.getFullYear()).slice(-2),
    'MM': () => String(date.getMonth() + 1).padStart(2, '0'),
    'M': () => String(date.getMonth() + 1),
    'DD': () => String(date.getDate()).padStart(2, '0'),
    'D': () => String(date.getDate()),
    'HH': () => String(date.getHours()).padStart(2, '0'),
    'H': () => String(date.getHours()),
    'hh': () => String(date.getHours() % 12 || 12).padStart(2, '0'),
    'h': () => String(date.getHours() % 12 || 12),
    'mm': () => String(date.getMinutes()).padStart(2, '0'),
    'm': () => String(date.getMinutes()),
    'ss': () => String(date.getSeconds()).padStart(2, '0'),
    's': () => String(date.getSeconds()),
    'SSS': () => String(date.getMilliseconds()).padStart(3, '0'),
    'A': () => date.getHours() >= 12 ? 'PM' : 'AM',
    'a': () => date.getHours() >= 12 ? 'pm' : 'am',
    'd': () => String(date.getDay()),
    'ddd': () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] ?? '',
    'dddd': () => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()] ?? '',
    'MMM': () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()] ?? '',
    'MMMM': () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()] ?? '',
    'Q': () => String(getQuarter(date)),
    'W': () => String(getWeek(date)).padStart(2, '0'),
    'Do': () => {
      const day = date.getDate();
      const suffix: string[] = ['th', 'st', 'nd', 'rd'];
      const remainder = day % 100;
      return day + (suffix[(remainder - 20) % 10] ?? suffix[remainder] ?? suffix[0]!);
    },
  };

  let result = formatStr;
  const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length);

  for (const token of sortedTokens) {
    if (result.includes(token)) {
      result = result.replace(new RegExp(token, 'g'), tokens[token]!());
    }
  }

  return result;
}

export function formatIso(date: Date): string {
  return date.toISOString();
}

export function formatIsoDate(date: Date): string {
  return format(date, 'YYYY-MM-DD');
}

export function formatIsoTime(date: Date): string {
  return format(date, 'HH:mm:ss.SSS');
}

export function formatRelative(date: Date, base: Date = new Date()): string {
  const diffMs = base.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / MILLISECONDS_IN_SECOND);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

export function formatDuration(duration: Duration): string {
  const parts: string[] = [];

  if (duration.years) parts.push(`${duration.years}y`);
  if (duration.months) parts.push(`${duration.months}mo`);
  if (duration.weeks) parts.push(`${duration.weeks}w`);
  if (duration.days) parts.push(`${duration.days}d`);
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds) parts.push(`${duration.seconds}s`);
  if (duration.milliseconds) parts.push(`${duration.milliseconds}ms`);

  return parts.join(' ') || '0ms';
}

export function toComponents(date: Date): DateComponents {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    milliseconds: date.getMilliseconds(),
  };
}

export function fromComponents(components: Partial<DateComponents>): Date {
  return new Date(
    components.year ?? 1970,
    (components.month ?? 1) - 1,
    components.day ?? 1,
    components.hours ?? 0,
    components.minutes ?? 0,
    components.seconds ?? 0,
    components.milliseconds ?? 0
  );
}

export function clone(date: Date): Date {
  return new Date(date.getTime());
}

export function min(...dates: Date[]): Date {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

export function max(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function isBetween(date: Date, start: Date, end: Date, inclusive: boolean = true): boolean {
  if (inclusive) {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }
  return date.getTime() > start.getTime() && date.getTime() < end.getTime();
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(start);
  const endDate = startOfDay(end);

  while (current <= endDate) {
    days.push(clone(current));
    current = addDays(current, 1);
  }

  return days;
}

export function eachWeek(start: Date, end: Date, weekStartsOn: number = 0): Date[] {
  const weeks: Date[] = [];
  let current = startOfWeek(start, weekStartsOn);
  const endDate = startOfWeek(end, weekStartsOn);

  while (current <= endDate) {
    weeks.push(clone(current));
    current = addWeeks(current, 1);
  }

  return weeks;
}

export function eachMonth(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(start);
  const endDate = startOfMonth(end);

  while (current <= endDate) {
    months.push(clone(current));
    current = addMonths(current, 1);
  }

  return months;
}

export function eachYear(start: Date, end: Date): Date[] {
  const years: Date[] = [];
  let current = startOfYear(start);
  const endDate = startOfYear(end);

  while (current <= endDate) {
    years.push(clone(current));
    current = addYears(current, 1);
  }

  return years;
}

export function closestTo(date: Date, dates: Date[]): Date | null {
  if (dates.length === 0) return null;

  const diffMs = date.getTime();
  let closest = dates[0]!;
  let minDiff = Math.abs(diffMs - closest.getTime());

  for (let i = 1; i < dates.length; i++) {
    const currentDiff = Math.abs(diffMs - dates[i]!.getTime());
    if (currentDiff < minDiff) {
      minDiff = currentDiff;
      closest = dates[i]!;
    }
  }

  return clone(closest);
}

export function countWeekendDays(start: Date, end: Date): number {
  let count = 0;
  let current = startOfDay(start);
  const endDate = startOfDay(end);

  while (current <= endDate) {
    if (isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

export function countWeekdays(start: Date, end: Date): number {
  const totalDays = diff(end, start, 'day') + 1;
  return totalDays - countWeekendDays(start, end);
}

export function nextWeekday(date: Date): Date {
  let result = addDays(date, 1);
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  return result;
}

export function previousWeekday(date: Date): Date {
  let result = addDays(date, -1);
  while (isWeekend(result)) {
    result = addDays(result, -1);
  }
  return result;
}

export function nthDayOfMonth(year: number, month: number, dayOfWeek: number, nth: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();
  const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, month - 1, day);
}

export function lastDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  const lastDate = new Date(year, month, 0);
  const lastDay = lastDate.getDate();
  const lastDayOfWeek = lastDate.getDay();
  const offset = (lastDayOfWeek - dayOfWeek + 7) % 7;
  return new Date(year, month - 1, lastDay - offset);
}

export function age(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function timezoneOffset(date: Date = new Date()): number {
  return date.getTimezoneOffset();
}

export function toTimezone(date: Date, timezone: string): Date {
  const str = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(str);
}

export function isDST(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdOffset;
}
