export namespace Encoding {
  export function base64Encode(input: string | Uint8Array): string {
    let bytes: Uint8Array;
    if (typeof input === 'string') {
      bytes = new TextEncoder().encode(input);
    } else {
      bytes = input;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < bytes.length) {
      const a = bytes[i++] ?? 0;
      const b = i < bytes.length ? (bytes[i++] ?? 0) : 0;
      const c = i < bytes.length ? (bytes[i++] ?? 0) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars[(bitmap >> 18) & 63];
      result += chars[(bitmap >> 12) & 63];
      result += i > bytes.length + 1 ? '=' : chars[(bitmap >> 6) & 63];
      result += i > bytes.length ? '=' : chars[bitmap & 63];
    }

    return result;
  }

  export function base64Decode(input: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    input = input.replace(/[^A-Za-z0-9+/]/g, '');

    const len = input.length;
    let result = '';
    let i = 0;

    while (i < len) {
      const a = chars.indexOf(input[i++] ?? '');
      const b = chars.indexOf(input[i++] ?? '');
      const c = chars.indexOf(input[i++] ?? '');
      const d = chars.indexOf(input[i++] ?? '');

      const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

      result += String.fromCharCode((bitmap >> 16) & 255);
      if (c !== 64 && input[i - 2] !== '=') {
        result += String.fromCharCode((bitmap >> 8) & 255);
      }
      if (d !== 64 && input[i - 1] !== '=') {
        result += String.fromCharCode(bitmap & 255);
      }
    }

    return result;
  }

  export function base64UrlEncode(input: string | Uint8Array): string {
    return base64Encode(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  export function base64UrlDecode(input: string): string {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = input.length % 4;
    if (pad) {
      input += '='.repeat(4 - pad);
    }
    return base64Decode(input);
  }

  export function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return btoa(binary);
  }

  export function utf8Encode(input: string): Uint8Array {
    return new TextEncoder().encode(input);
  }

  export function utf8Decode(input: Uint8Array): string {
    return new TextDecoder().decode(input);
  }

  export function hexEncode(input: string | Uint8Array): string {
    const bytes = typeof input === 'string' ? utf8Encode(input) : input;
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  export function hexDecode(input: string): string {
    const bytes = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      bytes[i / 2] = parseInt(input.substr(i, 2), 16);
    }
    return utf8Decode(bytes);
  }

  export function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  export function urlEncode(input: string): string {
    return encodeURIComponent(input);
  }

  export function urlDecode(input: string): string {
    return decodeURIComponent(input);
  }

  export function urlEncodeComponent(input: string): string {
    return encodeURIComponent(input);
  }

  export function urlDecodeComponent(input: string): string {
    return decodeURIComponent(input);
  }

  export function htmlEncode(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return input.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
  }

  export function htmlDecode(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
      '&nbsp;': ' '
    };

    return input.replace(/&[^;]+;/g, entity => htmlEntities[entity] || entity);
  }

  export function jsonEncode<T>(value: T, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string {
    return JSON.stringify(value, replacer as (key: string, value: unknown) => unknown, space);
  }

  export function jsonDecode<T = unknown>(input: string): T {
    return JSON.parse(input) as T;
  }

  export function jsonEncodePretty<T>(value: T, indent: number = 2): string {
    return JSON.stringify(value, null, indent);
  }

  export function tryJsonDecode<T = unknown>(input: string, defaultValue: T): T {
    try {
      return JSON.parse(input) as T;
    } catch {
      return defaultValue;
    }
  }

  export function isJson(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  export function xmlEncode(input: string): string {
    const xmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };

    return input.replace(/[&<>"']/g, char => xmlEntities[char] || char);
  }

  export function xmlDecode(input: string): string {
    const xmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'"
    };

    return input.replace(/&[^;]+;/g, entity => xmlEntities[entity] || entity);
  }

  export function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  export function escapeSql(input: string): string {
    return input.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
      const sqlEscapes: Record<string, string> = {
        '\0': '\\0',
        '\x08': '\\b',
        '\x09': '\\t',
        '\x1a': '\\z',
        '\n': '\\n',
        '\r': '\\r',
        '"': '\\"',
        "'": "\\'",
        '\\': '\\\\',
        '%': '\\%'
      };
      return sqlEscapes[char] || char;
    });
  }

  export function escapeShell(input: string): string {
    return input.replace(/[^A-Za-z0-9_\-.,:\/@\n]/g, char => {
      if (char === '\n') {
        return "'\\n'";
      }
      return `\\${char}`;
    });
  }

  export function escapeCString(input: string): string {
    return input.replace(/[\\"'\n\r\t\b\f\v\0]/g, char => {
      const cEscapes: Record<string, string> = {
        '\\': '\\\\',
        '"': '\\"',
        "'": "\\'",
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\b': '\\b',
        '\f': '\\f',
        '\v': '\\v',
        '\0': '\\0'
      };
      return cEscapes[char] || char;
    });
  }

