export type ValidationResult = { valid: boolean; message?: string };

export type Validator = (value: unknown) => ValidationResult;

function createValidationResult(valid: boolean, message: string): ValidationResult {
  return valid ? { valid: true } : { valid: false, message };
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
export const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
export const IPV6_REGEX = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
export const CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
export const ALPHA_REGEX = /^[a-zA-Z]+$/;
export const NUMERIC_REGEX = /^[0-9]+$/;
export const HEX_COLOR_REGEX = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
export const TIME_24_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
export const BASE64_REGEX = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
export const JSON_REGEX = /^[\],:{}\s]*$/;

export function isValid(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

export function isFloat(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && !Number.isInteger(value);
}

export function isPositive(value: unknown): boolean {
  return typeof value === 'number' && value > 0;
}

export function isNegative(value: unknown): boolean {
  return typeof value === 'number' && value < 0;
}

export function isZero(value: unknown): boolean {
  return typeof value === 'number' && value === 0;
}

export function isBetween(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isTrue(value: unknown): boolean {
  return value === true;
}

export function isFalse(value: unknown): boolean {
  return value === false;
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise || (isObject(value) && typeof (value as { then: unknown }).then === 'function');
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return isNil(value);
}

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isPhone(value: string): boolean {
  return PHONE_REGEX.test(value.replace(/\s/g, ''));
}

export function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isHttpUrl(value: string): boolean {
  if (!isUrl(value)) return false;
  return value.toLowerCase().startsWith('http://') || value.toLowerCase().startsWith('https://');
}

export function isHttpsUrl(value: string): boolean {
  if (!isUrl(value)) return false;
  return value.toLowerCase().startsWith('https://');
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isUuidV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isIpv4(value: string): boolean {
  if (!IPV4_REGEX.test(value)) return false;
  const parts = value.split('.');
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

export function isIpv6(value: string): boolean {
  return IPV6_REGEX.test(value) || /^::$/.test(value) || /^::1$/.test(value);
}

export function isIp(value: string): boolean {
  return isIpv4(value) || isIpv6(value);
}

export function isCreditCard(value: string): boolean {
  const sanitized = value.replace(/[\s-]/g, '');
  if (!CREDIT_CARD_REGEX.test(sanitized)) return false;
  return luhnCheck(sanitized);
}

function luhnCheck(num: string): boolean {
  let sum = 0;
  let isEven = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]!, 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function isAlpha(value: string): boolean {
  return ALPHA_REGEX.test(value);
}

export function isAlphanumeric(value: string): boolean {
  return ALPHANUMERIC_REGEX.test(value);
}

export function isNumeric(value: string): boolean {
  return NUMERIC_REGEX.test(value);
}

export function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value);
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

export function isRgbColor(value: string): boolean {
  return /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(value);
}

export function isRgbaColor(value: string): boolean {
  return /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(value);
}

export function isColor(value: string): boolean {
  return isHexColor(value) || isRgbColor(value) || isRgbaColor(value);
}

export function isSlug(value: string): boolean {
  return SLUG_REGEX.test(value);
}

export function isUsername(value: string): boolean {
  return USERNAME_REGEX.test(value);
}

export function isPassword(value: string): boolean {
  return value.length >= 8;
}

export function isPasswordStrong(value: string): boolean {
  return PASSWORD_STRONG_REGEX.test(value);
}

export function isPasswordMedium(value: string): boolean {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

export function isDateIso(value: string): boolean {
  if (!DATE_ISO_REGEX.test(value)) return false;
  return !isNaN(Date.parse(value));
}

export function isTime24(value: string): boolean {
  return TIME_24_REGEX.test(value);
}

export function isBase64(value: string): boolean {
  return BASE64_REGEX.test(value);
}

export function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function isJsonObject(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return isPlainObject(parsed);
  } catch {
    return false;
  }
}

export function isJsonArray(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

export function isMimeType(value: string): boolean {
  return /^[a-zA-Z0-9!#$&\-^_+\.]+\/[a-zA-Z0-9!#$&\-^_+\.]+$/.test(value);
}

export function isSemVer(value: string): boolean {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(value);
}

export function isLocale(value: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(value);
}

export function isCountryCode(value: string): boolean {
  return /^[A-Z]{2}$/.test(value);
}

export function isCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}

export function isPostalCode(value: string, countryCode: string = 'US'): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    JP: /^\d{3}-\d{4}$/,
  };
  const pattern = patterns[countryCode] ?? /^\d{4,10}$/;
  return pattern.test(value);
}

export function isLatitude(value: number): boolean {
  return typeof value === 'number' && value >= -90 && value <= 90;
}

export function isLongitude(value: number): boolean {
  return typeof value === 'number' && value >= -180 && value <= 180;
}

export function isCoordinates(lat: number, lng: number): boolean {
  return isLatitude(lat) && isLongitude(lng);
}

export function isAscii(value: string): boolean {
  return /^[\x00-\x7F]+$/.test(value);
}

export function isLowerCase(value: string): boolean {
  return value === value.toLowerCase();
}

export function isUpperCase(value: string): boolean {
  return value === value.toUpperCase();
}

export function isCapitalized(value: string): boolean {
  return /^[A-Z][a-z]*$/.test(value);
}

export function isPalindrome(value: string): boolean {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

export function isAnagram(value1: string, value2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
  return normalize(value1) === normalize(value2);
}

export function isDivisibleBy(value: number, divisor: number): boolean {
  return value % divisor === 0;
}

export function isEven(value: number): boolean {
  return value % 2 === 0;
}

export function isOdd(value: number): boolean {
  return value % 2 !== 0;
}

export function isPrime(value: number): boolean {
  if (value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(value); i += 2) {
    if (value % i === 0) return false;
  }
  return true;
}

export function isPerfectSquare(value: number): boolean {
  if (value < 0) return false;
  const sqrt = Math.sqrt(value);
  return sqrt === Math.floor(sqrt);
}

export function isFibonacci(value: number): boolean {
  return isPerfectSquare(5 * value * value + 4) || isPerfectSquare(5 * value * value - 4);
}

export function isFinite(value: unknown): boolean {
  return Number.isFinite(value);
}

export function isInfinite(value: unknown): boolean {
  return typeof value === 'number' && !Number.isFinite(value);
}

export function isNaN(value: unknown): boolean {
  return Number.isNaN(value);
}

export function isSafeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value);
}

export function isPositiveZero(value: unknown): boolean {
  return typeof value === 'number' && value === 0 && (1 / value) === Infinity;
}

export function isNegativeZero(value: unknown): boolean {
  return typeof value === 'number' && value === 0 && (1 / value) === -Infinity;
}

export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function lengthBetween(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

export function min(value: number, min: number): boolean {
  return value >= min;
}

export function max(value: number, max: number): boolean {
  return value <= max;
}

export function range(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function inArray<T>(value: T, arr: T[]): boolean {
  return arr.includes(value);
}

export function notInArray<T>(value: T, arr: T[]): boolean {
  return !arr.includes(value);
}

export function equals(value: unknown, compare: unknown): boolean {
  return value === compare;
}

export function notEquals(value: unknown, compare: unknown): boolean {
  return value !== compare;
}

export function oneOf<T>(value: T, ...options: T[]): boolean {
  return options.includes(value);
}

export function pattern(value: string, regex: RegExp): boolean {
  return regex.test(value);
}

export function startsWith(value: string, prefix: string): boolean {
  return value.startsWith(prefix);
}

export function endsWith(value: string, suffix: string): boolean {
  return value.endsWith(suffix);
}

export function contains(value: string, substring: string): boolean {
  return value.includes(substring);
}

export function matches(value: string, regex: string | RegExp): boolean {
  return new RegExp(regex).test(value);
}

export function required(value: unknown): ValidationResult {
  const valid = !isEmpty(value);
  return createValidationResult(valid, 'This field is required');
}

export function email(value: string): ValidationResult {
  const valid = isEmail(value);
  return createValidationResult(valid, 'Invalid email address');
}

export function url(value: string): ValidationResult {
  const valid = isUrl(value);
  return createValidationResult(valid, 'Invalid URL');
}

export function uuid(value: string): ValidationResult {
  const valid = isUuid(value);
  return createValidationResult(valid, 'Invalid UUID');
}

export function phone(value: string): ValidationResult {
  const valid = isPhone(value);
  return createValidationResult(valid, 'Invalid phone number');
}

export function creditCard(value: string): ValidationResult {
  const valid = isCreditCard(value);
  return createValidationResult(valid, 'Invalid credit card number');
}

export function password(value: string): ValidationResult {
  const valid = isPassword(value);
  return createValidationResult(valid, 'Password must be at least 8 characters');
}

export function passwordStrong(value: string): ValidationResult {
  const valid = isPasswordStrong(value);
  return createValidationResult(valid, 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character');
}

export function integer(value: unknown): ValidationResult {
  const valid = isInteger(value);
  return createValidationResult(valid, 'Must be an integer');
}

export function positiveNumber(value: unknown): ValidationResult {
  const valid = isPositive(value);
  return createValidationResult(valid, 'Must be a positive number');
}

export function negativeNumber(value: unknown): ValidationResult {
  const valid = isNegative(value);
  return createValidationResult(valid, 'Must be a negative number');
}

export function minValidator(min: number): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'number' && value >= min;
    return createValidationResult(valid, `Must be at least ${min}`);
  };
}

export function maxValidator(max: number): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'number' && value <= max;
    return createValidationResult(valid, `Must be at most ${max}`);
  };
}

