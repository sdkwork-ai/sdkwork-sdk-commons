import type {
  HttpClientConfig,
  RequestConfig,
  RequestOptions,
  QueryParams,
  HttpHeaders,
  ApiResult,
  Interceptors,
  UploadOptions,
  DownloadOptions,
} from '../core/types';
import { DEFAULT_TIMEOUT, SUCCESS_CODES, MIME_TYPES, HTTP_STATUS } from '../core/types';
import {
  SdkError,
  NetworkError,
  TimeoutError,
  CancelledError,
} from '../errors';
import type { AuthTokenManager, AuthMode } from '../auth';
import { DefaultAuthTokenManager, buildAuthHeaders } from '../auth';
import { createLogger, type Logger } from '../utils/logger';
import { createCacheStore, type CacheStore } from '../utils/cache';
import { withRetry } from '../utils/retry';
import {
  extractStreamLines,
  normalizeLegacyStreamLine,
  ServerSentEventDataParser,
} from './stream-parser';

export interface HttpClientOptions extends HttpClientConfig {
  apiKey?: string;
  accessToken?: string;
  authToken?: string;
  tokenManager?: AuthTokenManager;
}

export interface HttpClientAuthConfig {
  authMode: AuthMode;
  apiKey?: string;
  tokenManager?: AuthTokenManager;
}

export interface RequestExecutor {
  execute<T>(config: RequestConfig): Promise<T>;
}

export interface ResponseProcessor {
  process<T>(response: Response, config: RequestConfig): Promise<T>;
}

export interface UrlBuilder {
  build(path: string, params?: QueryParams): string;
}

export interface HeaderBuilder {
  build(config: RequestConfig, skipAuth?: boolean): HttpHeaders;
}

const SDKWORK_API_PREFIXES = ['/app/v3/api', '/backend/v3/api', '/gateway/v3/api'] as const;

function dedupeSdkWorkApiPath(baseUrl: string, path: string): string {
  for (const prefix of SDKWORK_API_PREFIXES) {
    if (baseUrl.endsWith(prefix) && path.startsWith(prefix)) {
      const remainder = path.slice(prefix.length);
      return remainder.startsWith('/') ? remainder : `/${remainder}`;
    }
  }
  return path;
}

function isApiResultEnvelope<T>(value: unknown): value is ApiResult<T> {
  return value !== null
    && value !== undefined
    && typeof value === 'object'
    && !Array.isArray(value)
    && 'code' in value
    && ('data' in value || 'msg' in value || 'message' in value);
}

/**
 * Canonical identity projection headers forbidden on app/backend dual-token calls.
 *
 * Aligned 1:1 with the Web Framework server guard
 * `sdkwork-web-core::constants::FORBIDDEN_CLIENT_IDENTITY_HEADERS` (API_SPEC §10.2,
 * SECURITY_SPEC §5.1, spec B9). The server rejects any request carrying these
 * headers with 400/40001 (surface-classification), so clients must strip them
 * defensively before sending. Extra client-side entries (x-sdkwork-subject-*,
 * x-platform) are superset hardening and harmless.
 */
const IDENTITY_PROJECTION_HEADER_NAMES = new Set([
  'x-sdkwork-tenant-id',
  'x-sdkwork-app-id',
  'x-sdkwork-user-id',
  'x-sdkwork-organization-id',
  'x-sdkwork-actor-id',
  'x-sdkwork-actor-kind',
  'x-sdkwork-session-id',
  'x-sdkwork-environment',
  'x-sdkwork-deployment-profile',
  'x-sdkwork-deployment-mode',
  'x-sdkwork-runtime-target',
  'x-sdkwork-auth-level',
  'x-sdkwork-data-scope',
  'x-sdkwork-permission-scope',
  'x-sdkwork-device-id',
  'x-sdkwork-context-signature',
  // Server-derived route metadata: the framework MUST derive operation_id from
  // the route manifest, never from client-supplied headers (API_SPEC §10.2).
  'x-sdkwork-operation-id',
  'x-sdkwork-subject-tenant-id',
  'x-sdkwork-subject-organization-id',
  'x-sdkwork-subject-user-id',
  'x-sdkwork-subject-timestamp',
  'x-sdkwork-subject-signature',
  'x-tenant-id',
  'x-app-id',
  'x-organization-id',
  'x-platform',
  'x-user-id',
]);

function stripIdentityProjectionHeaders(headers: HttpHeaders): void {
  for (const name of Object.keys(headers)) {
    if (IDENTITY_PROJECTION_HEADER_NAMES.has(name.toLowerCase())) {
      delete headers[name];
    }
  }
}