  export function unescapeCString(input: string): string {
    return input.replace(/\\([\\\"'nrtbfv0])/g, (_, char) => {
      const cUnescapes: Record<string, string> = {
        '\\': '\\',
        '"': '"',
        "'": "'",
        'n': '\n',
        'r': '\r',
        't': '\t',
        'b': '\b',
        'f': '\f',
        'v': '\v',
        '0': '\0'
      };
      return cUnescapes[char] || char;
    });
  }

  export function camelToSnake(input: string): string {
    return input.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  export function snakeToCamel(input: string): string {
    return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  export function camelToKebab(input: string): string {
    return input.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  export function kebabToCamel(input: string): string {
    return input.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  export function camelToPascal(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }

  export function pascalToCamel(input: string): string {
    return input.charAt(0).toLowerCase() + input.slice(1);
  }

  export function pascalToSnake(input: string): string {
    return camelToSnake(input);
  }

  export function snakeToPascal(input: string): string {
    return camelToPascal(snakeToCamel(input));
  }

  export function pascalToKebab(input: string): string {
    return camelToKebab(input);
  }

  export function kebabToPascal(input: string): string {
    return camelToPascal(kebabToCamel(input));
  }

  export function toSnakeCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase();
  }

  export function toKebabCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
  }

  export function toCamelCase(input: string): string {
    return input
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^(.)/, char => char.toLowerCase());
  }

  export function toPascalCase(input: string): string {
    const camel = toCamelCase(input);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  export function toConstantCase(input: string): string {
    return toSnakeCase(input).toUpperCase();
  }

  export function toSentenceCase(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
  }

  export function toTitleCase(input: string): string {
    return input.replace(/\b\w/g, char => char.toUpperCase());
  }

  export function toCapitalCase(input: string): string {
    return input.replace(/[-_\s]+(.)?/g, (_, char) => (char ? ` ${char.toUpperCase()}` : '')).trim();
  }

  export function toDotCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .replace(/[-_\s]+/g, '.')
      .toLowerCase();
  }

  export function toPathCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1/$2')
      .replace(/[-_\s]+/g, '/')
      .toLowerCase();
  }

  export function rot13(input: string): string {
    return input.replace(/[a-zA-Z]/g, char => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
    });
  }

  export function caesarCipher(input: string, shift: number): string {
    return input.replace(/[a-zA-Z]/g, char => {
      const start = char <= 'Z' ? 65 : 97;
      const shifted = ((char.charCodeAt(0) - start + shift) % 26 + 26) % 26;
      return String.fromCharCode(shifted + start);
    });
  }

  export function caesarDecipher(input: string, shift: number): string {
    return caesarCipher(input, -shift);
  }

  export function xorEncode(input: string, key: string): string {
    const inputBytes = utf8Encode(input);
    const keyBytes = utf8Encode(key);
    const result = new Uint8Array(inputBytes.length);

    for (let i = 0; i < inputBytes.length; i++) {
      result[i] = (inputBytes[i] ?? 0) ^ (keyBytes[i % keyBytes.length] ?? 0);
    }

    return bytesToHex(result);
  }

  export function xorDecode(input: string, key: string): string {
    const inputBytes = hexToBytes(input);
    const keyBytes = utf8Encode(key);
    const result = new Uint8Array(inputBytes.length);

    for (let i = 0; i < inputBytes.length; i++) {
      result[i] = (inputBytes[i] ?? 0) ^ (keyBytes[i % keyBytes.length] ?? 0);
    }

    return utf8Decode(result);
  }

  export function charCodeEncode(input: string): number[] {
    return Array.from(input).map(char => char.charCodeAt(0));
  }

  export function charCodeDecode(codes: number[]): string {
    return String.fromCharCode(...codes);
  }

  export function binaryEncode(input: string): string {
    return Array.from(input)
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  }

  export function binaryDecode(input: string): string {
    return input
      .split(/\s+/)
      .map(byte => String.fromCharCode(parseInt(byte, 2)))
      .join('');
  }

  export function octalEncode(input: string): string {
    return Array.from(input)
      .map(char => char.charCodeAt(0).toString(8).padStart(3, '0'))
      .join(' ');
  }

  export function octalDecode(input: string): string {
    return input
      .split(/\s+/)
      .map(byte => String.fromCharCode(parseInt(byte, 8)))
      .join('');
  }

  export function decimalEncode(input: string): string {
    return Array.from(input)
      .map(char => char.charCodeAt(0).toString(10))
      .join(' ');
  }

  export function decimalDecode(input: string): string {
    return input
      .split(/\s+/)
      .map(code => String.fromCharCode(parseInt(code, 10)))
      .join('');
  }

  export function punycodeEncode(input: string): string {
    const prefix = 'xn--';
    if (input.startsWith(prefix)) {
      return input;
    }

    const asciiPart = input.replace(/[^\x00-\x7F]/g, '');
    const nonAsciiPart = input.replace(/[\x00-\x7F]/g, '');

    if (!nonAsciiPart) {
      return input;
    }

    return prefix + asciiPart + '-' + nonAsciiPart.split('').map(c => c.charCodeAt(0).toString(36)).join('');
  }

