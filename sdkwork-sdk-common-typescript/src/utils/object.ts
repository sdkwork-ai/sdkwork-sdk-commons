export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

export type DeepKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${DeepKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type DeepValueOf<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepValueOf<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  if (typeof value === 'string') return value.length === 0;
  return false;
}

export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

export function hasKey<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return key in obj;
}

export function hasKeys<T extends object>(obj: T, keys: PropertyKey[]): boolean {
  return keys.every((key) => key in obj);
}

export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function fromEntries<K extends string, V>(entries: [K, V][]): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (hasKey(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

export function pickBy<T extends object>(obj: T, predicate: (value: T[keyof T], key: keyof T) => boolean): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of entries(obj)) {
    if (predicate(value, key)) {
      result[key] = value;
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result: Partial<T> = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function omitBy<T extends object>(obj: T, predicate: (value: T[keyof T], key: keyof T) => boolean): Partial<T> {
  const result: Partial<T> = { ...obj };
  for (const [key, value] of entries(obj)) {
    if (predicate(value, key)) {
      delete result[key];
    }
  }
  return result;
}

export function merge<T extends object, U extends object>(target: T, source: U): T & U {
  return { ...target, ...source };
}

export function mergeDeep<T extends object, U extends object>(target: T, source: U): T & U {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const targetValue = (target as Record<string, unknown>)[key];
    const sourceValue = (source as Record<string, unknown>)[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = mergeDeep(targetValue as object, sourceValue as object);
    } else {
      result[key] = sourceValue;
    }
  }

  return result as T & U;
}

export function clone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(clone) as T;
  if (obj instanceof Date) return new Date(obj) as T;
  if (obj instanceof Map) return new Map(obj) as T;
  if (obj instanceof Set) return new Set(obj) as T;
  if (obj instanceof RegExp) return new RegExp(obj) as T;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = clone((obj as Record<string, unknown>)[key]);
  }
  return result as T;
}

export function cloneDeep<T>(obj: T): T {
  return clone(obj);
}

export function cloneShallow<T extends object>(obj: T): T {
  return { ...obj };
}

export function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => equals(item, b[index]));
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => equals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}

export function deepEquals(a: unknown, b: unknown): boolean {
  return equals(a, b);
}

export function shallowEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!isObject(a) || !isObject(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }

  return true;
}

export function get<T extends object, P extends string>(obj: T, path: P, defaultValue?: unknown): DeepValueOf<T, P> | undefined {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as DeepValueOf<T, P> | undefined;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result ?? defaultValue) as DeepValueOf<T, P> | undefined;
}

export function set<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = clone(obj) as Record<string, unknown>;
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || !isPlainObject(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]!] = value;
  return result as T;
}

export function has<T extends object>(obj: T, path: string): boolean {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return true;
}

export function unset<T extends object>(obj: T, path: string): T {
  const keys = path.split('.');
  if (keys.length === 0) return obj;

  const result = clone(obj) as Record<string, unknown>;
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!isPlainObject(current[key])) {
      return result as T;
    }
    current = current[key] as Record<string, unknown>;
  }

  delete current[keys[keys.length - 1]!];
  return result as T;
}

export function defaults<T extends object>(obj: T, defaults: Partial<T>): T {
  const result: Partial<T> = { ...defaults, ...obj };
  return result as T;
}

export function defaultsDeep<T extends object>(obj: T, defaults: Partial<T>): T {
  const result: Partial<T> = { ...obj };

  for (const key of Object.keys(defaults)) {
    if (!(key in result)) {
      result[key as keyof T] = defaults[key as keyof T];
    } else if (isPlainObject(result[key as keyof T]) && isPlainObject(defaults[key as keyof T])) {
      result[key as keyof T] = defaultsDeep(
        result[key as keyof T] as object,
        defaults[key as keyof T] as object
      ) as T[keyof T];
    }
  }

  return result as T;
}

export function mapKeys<T extends object>(obj: T, mapper: (value: T[keyof T], key: keyof T) => string): Record<string, T[keyof T]> {
  const result: Record<string, T[keyof T]> = {};
  for (const [key, value] of entries(obj)) {
    result[mapper(value, key)] = value;
  }
  return result;
}