export abstract class BaseHttpClient implements RequestExecutor {
  protected config: Required<Omit<HttpClientConfig, 'interceptors'>> & { baseUrl: string };
  protected authConfig: HttpClientAuthConfig;
  protected logger: Logger;
  protected cache: CacheStore;
  protected interceptors: Interceptors;

  constructor(config: HttpClientOptions) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      headers: config.headers ?? {},
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        retryBackoff: 'exponential',
        maxRetryDelay: 30000,
        ...config.retry,
      },
      cache: {
        enabled: false,
        ttl: 5 * 60 * 1000,
        maxSize: 100,
        ...config.cache,
      },
      logger: {
        level: 'info',
        prefix: '[SDK]',
        timestamp: true,
        colors: true,
        ...config.logger,
      },
    };

    this.logger = createLogger(this.config.logger);
    this.cache = createCacheStore(this.config.cache);

    this.interceptors = config.interceptors ?? {
      request: [],
      response: [],
      error: [],
    };

    const authMode = this.determineAuthMode(config);
    const tokenManager = config.tokenManager ?? new DefaultAuthTokenManager({
      ...(config.accessToken !== undefined ? { accessToken: config.accessToken } : {}),
      ...(config.authToken !== undefined ? { authToken: config.authToken } : {}),
    });
    this.authConfig = {
      authMode,
      ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
      tokenManager,
    };
  }

  protected determineAuthMode(config: HttpClientOptions): AuthMode {
    if (config.apiKey) {
      return 'apikey';
    }
    return 'dual-token';
  }

  getAuthMode(): AuthMode {
    return this.authConfig.authMode;
  }

  setAuthMode(mode: AuthMode): void {
    this.authConfig.authMode = mode;
  }

  getTokenManager(): AuthTokenManager | undefined {
    return this.authConfig.tokenManager;
  }

  setTokenManager(manager: AuthTokenManager): void {
    this.authConfig.tokenManager = manager;
  }

  setApiKey(apiKey: string): void {
    this.authConfig.apiKey = apiKey;
    this.authConfig.authMode = 'apikey';
    this.authConfig.tokenManager?.clearTokens();
  }

  setAuthToken(token: string): void {
    this.authConfig.tokenManager?.setAuthToken(token);
    if (this.authConfig.authMode === 'apikey') {
      this.authConfig.authMode = 'dual-token';
      delete this.authConfig.apiKey;
    }
  }

  setAccessToken(token: string): void {
    this.authConfig.tokenManager?.setAccessToken(token);
    if (this.authConfig.authMode === 'apikey') {
      this.authConfig.authMode = 'dual-token';
      delete this.authConfig.apiKey;
    }
  }

  clearAuthToken(): void {
    this.authConfig.tokenManager?.clearTokens();
  }

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): () => void {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  addResponseInterceptor(interceptor: (response: unknown, config: RequestConfig) => unknown | Promise<unknown>): () => void {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  addErrorInterceptor(interceptor: (error: Error, config: RequestConfig) => void | Promise<void>): () => void {
    this.interceptors.error.push(interceptor);
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.error.splice(index, 1);
      }
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      authMode: this.authConfig.authMode,
      apiKey: this.authConfig.apiKey,
      accessToken: this.authConfig.tokenManager?.getAccessToken(),
      authToken: this.authConfig.tokenManager?.getAuthToken(),
    };
  }

  isAuthenticated(): boolean {
    return this.authConfig.tokenManager?.isValid() ?? false;
  }

  protected buildBaseUrl(path: string, params?: QueryParams): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const requestPath = dedupeSdkWorkApiPath(baseUrl, normalizedPath);
    let url = `${baseUrl}${requestPath}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null) {
              searchParams.append(key, String(item));
            }
          });
          return;
        }
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  protected buildHeaders(config: RequestConfig, skipAuth: boolean = false): HttpHeaders {
    const headers: HttpHeaders = {
      'Content-Type': MIME_TYPES.JSON,
      ...this.config.headers,
      ...config.headers,
    };

    if (!skipAuth && !config.skipAuth) {
      const authHeaders = buildAuthHeaders(
        this.authConfig.authMode,
        this.authConfig.apiKey,
        this.authConfig.tokenManager
      );
      Object.assign(headers, authHeaders);
    }

    // SDKWork API_SPEC §10.2 / SECURITY_SPEC §5.1: clients must not project
    // identity into requests. The server derives tenant/organization/user
    // from the authenticated principal (dual token). Strip any leaked
    // projection headers from config.headers so stale callers cannot trip
    // Web Framework surface classification (40001).
    stripIdentityProjectionHeaders(headers);

    return headers;
  }

  protected serializeRequestBody(body: unknown, headers: HttpHeaders): BodyInit | string | undefined {
    if (body === undefined || body === null) {
      return undefined;
    }

    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      delete headers['Content-Type'];
      return body;
    }

    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      return body.toString();
    }

    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      delete headers['Content-Type'];
      return body;
    }

    if (typeof ArrayBuffer !== 'undefined') {
      if (body instanceof ArrayBuffer) {
        delete headers['Content-Type'];
        return body;
      }
      if (ArrayBuffer.isView(body)) {
        delete headers['Content-Type'];
        return body as unknown as BodyInit;
      }
    }

    if (typeof body === 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'text/plain;charset=UTF-8';
      return body;
    }

    return JSON.stringify(body);
  }

  protected async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  protected async applyResponseInterceptors<T>(response: T, config: RequestConfig): Promise<T> {
    let processedResponse: T = response;
    for (const interceptor of this.interceptors.response) {
      processedResponse = (await interceptor(processedResponse, config)) as T;
    }
    return processedResponse;
  }

  protected async applyErrorInterceptors(error: Error, config: RequestConfig): Promise<void> {
    for (const interceptor of this.interceptors.error) {
      await interceptor(error, config);
    }
  }

  protected async handleErrorResponse(response: Response, config: RequestConfig): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let problem: import('../errors').SdkProblemDetail | undefined;

    try {
      const result = await response.json() as Record<string, unknown>;
      errorMessage = String(result.detail || result.msg || result.message || result.title || errorMessage);
      if (
        response.headers.get('content-type')?.includes('application/problem+json')
        || ('status' in result && 'code' in result && 'traceId' in result)
      ) {
        problem = result as import('../errors').SdkProblemDetail;
      }
    } catch {
      // Ignore JSON parse errors
    }

    const error = SdkError.fromHttpStatus(
      response.status,
      errorMessage,
      problem === undefined ? undefined : { problem }
    );

    await this.applyErrorInterceptors(error, config);
    throw error;
  }

  protected async processResponse<T>(response: Response, config: RequestConfig): Promise<T> {
    if (!response.ok) {
      await this.handleErrorResponse(response, config);
    }

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes(MIME_TYPES.JSON)) {
      const body = await response.text();
      if (!body.trim()) {
        return undefined as T;
      }

      const result: unknown = JSON.parse(body);

      if (!isApiResultEnvelope<T>(result)) {
        return result as T;
      }

      if (!SUCCESS_CODES.includes(result.code) && !SUCCESS_CODES.includes(String(result.code))) {
        throw SdkError.fromApiResult(result, response.status);
      }

      return result.data as T;
    }

    if (contentType?.includes('text/')) {
      return (await response.text()) as unknown as T;
    }

    return await response.json() as T;
  }

  protected async executeFetch(
    url: string,
    options: {
      method: string;
      headers: HttpHeaders;
      body?: string | BodyInit | null;
      timeout: number;
      signal?: AbortSignal;
    }
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeout);

    const abortHandler = () => controller.abort();

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', abortHandler, { once: true });
      }
    }

    try {
      this.logger.debug(`${options.method} ${url}`);

      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        ...(options.body !== undefined ? { body: options.body } : {}),
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (timedOut) {
            throw new TimeoutError(`Request timeout after ${options.timeout}ms`, options.timeout);
          }
          throw new CancelledError('Request was cancelled');
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError('Unknown network error');
    } finally {
      clearTimeout(timeoutId);
      if (options.signal) {
        options.signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  async execute<T>(config: RequestConfig): Promise<T> {
    const processedConfig = await this.applyRequestInterceptors(config);
    const url = this.buildBaseUrl(processedConfig.url, processedConfig.params);
    const headers = this.buildHeaders(processedConfig);
    const serializedBody = this.serializeRequestBody(processedConfig.body, headers);

    const response = await this.executeFetch(url, {
      method: processedConfig.method,
      headers,
      ...(serializedBody !== undefined ? { body: serializedBody } : {}),
      timeout: processedConfig.timeout ?? this.config.timeout,
      ...(processedConfig.signal !== undefined ? { signal: processedConfig.signal } : {}),
    });

    return this.processResponse<T>(response, processedConfig);
  }

  abstract request<T>(path: string, options?: RequestOptions): Promise<T>;
  abstract get<T>(path: string, params?: QueryParams): Promise<T>;
  abstract post<T>(path: string, body?: unknown): Promise<T>;
  abstract put<T>(path: string, body?: unknown): Promise<T>;
  abstract delete<T>(path: string, body?: unknown): Promise<T>;
  abstract patch<T>(path: string, body?: unknown): Promise<T>;

  async upload<T>(path: string, options: UploadOptions): Promise<T> {
    const formData = new FormData();
    formData.append(options.fieldName ?? 'file', options.file);

    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config: RequestConfig = {
      url: path,
      method: 'POST',
      body: formData,
      skipAuth: false,
    };

    const processedConfig = await this.applyRequestInterceptors(config);
    const url = this.buildBaseUrl(processedConfig.url, processedConfig.params);
    const headers = this.buildHeaders(processedConfig);
    delete headers['Content-Type'];

    const response = await this.executeFetch(url, {
      method: 'POST',
      headers,
      body: formData,
      timeout: processedConfig.timeout ?? this.config.timeout,
      ...(processedConfig.signal !== undefined ? { signal: processedConfig.signal } : {}),
    });

    return this.processResponse<T>(response, processedConfig);
  }

  async download(path: string, _options?: DownloadOptions): Promise<Blob> {
    const config: RequestConfig = {
      url: path,
      method: 'GET',
      skipAuth: false,
    };

    const processedConfig = await this.applyRequestInterceptors(config);
    const url = this.buildBaseUrl(processedConfig.url, processedConfig.params);
    const headers = this.buildHeaders(processedConfig);

    const response = await this.executeFetch(url, {
      method: 'GET',
      headers,
      timeout: processedConfig.timeout ?? this.config.timeout,
      ...(processedConfig.signal !== undefined ? { signal: processedConfig.signal } : {}),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, processedConfig);
    }

    return response.blob();
  }

  async *stream(path: string, options?: RequestOptions): AsyncIterable<string> {
    const config: RequestConfig = {
      url: path,
      method: options?.method ?? 'POST',
      ...(options?.body !== undefined ? { body: options.body } : {}),
      ...(options?.headers !== undefined ? { headers: options.headers } : {}),
      ...(options?.params !== undefined ? { params: options.params } : {}),
      ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
      ...(options?.signal !== undefined ? { signal: options.signal } : {}),
      ...(options?.skipAuth !== undefined ? { skipAuth: options.skipAuth } : {}),
      ...(options?.metadata !== undefined ? { metadata: options.metadata } : {}),
    };

    const processedConfig = await this.applyRequestInterceptors(config);
    const url = this.buildBaseUrl(processedConfig.url, processedConfig.params);
    const headers = this.buildHeaders(processedConfig);
    const serializedBody = this.serializeRequestBody(processedConfig.body, headers);

    const response = await this.executeFetch(url, {
      method: processedConfig.method,
      headers,
      ...(serializedBody !== undefined ? { body: serializedBody } : {}),
      timeout: processedConfig.timeout ?? this.config.timeout,
      ...(processedConfig.signal !== undefined ? { signal: processedConfig.signal } : {}),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, processedConfig);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new NetworkError('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    const isEventStream = response.headers
      .get('content-type')
      ?.toLowerCase()
      .includes('text/event-stream') === true;
    const eventParser = isEventStream ? new ServerSentEventDataParser() : undefined;

    const parseLine = eventParser
      ? (line: string): string | undefined => eventParser.pushLine(line)
      : normalizeLegacyStreamLine;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const extracted = extractStreamLines(buffer);
        buffer = extracted.remainder;

        for (const line of extracted.lines) {
          const data = parseLine(line);
          if (data !== undefined) {
            yield data;
          }
        }
      }

      buffer += decoder.decode();
      const extracted = extractStreamLines(buffer, true);
      for (const line of extracted.lines) {
        const data = parseLine(line);
        if (data !== undefined) {
          yield data;
        }
      }

      const finalData = eventParser?.flush();
      if (finalData !== undefined) {
        yield finalData;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export function createBaseHttpClient(config: HttpClientOptions): BaseHttpClient {
  return new (class extends BaseHttpClient {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const config: RequestConfig = {
        url: path,
        method: options.method ?? 'GET',
        ...(options.headers !== undefined ? { headers: options.headers } : {}),
        ...(options.params !== undefined ? { params: options.params } : {}),
        ...(options.body !== undefined ? { body: options.body } : {}),
        ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
        ...(options.signal !== undefined ? { signal: options.signal } : {}),
        ...(options.skipAuth !== undefined ? { skipAuth: options.skipAuth } : {}),
      };

      return withRetry(
        () => this.execute<T>(config),
        { ...this.config.retry, ...options.retry }
      );
    }

    async get<T>(path: string, params?: QueryParams): Promise<T> {
      return this.request<T>(path, {
        method: 'GET',
        ...(params !== undefined ? { params } : {}),
      });
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
      return this.request<T>(path, { method: 'POST', body });
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
      return this.request<T>(path, { method: 'PUT', body });
    }

    async delete<T>(path: string, body?: unknown): Promise<T> {
      return this.request<T>(path, { method: 'DELETE', body });
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
      return this.request<T>(path, { method: 'PATCH', body });
    }
  })(config);
}