  export function slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  export function unslugify(input: string): string {
    return input
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  export function queryStringEncode(params: Record<string, unknown>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${urlEncode(key)}=${urlEncode(String(v))}`).join('&');
        }
        return `${urlEncode(key)}=${urlEncode(String(value))}`;
      })
      .join('&');
  }

  export function queryStringDecode(query: string): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};

    if (!query) {
      return result;
    }

    query = query.replace(/^[?#]/, '');

    for (const pair of query.split('&')) {
      const parts = pair.split('=');
      const key = parts[0];
      const value = parts[1];
      if (!key) continue;
      const decodedKey = urlDecode(key);
      const decodedValue = value ? urlDecode(value) : '';

      if (result[decodedKey]) {
        if (Array.isArray(result[decodedKey])) {
          (result[decodedKey] as string[]).push(decodedValue);
        } else {
          result[decodedKey] = [result[decodedKey] as string, decodedValue];
        }
      } else {
        result[decodedKey] = decodedValue;
      }
    }

    return result;
  }

  export function formDataEncode(data: Record<string, unknown>): string {
    return Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${urlEncode(key)}=${urlEncode(String(value))}`)
      .join('&');
  }

  export function mimeTypeToExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'application/json': 'json',
      'application/xml': 'xml',
      'application/pdf': 'pdf',
      'application/zip': 'zip',
      'application/gzip': 'gz',
      'application/x-tar': 'tar',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'text/csv': 'csv',
      'text/xml': 'xml',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/x-icon': 'ico',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'video/mp4': 'mp4',
      'video/mpeg': 'mpeg',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
      'video/x-msvideo': 'avi',
      'video/quicktime': 'mov'
    };

    return mimeMap[mimeType.toLowerCase()] || '';
  }

  export function extensionToMimeType(extension: string): string {
    const extMap: Record<string, string> = {
      'json': 'application/json',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'gz': 'application/gzip',
      'tar': 'application/x-tar',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'csv': 'text/csv',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'ico': 'image/x-icon',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'mp4': 'video/mp4',
      'mpeg': 'video/mpeg',
      'mpg': 'video/mpeg',
      'webm': 'video/webm',
      'ogv': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime'
    };

    return extMap[extension.toLowerCase().replace(/^\./, '')] || 'application/octet-stream';
  }

  export function charsetEncode(input: string, _charset: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(input);
  }

  export function charsetDecode(input: Uint8Array, charset: string): string {
    const decoder = new TextDecoder(charset);
    return decoder.decode(input);
  }

  export function stripBom(input: string): string {
    if (input.charCodeAt(0) === 0xfeff) {
      return input.slice(1);
    }
    return input;
  }

  export function addBom(input: string, bom: 'utf-8' | 'utf-16le' | 'utf-16be' = 'utf-8'): string {
    const boms: Record<string, string> = {
      'utf-8': '\ufeff',
      'utf-16le': '\ufffe',
      'utf-16be': '\ufeff'
    };
    return boms[bom] + input;
  }

  export function normalizeEncoding(input: string, fromEncoding: string, toEncoding: string): string {
    const bytes = charsetEncode(input, fromEncoding);
    return charsetDecode(bytes, toEncoding);
  }

  export function isValidBase64(input: string): boolean {
    if (!input || input.length % 4 !== 0) {
      return false;
    }
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(input);
  }

  export function isValidHex(input: string): boolean {
    return /^[0-9a-fA-F]*$/.test(input) && input.length % 2 === 0;
  }

  export function isValidUrl(input: string): boolean {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }

  export function isValidEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  export function detectEncoding(input: string): string {
    if (input.charCodeAt(0) === 0xfeff) {
      return 'utf-8-bom';
    }
    if (input.charCodeAt(0) === 0xfffe) {
      return 'utf-16le';
    }
    if (input.charCodeAt(0) === 0xfeff && input.charCodeAt(1) === 0x0000) {
      return 'utf-16be';
    }

    if (/[\u4e00-\u9fa5]/.test(input)) {
      return 'utf-8';
    }

    return 'ascii';
  }
}

export const base64Encode = Encoding.base64Encode;
export const base64Decode = Encoding.base64Decode;
export const base64UrlEncode = Encoding.base64UrlEncode;
export const base64UrlDecode = Encoding.base64UrlDecode;
export const utf8Encode = Encoding.utf8Encode;
export const utf8Decode = Encoding.utf8Decode;
export const hexEncode = Encoding.hexEncode;
export const hexDecode = Encoding.hexDecode;
export const urlEncode = Encoding.urlEncode;
export const urlDecode = Encoding.urlDecode;
export const htmlEncode = Encoding.htmlEncode;
export const htmlDecode = Encoding.htmlDecode;
export const jsonEncode = Encoding.jsonEncode;
export const jsonDecode = Encoding.jsonDecode;
export const xmlEncode = Encoding.xmlEncode;
export const xmlDecode = Encoding.xmlDecode;
export const escapeRegex = Encoding.escapeRegex;
export const escapeSql = Encoding.escapeSql;
export const escapeShell = Encoding.escapeShell;
export const queryStringEncode = Encoding.queryStringEncode;
export const queryStringDecode = Encoding.queryStringDecode;
export const slugify = Encoding.slugify;
export const unslugify = Encoding.unslugify;
