import { uuid as createUuid } from '@sdkwork/utils/id';

export const EMPTY_STRING = '';
export const SPACE = ' ';
export const DASH = '-';
export const UNDERSCORE = '_';
export const DOT = '.';
export const SLASH = '/';
export const BACKSLASH = '\\';
export const NEWLINE = '\n';
export const CARRIAGE_RETURN = '\r';
export const TAB = '\t';

export namespace StringUtils {
  export function isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  export function isNotEmpty(value: unknown): boolean {
    return !isEmpty(value);
  }

  export function isBlank(value: unknown): boolean {
    if (isEmpty(value)) return true;
    if (typeof value !== 'string') return false;
    return value.trim().length === 0;
  }

  export function isNotBlank(value: unknown): boolean {
    return !isBlank(value);
  }

  export function trim(value: string): string {
    return value?.trim() ?? '';
  }

  export function trimStart(value: string): string {
    return value?.trimStart() ?? '';
  }

  export function trimEnd(value: string): string {
    return value?.trimEnd() ?? '';
  }

  export function toLowerCase(value: string): string {
    return value?.toLowerCase() ?? '';
  }

  export function toUpperCase(value: string): string {
    return value?.toUpperCase() ?? '';
  }

  export function capitalize(value: string): string {
    if (isEmpty(value)) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  export function capitalizeWords(value: string): string {
    if (isEmpty(value)) return '';
    return value.split(/\s+/).map(capitalize).join(' ');
  }

  export function camelCase(value: string): string {
    if (isEmpty(value)) return '';
    return value
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^(.)/, (char) => char.toLowerCase());
  }