export function rangeValidator(min: number, max: number): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'number' && value >= min && value <= max;
    return createValidationResult(valid, `Must be between ${min} and ${max}`);
  };
}

export function minLengthValidator(min: number): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'string' && value.length >= min;
    return createValidationResult(valid, `Must be at least ${min} characters`);
  };
}

export function maxLengthValidator(max: number): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'string' && value.length <= max;
    return createValidationResult(valid, `Must be at most ${max} characters`);
  };
}

export function patternValidator(regex: RegExp, message?: string): Validator {
  return (value: unknown) => {
    const valid = typeof value === 'string' && regex.test(value);
    return createValidationResult(valid, message ?? 'Invalid format');
  };
}

export function oneOfValidator<T>(options: T[], message?: string): Validator {
  return (value: unknown) => {
    const valid = options.includes(value as T);
    return createValidationResult(valid, message ?? 'Invalid option');
  };
}

export function composeValidators(...validators: Validator[]): Validator {
  return (value: unknown) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}

export function validate(value: unknown, validators: Validator[]): ValidationResult {
  return composeValidators(...validators)(value);
}

export function validateAll(value: unknown, validators: Validator[]): ValidationResult[] {
  return validators.map((validator) => validator(value));
}

export interface SchemaField {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'function';
  validators?: Validator[];
  nested?: Schema;
}