export function mapValues<T extends object, V>(obj: T, mapper: (value: T[keyof T], key: keyof T) => V): Record<keyof T, V> {
  const result: Record<string, V> = {};
  for (const [key, value] of entries(obj)) {
    result[key as string] = mapper(value, key);
  }
  return result as Record<keyof T, V>;
}

export function transform<T extends object, R>(obj: T, transformer: (result: R, value: T[keyof T], key: keyof T) => R, accumulator: R): R {
  let result = accumulator;
  for (const [key, value] of entries(obj)) {
    result = transformer(result, value, key);
  }
  return result;
}

export function findKey<T extends object>(obj: T, predicate: (value: T[keyof T], key: keyof T) => boolean): keyof T | undefined {
  for (const [key, value] of entries(obj)) {
    if (predicate(value, key)) {
      return key;
    }
  }
  return undefined;
}

export function findLastKey<T extends object>(obj: T, predicate: (value: T[keyof T], key: keyof T) => boolean): keyof T | undefined {
  const allKeys = keys(obj);
  for (let i = allKeys.length - 1; i >= 0; i--) {
    const key = allKeys[i]!;
    if (predicate(obj[key], key)) {
      return key;
    }
  }
  return undefined;
}

export function invert<T extends Record<string, string | number>>(obj: T): Record<T[keyof T], keyof T> {
  const result: Record<string, keyof T> = {};
  for (const [key, value] of entries(obj)) {
    result[String(value)] = key;
  }
  return result as Record<T[keyof T], keyof T>;
}

export function invertBy<T extends Record<string, string | number>>(obj: T, mapper?: (key: keyof T) => string): Record<string, (keyof T)[]> {
  const result: Record<string, (keyof T)[]> = {};
  for (const [key, value] of entries(obj)) {
    const newKey = mapper ? mapper(key) : String(value);
    if (!result[newKey]) {
      result[newKey] = [];
    }
    result[newKey]!.push(key);
  }
  return result;
}

export function toPairs<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return entries(obj);
}

export function fromPairs<K extends string, V>(pairs: [K, V][]): Record<K, V> {
  return fromEntries(pairs);
}

export function size<T extends object>(obj: T): number {
  return Object.keys(obj).length;
}

export function at<T extends object>(obj: T, paths: (keyof T)[]): (T[keyof T] | undefined)[] {
  return paths.map((path) => obj[path]);
}

export function invoke<T extends object>(obj: T, path: string, ...args: unknown[]): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!isObject(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  const methodKey = keys[keys.length - 1];
  if (!isObject(current) || typeof (current as Record<string, unknown>)[methodKey!] !== 'function') {
    return undefined;
  }

  return ((current as Record<string, unknown>)[methodKey!] as (...args: unknown[]) => unknown)(...args);
}

export function functions<T extends object>(obj: T): (keyof T)[] {
  return keys(obj).filter((key) => typeof obj[key] === 'function');
}