  export function pascalCase(value: string): string {
    if (isEmpty(value)) return '';
    const camel = camelCase(value);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  export function kebabCase(value: string): string {
    if (isEmpty(value)) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  export function snakeCase(value: string): string {
    if (isEmpty(value)) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  export function constantCase(value: string): string {
    return snakeCase(value).toUpperCase();
  }

  export function truncate(value: string, length: number, suffix: string = '...'): string {
    if (isEmpty(value) || value.length <= length) return value ?? '';
    return value.slice(0, length - suffix.length) + suffix;
  }

  export function truncateWords(value: string, wordCount: number, suffix: string = '...'): string {
    if (isEmpty(value)) return '';
    const words = value.split(/\s+/);
    if (words.length <= wordCount) return value;
    return words.slice(0, wordCount).join(' ') + suffix;
  }

  export function padStart(value: string, length: number, padChar: string = ' '): string {
    return value?.padStart(length, padChar) ?? '';
  }

  export function padEnd(value: string, length: number, padChar: string = ' '): string {
    return value?.padEnd(length, padChar) ?? '';
  }

  export function repeat(value: string, count: number): string {
    if (isEmpty(value) || count <= 0) return '';
    return value.repeat(count);
  }

  export function reverse(value: string): string {
    if (isEmpty(value)) return '';
    return value.split('').reverse().join('');
  }

  export function startsWith(value: string, prefix: string): boolean {
    return value?.startsWith(prefix) ?? false;
  }

  export function endsWith(value: string, suffix: string): boolean {
    return value?.endsWith(suffix) ?? false;
  }

  export function contains(value: string, search: string): boolean {
    return value?.includes(search) ?? false;
  }

  export function containsIgnoreCase(value: string, search: string): boolean {
    return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
  }

  export function indexOf(value: string, search: string): number {
    return value?.indexOf(search) ?? -1;
  }

  export function lastIndexOf(value: string, search: string): number {
    return value?.lastIndexOf(search) ?? -1;
  }

  export function substring(value: string, start: number, end?: number): string {
    if (isEmpty(value)) return '';
    return end !== undefined ? value.slice(start, end) : value.slice(start);
  }

  export function slice(value: string, start: number, end?: number): string {
    return substring(value, start, end);
  }

  export function split(value: string, separator: string | RegExp, limit?: number): string[] {
    if (isEmpty(value)) return [];
    return value.split(separator, limit);
  }

  export function join(values: string[], separator: string = ''): string {
    return values?.join(separator) ?? '';
  }

  export function replace(value: string, search: string | RegExp, replacement: string): string {
    return value?.replace(search, replacement) ?? '';
  }

  export function replaceAll(value: string, search: string | RegExp, replacement: string): string {
    return value?.replaceAll(search, replacement) ?? '';
  }

  export function remove(value: string, search: string | RegExp): string {
    return value?.replace(search, '') ?? '';
  }

  export function removeAll(value: string, search: string | RegExp): string {
    const regex = typeof search === 'string' ? new RegExp(search, 'g') : new RegExp(search.source, `${search.flags}g`);
    return value?.replace(regex, '') ?? '';
  }

  export function countOccurrences(value: string, search: string): number {
    if (isEmpty(value) || isEmpty(search)) return 0;
    return (value.match(new RegExp(escapeRegex(search), 'g')) || []).length;
  }

  export function escapeHtml(value: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return value?.replace(/[&<>"']/g, char => htmlEntities[char] || char) ?? '';
  }

  export function unescapeHtml(value: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&apos;': "'"
    };
    return value?.replace(/&(?:amp|lt|gt|quot|#39|#x27|apos);/g, entity => htmlEntities[entity] || entity) ?? '';
  }

  export function escapeRegex(value: string): string {
    return value?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') ?? '';
  }

  export function isNumeric(value: string): boolean {
    if (isEmpty(value)) return false;
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }

  export function isAlpha(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^[a-zA-Z]+$/.test(value);
  }

  export function isAlphanumeric(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^[a-zA-Z0-9]+$/.test(value);
  }

  export function isHex(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^[0-9a-fA-F]+$/.test(value);
  }

  export function isUuid(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  export function isEmail(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  export function isUrl(value: string): boolean {
    if (isEmpty(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  export function isPhoneNumber(value: string): boolean {
    if (isEmpty(value)) return false;
    return /^\+?[\d\s-()]{10,}$/.test(value);
  }

  export function mask(value: string, start: number, end: number, maskChar: string = '*'): string {
    if (isEmpty(value)) return '';
    const actualStart = Math.max(0, start);
    const actualEnd = Math.min(value.length, end);
    if (actualStart >= actualEnd) return value;
    const masked = maskChar.repeat(actualEnd - actualStart);
    return value.slice(0, actualStart) + masked + value.slice(actualEnd);
  }

  export function maskEmail(value: string): string {
    if (!isEmail(value)) return value;
    const parts = value.split('@');
    const localPart = parts[0];
    const domain = parts[1];
    if (!localPart || !domain) return value;
    const maskedLocal = mask(localPart, 2, localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  }

  export function maskPhone(value: string): string {
    if (isEmpty(value)) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) return value;
    return mask(digits, 3, digits.length - 4);
  }

  export function maskCreditCard(value: string): string {
    if (isEmpty(value)) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8) return value;
    return mask(digits, 4, digits.length - 4);
  }

  export function formatNumber(value: number | string, options?: Intl.NumberFormatOptions): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString(undefined, options);
  }

  export function formatCurrency(value: number | string, currency: string = 'USD', locale?: string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString(locale, { style: 'currency', currency });
  }

  export function formatPercentage(value: number | string, decimals: number = 0): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return `${(num * 100).toFixed(decimals)}%`;
  }

  export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  export function random(length: number = 16, charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /** @deprecated Prefer `import { uuid } from '@sdkwork/utils/id'`. */
  export function uuid(): string {
    return createUuid();
  }

  export function slugify(value: string): string {
    return value
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') ?? '';
  }

  export function unslugify(value: string): string {
    return value
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase()) ?? '';
  }

  export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      if (matrix[0]) matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }
    return matrix[b.length]![a.length]!;
  }

  export function similarity(a: string, b: string): number {
    if (isEmpty(a) && isEmpty(b)) return 1;
    if (isEmpty(a) || isEmpty(b)) return 0;
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return 1 - distance / maxLength;
  }

  export function fuzzyMatch(text: string, pattern: string, threshold: number = 0.6): boolean {
    return similarity(text, pattern) >= threshold;
  }

  export function equals(a: string, b: string, ignoreCase: boolean = false): boolean {
    if (ignoreCase) {
      return a?.toLowerCase() === b?.toLowerCase();
    }
    return a === b;
  }

  export function equalsIgnoreCase(a: string, b: string): boolean {
    return equals(a, b, true);
  }

  export function wordCount(value: string): number {
    if (isEmpty(value)) return 0;
    return value.trim().split(/\s+/).filter(Boolean).length;
  }

  export function characterCount(value: string, includeSpaces: boolean = true): number {
    if (isEmpty(value)) return 0;
    return includeSpaces ? value.length : value.replace(/\s/g, '').length;
  }

  export function lineCount(value: string): number {
    if (isEmpty(value)) return 0;
    return value.split(/\r?\n/).length;
  }

  export function splitLines(value: string): string[] {
    if (isEmpty(value)) return [];
    return value.split(/\r?\n/);
  }

  export function words(value: string): string[] {
    if (isEmpty(value)) return [];
    return value.trim().split(/\s+/).filter(Boolean);
  }

  export function charAt(value: string, index: number): string {
    return value?.charAt(index) ?? '';
  }

  export function charCodeAt(value: string, index: number): number {
    return value?.charCodeAt(index) ?? NaN;
  }

  export function fromCharCode(...codes: number[]): string {
    return String.fromCharCode(...codes);
  }

  export function insert(value: string, index: number, insertValue: string): string {
    if (isEmpty(value)) return insertValue;
    return value.slice(0, index) + insertValue + value.slice(index);
  }

  export function swapCase(value: string): string {
    return value?.replace(/[a-zA-Z]/g, char => {
      return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
    }) ?? '';
  }

  export function surround(value: string, wrapper: string): string {
    return `${wrapper}${value}${wrapper}`;
  }

  export function quote(value: string, quoteChar: string = '"'): string {
    return `${quoteChar}${value}${quoteChar}`;
  }

  export function unquote(value: string): string {
    if (isEmpty(value)) return '';
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('`') && value.endsWith('`'))) {
      return value.slice(1, -1);
    }
    return value;
  }

  export function wrap(value: string, prefix: string, suffix: string = prefix): string {
    return `${prefix}${value}${suffix}`;
  }

  export function unwrap(value: string, prefix: string, suffix: string = prefix): string {
    if (isEmpty(value)) return '';
    if (value.startsWith(prefix) && value.endsWith(suffix)) {
      return value.slice(prefix.length, -suffix.length);
    }
    return value;
  }

  export function template(templateStr: string, values: Record<string, unknown>): string {
    return templateStr?.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? '')) ?? '';
  }

  export function interpolate(templateStr: string, values: Record<string, unknown>): string {
    return template(templateStr, values);
  }

  export function dedent(value: string): string {
    const lines = value.split('\n');
    const minIndent = Math.min(
      ...lines.filter(line => line.trim().length > 0).map(line => line.match(/^\s*/)?.[0].length ?? 0)
    );
    return lines.map(line => line.slice(minIndent)).join('\n');
  }

  export function indent(value: string, spaces: number = 2): string {
    const indentation = ' '.repeat(spaces);
    return value.split('\n').map(line => indentation + line).join('\n');
  }

  export function center(value: string, width: number, padChar: string = ' '): string {
    if (isEmpty(value) || value.length >= width) return value ?? '';
    const padding = width - value.length;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return padChar.repeat(leftPad) + value + padChar.repeat(rightPad);
  }

  export function alignLeft(value: string, width: number, padChar: string = ' '): string {
    return padEnd(value, width, padChar);
  }

  export function alignRight(value: string, width: number, padChar: string = ' '): string {
    return padStart(value, width, padChar);
  }

  export function alignCenter(value: string, width: number, padChar: string = ' '): string {
    return center(value, width, padChar);
  }

  export function toBoolean(value: string): boolean {
    const truthy = ['true', '1', 'yes', 'on', 'y'];
    return truthy.includes(value?.toLowerCase().trim());
  }

  export function toNumber(value: string, defaultValue: number = 0): number {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  export function toArray(value: string, separator: string | RegExp = ','): string[] {
    return split(value, separator);
  }

  export function hashCode(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  export function isPalindrome(value: string): boolean {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }

  export function isAnagram(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
    return normalize(a) === normalize(b);
  }

  export function reverseWords(value: string): string {
    return value?.split(/\s+/).reverse().join(' ') ?? '';
  }

  export function sortCharacters(value: string): string {
    return value?.split('').sort().join('') ?? '';
  }

  export function uniqueCharacters(value: string): string {
    return [...new Set(value)].join('');
  }

  export function removeDuplicates(value: string): string {
    return value?.split('').filter((char, index, arr) => arr.indexOf(char) === index).join('') ?? '';
  }

  export function longestCommonSubstring(a: string, b: string): string {
    if (isEmpty(a) || isEmpty(b)) return '';
    const matrix: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
    let maxLength = 0;
    let endIndex = 0;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i]![j] = matrix[i - 1]![j - 1]! + 1;
          if (matrix[i]![j]! > maxLength) {
            maxLength = matrix[i]![j]!;
            endIndex = i;
          }
        }
      }
    }
    return a.slice(endIndex - maxLength, endIndex);
  }