export type Schema = Record<string, SchemaField>;

export interface ValidationResultMap {
  [key: string]: ValidationResult;
}

export function validateSchema(data: Record<string, unknown>, schema: Schema): ValidationResultMap {
  const results: ValidationResultMap = {};

  for (const [key, field] of Object.entries(schema)) {
    const value = data[key];

    if (field.required && isEmpty(value)) {
      results[key] = { valid: false, message: `${key} is required` };
      continue;
    }

    if (value === undefined || value === null) {
      results[key] = { valid: true };
      continue;
    }

    if (field.type) {
      let typeValid = true;
      switch (field.type) {
        case 'string': typeValid = typeof value === 'string'; break;
        case 'number': typeValid = typeof value === 'number'; break;
        case 'boolean': typeValid = typeof value === 'boolean'; break;
        case 'array': typeValid = Array.isArray(value); break;
        case 'object': typeValid = isPlainObject(value); break;
        case 'date': typeValid = isDate(value); break;
        case 'function': typeValid = typeof value === 'function'; break;
      }
      if (!typeValid) {
        results[key] = { valid: false, message: `${key} must be of type ${field.type}` };
        continue;
      }
    }

    if (field.validators) {
      const result = validate(value, field.validators);
      results[key] = result;
      if (!result.valid) continue;
    }

    if (field.nested && isPlainObject(value)) {
      const nestedResults = validateSchema(value as Record<string, unknown>, field.nested);
      const hasErrors = Object.values(nestedResults).some((r) => !r.valid);
      results[key] = hasErrors ? { valid: false, message: 'Nested validation failed' } : { valid: true };
      Object.assign(results, Object.fromEntries(Object.entries(nestedResults).map(([k, v]) => [`${key}.${k}`, v])));
    } else {
      results[key] = { valid: true };
    }
  }

  return results;
}

export function isValidSchema(data: Record<string, unknown>, schema: Schema): boolean {
  const results = validateSchema(data, schema);
  return Object.values(results).every((r) => r.valid);
}