export function functionsIn<T extends object>(obj: T): string[] {
  const result: string[] = [];
  let current: unknown = obj;

  while (current !== null && current !== Object.prototype) {
    const ownKeys = Object.getOwnPropertyNames(current);
    for (const key of ownKeys) {
      if (typeof (obj as Record<string, unknown>)[key] === 'function' && !result.includes(key)) {
        result.push(key);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return result;
}

export function property<T extends object, P extends string>(path: P): (obj: T) => DeepValueOf<T, P> | undefined {
  return (obj: T) => get(obj, path);
}

export function propertyOf<T extends object>(obj: T): <P extends string>(path: P) => DeepValueOf<T, P> | undefined {
  return <P extends string>(path: P) => get(obj, path);
}

export function matches<T extends object>(source: Partial<T>): (obj: T) => boolean {
  return (obj: T) => {
    for (const key of Object.keys(source)) {
      if (!equals((source as Record<string, unknown>)[key], (obj as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  };
}

export function matchesProperty<T extends object, K extends keyof T>(key: K, value: T[K]): (obj: T) => boolean {
  return (obj: T) => equals(obj[key], value);
}

export function isMatch<T extends object>(obj: T, source: Partial<T>): boolean {
  return matches(source)(obj);
}

export function assign<T extends object, U extends object>(target: T, ...sources: U[]): T & U {
  return Object.assign({}, target, ...sources);
}

export function assignIn<T extends object, U extends object>(target: T, ...sources: U[]): T & U {
  const result = { ...target } as Record<string, unknown>;

  for (const source of sources) {
    let current: object | null = source;
    while (current !== null && current !== Object.prototype) {
      for (const key of Object.keys(current)) {
        if (!(key in result)) {
          result[key] = (source as Record<string, unknown>)[key];
        }
      }
      current = Object.getPrototypeOf(current);
    }
  }

  return result as T & U;
}

export function assignWith<T extends object, U extends object>(
  target: T,
  source: U,
  customizer: (objValue: unknown, srcValue: unknown, key: string, target: T, source: U) => unknown
): T & U {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const objValue = result[key];
    const srcValue = (source as Record<string, unknown>)[key];
    result[key] = customizer(objValue, srcValue, key, target, source);
  }

  return result as T & U;
}

export function create<T extends object>(prototype: T, properties?: PropertyDescriptorMap): T {
  const obj = Object.create(prototype);
  if (properties) {
    Object.defineProperties(obj, properties);
  }
  return obj;
}

export function defaultsDeepAll<T extends object>(obj: T, ...sources: Partial<T>[]): T {
  let result = { ...obj };
  for (const source of sources) {
    result = defaultsDeep(result, source);
  }
  return result;
}

export function mergeWith<T extends object, U extends object>(
  target: T,
  source: U,
  customizer: (objValue: unknown, srcValue: unknown, key: string, target: T, source: U) => unknown
): T & U {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const objValue = result[key];
    const srcValue = (source as Record<string, unknown>)[key];

    if (isPlainObject(objValue) && isPlainObject(srcValue)) {
      result[key] = mergeWith(objValue as Record<string, unknown>, srcValue as Record<string, unknown>, customizer as never);
    } else {
      result[key] = customizer(objValue, srcValue, key, target, source) ?? srcValue;
    }
  }

  return result as T & U;
}

export function toPlainObject<T extends object>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let current: object | null = obj;

  while (current !== null && current !== Object.prototype) {
    for (const key of Object.keys(current)) {
      if (!(key in result)) {
        result[key] = (obj as Record<string, unknown>)[key];
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return result;
}

export function toMerged<T extends object, U extends object>(target: T, source: U): T & U {
  return mergeDeep(cloneDeep(target), source);
}

export function getPrototype<T extends object>(obj: T): object | null {
  return Object.getPrototypeOf(obj);
}

export function getOwnPropertyNames<T extends object>(obj: T): string[] {
  return Object.getOwnPropertyNames(obj);
}

export function getOwnPropertySymbols<T extends object>(obj: T): symbol[] {
  return Object.getOwnPropertySymbols(obj);
}

export function getOwnPropertyDescriptors<T extends object>(obj: T): PropertyDescriptorMap & ThisType<T> {
  return Object.getOwnPropertyDescriptors(obj);
}

export function freeze<T extends object>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

export function isFrozen<T extends object>(obj: T): boolean {
  return Object.isFrozen(obj);
}

export function seal<T extends object>(obj: T): T {
  return Object.seal(obj);
}

export function isSealed<T extends object>(obj: T): boolean {
  return Object.isSealed(obj);
}

export function preventExtensions<T extends object>(obj: T): T {
  return Object.preventExtensions(obj);
}

export function isExtensible<T extends object>(obj: T): boolean {
  return Object.isExtensible(obj);
}

export function defineProperty<T extends object>(obj: T, key: PropertyKey, descriptor: PropertyDescriptor): T {
  Object.defineProperty(obj, key, descriptor);
  return obj;
}

export function defineProperties<T extends object>(obj: T, properties: PropertyDescriptorMap & ThisType<T>): T {
  Object.defineProperties(obj, properties);
  return obj;
}

export function hasOwnProperty<T extends object>(obj: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isPrototypeOf<T extends object>(obj: T, value: unknown): boolean {
  return Object.prototype.isPrototypeOf.call(obj, value as object);
}

export function propertyIsEnumerable<T extends object>(obj: T, key: PropertyKey): boolean {
  return Object.prototype.propertyIsEnumerable.call(obj, key);
}

export function isArguments(value: unknown): boolean {
  return Object.prototype.toString.call(value) === '[object Arguments]';
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isFinite(value: unknown): boolean {
  return Number.isFinite(value);
}

export function isInteger(value: unknown): boolean {
  return Number.isInteger(value);
}

export function isNaN(value: unknown): boolean {
  return Number.isNaN(value);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

export function isArrayLike(value: unknown): boolean {
  return value != null && typeof value !== 'function' && typeof (value as { length: unknown }).length === 'number';
}

export function isArrayLikeObject(value: unknown): value is object & { length: number } {
  return isObject(value) && isArrayLike(value);
}

export function isBuffer(value: unknown): boolean {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function isElement(value: unknown): boolean {
  return value instanceof Element;
}

export function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

export function isLength(value: unknown): boolean {
  return typeof value === 'number' && value >= 0 && value <= Number.MAX_SAFE_INTEGER && Number.isInteger(value);
}

export function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map;
}

export function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set;
}

export function isWeakMap(value: unknown): value is WeakMap<object, unknown> {
  return value instanceof WeakMap;
}

export function isWeakSet(value: unknown): value is WeakSet<object> {
  return value instanceof WeakSet;
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

export function isTypedArray(value: unknown): boolean {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

export function isDataView(value: unknown): value is DataView {
  return value instanceof DataView;
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise;
}

export function isObservable(value: unknown): boolean {
  return value != null && typeof (value as { subscribe: unknown }).subscribe === 'function';
}

export function isGenerator(value: unknown): boolean {
  return value != null && typeof (value as { next: unknown; throw: unknown }).next === 'function' && typeof (value as { next: unknown; throw: unknown }).throw === 'function';
}

export function isIterable(value: unknown): boolean {
  return value != null && typeof (value as { [Symbol.iterator]: unknown })[Symbol.iterator] === 'function';
}

export function isAsyncIterable(value: unknown): boolean {
  return value != null && typeof (value as { [Symbol.asyncIterator]: unknown })[Symbol.asyncIterator] === 'function';
}

export function toArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  return NaN;
}

export function toString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

export function toInteger(value: unknown): number {
  const num = toNumber(value);
  return isNaN(num) ? 0 : Math.trunc(num);
}

export function toSafeInteger(value: unknown): number {
  const num = toInteger(value);
  return Math.min(Math.max(num, Number.MIN_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
}

export function toFinite(value: unknown): number {
  const num = toNumber(value);
  if (isNaN(num)) return 0;
  if (!Number.isFinite(num)) return num > 0 ? Number.MAX_VALUE : -Number.MAX_VALUE;
  return num;
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.length > 0 && value !== 'false';
  if (typeof value === 'number') return value !== 0;
  return true;
}

export function toPath(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split('.').flatMap((part) => {
      const match = part.match(/([^\[\]]+)|\[(\d+)\]/g);
      return match ?? [];
    });
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [];
}

export function uniqueId(prefix: string = ''): string {
  const id = Math.random().toString(36).substring(2, 9);
  return prefix + id;
}

export function identity<T>(value: T): T {
  return value;
}

export function noop(): void {}

export function constant<T>(value: T): () => T {
  return () => value;
}

export function times<T>(n: number, iteratee: (index: number) => T): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(iteratee(i));
  }
  return result;
}

export function stubArray(): unknown[] {
  return [];
}

export function stubFalse(): boolean {
  return false;
}

export function stubObject(): Record<string, unknown> {
  return {};
}

export function stubString(): string {
  return '';
}

export function stubTrue(): boolean {
  return true;
}
