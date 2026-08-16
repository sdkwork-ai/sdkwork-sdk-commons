export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type QueryParamScalar = string | number | boolean | undefined | null;

export type QueryParamValue = QueryParamScalar | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryParamValue>;

export type HttpHeaders = Record<string, string>;

export interface ApiResult<T = unknown> {
  code: number | string;
  msg?: string;
  message?: string;
  data: T;
  timestamp?: number;
  traceId?: string;
}

export interface PageResult<T> {
  content?: T[];
  list?: T[];
  total: number;
  totalElements?: number;
  page: number;
  pageSize: number;
  size?: number;
  totalPages: number;
  hasMore: boolean;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
  number?: number;
}

export interface Pageable {
  page?: number;
  pageSize?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

export type RequiredByKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type OptionalByKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Awaitable<T> = T | Promise<T>;

export type MaybeArray<T> = T | T[];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Primitive = string | number | boolean | null | undefined;

export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = { [key: string]: JsonValue };

export type JsonArray = JsonValue[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface RequestConfig {
  url: string;
  method: HttpMethod;
  headers?: HttpHeaders;
  params?: QueryParams;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface RequestOptions {
  method?: HttpMethod;
  headers?: HttpHeaders;
  body?: unknown;
  params?: QueryParams;
  signal?: AbortSignal;
  skipAuth?: boolean;
  requiresAuth?: boolean;
  timeout?: number;
  retry?: Partial<RetryConfig>;
  cache?: boolean | number;
  metadata?: Record<string, unknown>;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoff: 'fixed' | 'linear' | 'exponential';
  maxRetryDelay: number;
  retryCondition?: (error: Error, retryCount: number) => boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export interface Interceptors {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

export type ResponseInterceptor<T = unknown> = (response: T, config: RequestConfig) => T | Promise<T>;

export type ErrorInterceptor = (error: Error, config: RequestConfig) => void | Promise<void>;

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: HttpHeaders;
  retry?: Partial<RetryConfig>;
  cache?: Partial<CacheConfig>;
  logger?: Partial<LoggerConfig>;
  interceptors?: Interceptors;
}

export interface SdkConfig extends HttpClientConfig {}

export interface RequestState {
  pending: boolean;
  loading: boolean;
  error: Error | null;
  data: unknown;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (event: ProgressEvent) => void;
  file: File | Blob;
  fieldName?: string;
  additionalData?: Record<string, string | Blob>;
}

export interface DownloadOptions {
  onProgress?: (event: ProgressEvent) => void;
  filename?: string;
}

export interface StreamOptions {
  onMessage?: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 'exponential',
  maxRetryDelay: 30000,
};

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: false,
  ttl: 5 * 60 * 1000,
  maxSize: 100,
};

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  prefix: '[SDK]',
  timestamp: true,
  colors: true,
};

export const DEFAULT_TIMEOUT = 30000;

export const SUCCESS_CODES: (number | string)[] = [0, 200, 2000, '0', '200', '2000'];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const MIME_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  OCTET_STREAM: 'application/octet-stream',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
} as const;