  export function longestCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0] ?? '';
    const sorted = [...strings].sort();
    const first = sorted[0] ?? '';
    const last = sorted[sorted.length - 1] ?? '';
    let i = 0;
    while (i < first.length && first[i] === last[i]) {
      i++;
    }
    return first.slice(0, i);
  }

  export function longestCommonSuffix(strings: string[]): string {
    const reversed = strings.map(s => s?.split('').reverse().join('') ?? '');
    return longestCommonPrefix(reversed).split('').reverse().join('');
  }

  export function truncateMiddle(value: string, maxLength: number, separator: string = '...'): string {
    if (isEmpty(value) || value.length <= maxLength) return value ?? '';
    const sepLen = separator.length;
    const charsToShow = maxLength - sepLen;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return value.slice(0, frontChars) + separator + value.slice(-backChars);
  }

  export function ellipsis(value: string, maxLength: number): string {
    return truncate(value, maxLength, '...');
  }

  export function ellipsisMiddle(value: string, maxLength: number): string {
    return truncateMiddle(value, maxLength, '...');
  }

  export function pad(value: string, length: number, padChar: string = ' '): string {
    return center(value, length, padChar);
  }

  export function padCenter(value: string, length: number, padChar: string = ' '): string {
    return center(value, length, padChar);
  }

  export function isAscii(value: string): boolean {
    return /^[\x00-\x7F]*$/.test(value);
  }

  export function isLowerCase(value: string): boolean {
    return value === value.toLowerCase();
  }

  export function isUpperCase(value: string): boolean {
    return value === value.toUpperCase();
  }

  export function isCapitalized(value: string): boolean {
    return value.charAt(0) === value.charAt(0).toUpperCase();
  }

  export function swapPrefix(value: string, oldPrefix: string, newPrefix: string): string {
    if (value.startsWith(oldPrefix)) {
      return newPrefix + value.slice(oldPrefix.length);
    }
    return value;
  }

  export function swapSuffix(value: string, oldSuffix: string, newSuffix: string): string {
    if (value.endsWith(oldSuffix)) {
      return value.slice(0, -oldSuffix.length) + newSuffix;
    }
    return value;
  }

  export function ensurePrefix(value: string, prefix: string): string {
    return value.startsWith(prefix) ? value : prefix + value;
  }

  export function ensureSuffix(value: string, suffix: string): string {
    return value.endsWith(suffix) ? value : value + suffix;
  }

  export function removePrefix(value: string, prefix: string): string {
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
  }

  export function removeSuffix(value: string, suffix: string): string {
    return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
  }

  export function take(value: string, n: number): string {
    return value?.slice(0, n) ?? '';
  }

  export function takeRight(value: string, n: number): string {
    return value?.slice(-n) ?? '';
  }

  export function takeWhile(value: string, predicate: (char: string) => boolean): string {
    let result = '';
    for (const char of value ?? '') {
      if (!predicate(char)) break;
      result += char;
    }
    return result;
  }

  export function takeRightWhile(value: string, predicate: (char: string) => boolean): string {
    let result = '';
    for (let i = (value?.length ?? 0) - 1; i >= 0; i--) {
      const char = value?.charAt(i) ?? '';
      if (!predicate(char)) break;
      result = char + result;
    }
    return result;
  }

  export function drop(value: string, n: number): string {
    return value?.slice(n) ?? '';
  }

  export function dropRight(value: string, n: number): string {
    return value?.slice(0, -n) ?? '';
  }

  export function dropWhile(value: string, predicate: (char: string) => boolean): string {
    let i = 0;
    for (const char of value ?? '') {
      if (!predicate(char)) break;
      i++;
    }
    return value?.slice(i) ?? '';
  }

  export function dropRightWhile(value: string, predicate: (char: string) => boolean): string {
    let i = (value?.length ?? 0) - 1;
    while (i >= 0 && predicate(value?.charAt(i) ?? '')) {
      i--;
    }
    return value?.slice(0, i + 1) ?? '';
  }

  export function countLines(value: string): number {
    return lineCount(value);
  }

  export function getLine(value: string, lineNumber: number): string {
    const lines = splitLines(value);
    return lines[lineNumber] ?? '';
  }

  export function getLines(value: string): string[] {
    return splitLines(value);
  }

  export function isSingleLine(value: string): boolean {
    return !value?.includes('\n');
  }

  export function isMultiLine(value: string): boolean {
    return value?.includes('\n') ?? false;
  }

  export function normalizeLineEndings(value: string, lineEnding: '\n' | '\r\n' | '\r' = '\n'): string {
    return value?.replace(/\r\n|\r|\n/g, lineEnding) ?? '';
  }

  export function toCamelCase(value: string): string {
    return camelCase(value);
  }

  export function toKebabCase(value: string): string {
    return kebabCase(value);
  }

  export function toSnakeCase(value: string): string {
    return snakeCase(value);
  }

  export function toPascalCase(value: string): string {
    return pascalCase(value);
  }

  export function toConstantCase(value: string): string {
    return constantCase(value);
  }

  export function toSentenceCase(value: string): string {
    if (isEmpty(value)) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  export function toTitleCase(value: string): string {
    return capitalizeWords(value);
  }

  export function toCapitalCase(value: string): string {
    return capitalizeWords(value);
  }

  export function toDotCase(value: string): string {
    return value?.replace(/([a-z])([A-Z])/g, '$1.$2').replace(/[-_\s]+/g, '.').toLowerCase() ?? '';
  }

  export function toPathCase(value: string): string {
    return value?.replace(/([a-z])([A-Z])/g, '$1/$2').replace(/[-_\s]+/g, '/').toLowerCase() ?? '';
  }

  export function stripTags(value: string): string {
    return value?.replace(/<[^>]*>/g, '') ?? '';
  }

  export function stripNumbers(value: string): string {
    return value?.replace(/\d+/g, '') ?? '';
  }

  export function stripWhitespace(value: string): string {
    return value?.replace(/\s+/g, '') ?? '';
  }

  export function stripPunctuation(value: string): string {
    return value?.replace(/[^\w\s]/g, '') ?? '';
  }

  export function normalizeWhitespace(value: string): string {
    return value?.replace(/\s+/g, ' ').trim() ?? '';
  }

  export function includesAll(value: string, searches: string[]): boolean {
    return searches.every(search => value?.includes(search) ?? false);
  }

  export function includesAny(value: string, searches: string[]): boolean {
    return searches.some(search => value?.includes(search) ?? false);
  }
}
