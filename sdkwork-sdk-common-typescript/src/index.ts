export type {
  HttpMethod,
  LogLevel,
  QueryParams,
  HttpHeaders,
  ApiResult,
  PageResult,
  Pageable,
  Page,
  DeepPartial,
  PickByType,
  RequiredByKeys,
  OptionalByKeys,
  RequestConfig,
  RequestOptions,
  RetryConfig,
  CacheConfig,
  LoggerConfig,
  Interceptors,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  HttpClientConfig,
  SdkConfig,
} from './core/index';

export {
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_TIMEOUT,
  SUCCESS_CODES,
  HTTP_STATUS,
  MIME_TYPES,
} from './core/index';

export {
  DefaultAuthTokenManager,
  createTokenManager,
  buildAuthHeaders,
  isTokenValid,
  requiresRefresh,
} from './auth/index';

export type {
  AuthTokenManager,
  AuthMode,
  AuthTokens,
  TokenManagerEvents,
  AuthConfig,
  OAuthConfig,
  OAuthTokens,
} from './auth/index';

export {
  createLogger,
  noopLogger,
  createCacheStore,
  generateCacheKey,
  withRetry,
  sleep,
  calculateDelay,
  createRetryConfig,
  resolveBaseUrl,
  alignBaseUrlToPageProtocol,
  resolveBaseUrlWithAlignProtocol,
  readRuntimeEnv,
  splitBaseUrls,
  getEnvironmentLabel,
  getBrand,
  getApiHostForEnvironment,
  resolveApiHost,
  resolveApiPort,
  resolveDeploymentMode,
  normalizeDeploymentMode,
  CLOUD_GATEWAY_DEV_PORT,
  DEPLOYMENT_MODE_ENV_KEYS,
  DEV_PORT_ENV_KEY,
  DEVELOPMENT_ENVIRONMENT_LABEL,
} from './utils/index';

export type {
  Logger,
  CacheStore,
  BaseUrlResolution,
  DeploymentMode,
} from './utils/index';

export {
  SdkError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  TokenExpiredError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  CancelledError,
  isSdkError,
  isNetworkError,
  isAuthError,
  isRetryableError,
} from './errors/index';

export type { ErrorCode, ErrorDetail, SdkProblemDetail } from './errors/index';

export { BaseHttpClient, createBaseHttpClient } from './http/index';
export type {
  HttpClientOptions,
  HttpClientAuthConfig,
  RequestExecutor,
  ResponseProcessor,
  UrlBuilder,
  HeaderBuilder,
} from './http/index';
