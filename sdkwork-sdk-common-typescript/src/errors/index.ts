import type { ApiResult } from '../core/types';
import { HTTP_STATUS } from '../core/types';

export type ErrorCode = 
  | 'UNKNOWN'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'BUSINESS_ERROR'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_GATEWAY'
  | 'GATEWAY_TIMEOUT';

export interface ErrorDetail {
  field?: string;
  message?: string;
  value?: unknown;
  code?: string;
  constraint?: string;
}

export interface ErrorOptions {
  cause?: Error;
  details?: ErrorDetail[];
  problem?: SdkProblemDetail;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export interface SdkProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  code?: number | string;
  detail?: string;
  instance?: string;
  operationId?: string;
  i18nKey?: string;
  locale?: string;
  traceId?: string;
}

export class SdkError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number | undefined;
  public readonly details: ErrorDetail[] | undefined;
  public readonly timestamp: number;
  public readonly traceId: string | undefined;
  public readonly problem: SdkProblemDetail | undefined;
  public readonly metadata: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN',
    httpStatus?: number,
    options?: ErrorOptions
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = options?.details;
    this.timestamp = Date.now();
    this.traceId = options?.traceId ?? options?.problem?.traceId;
    this.problem = options?.problem;
    this.metadata = options?.metadata;
    
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromApiResult(result: ApiResult, httpStatus?: number): SdkError {
    const code = String(result.code);
    const message = result.msg || result.message || 'Unknown error';
    
    switch (code) {
      case '400':
      case '4000':
        return new ValidationError(message);
      case '401':
      case '4010':
        return new AuthenticationError(message);
      case '403':
      case '4030':
        return new ForbiddenError(message);
      case '404':
      case '4040':
        return new NotFoundError(message);
      case '409':
      case '4090':
        return new ConflictError(message);
      case '429':
      case '4290':
        return new RateLimitError(message);
      default:
        if (code.startsWith('5')) {
          return new ServerError(message, httpStatus ?? HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        return new BusinessError(message, result.code, result.data);
    }
  }

  static fromHttpStatus(status: number, message?: string, options?: ErrorOptions): SdkError {
    const defaultMessage = message ?? `HTTP Error ${status}`;
    
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return new ValidationError(defaultMessage, undefined, options);
      case HTTP_STATUS.UNAUTHORIZED:
        return new AuthenticationError(defaultMessage, options);
      case HTTP_STATUS.FORBIDDEN:
        return new ForbiddenError(defaultMessage, options);
      case HTTP_STATUS.NOT_FOUND:
        return new NotFoundError(defaultMessage, options);
      case HTTP_STATUS.METHOD_NOT_ALLOWED:
        return new ValidationError(defaultMessage, undefined, options);
      case HTTP_STATUS.CONFLICT:
        return new ConflictError(defaultMessage, options);
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return new RateLimitError(defaultMessage, undefined, options);
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return new ServerError(defaultMessage, status, options);
      case HTTP_STATUS.BAD_GATEWAY:
        return new BadGatewayError(defaultMessage, options);
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableError(defaultMessage, options);
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        return new GatewayTimeoutError(defaultMessage, options);
      default:
        if (status >= 500) {
          return new ServerError(defaultMessage, status, options);
        }
        return new NetworkError(defaultMessage, options);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatus: this.httpStatus,
      details: this.details,
      timestamp: this.timestamp,
      traceId: this.traceId,
      problem: this.problem,
      metadata: this.metadata,
    };
  }

  override toString(): string {
    return `${this.name}: ${this.message} (code: ${this.code})`;
  }

  isRetryable(): boolean {
    return isRetryableError(this);
  }

  isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'TOKEN_EXPIRED' || this.code === 'TOKEN_INVALID';
  }

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }

  isClientError(): boolean {
    return this.httpStatus !== undefined && this.httpStatus >= 400 && this.httpStatus < 500;
  }

  isServerError(): boolean {
    return this.httpStatus !== undefined && this.httpStatus >= 500;
  }
}

export class NetworkError extends SdkError {
  constructor(message: string = 'Network error', options?: ErrorOptions) {
    super(message, 'NETWORK_ERROR', undefined, options);
  }
}

export class TimeoutError extends SdkError {
  public readonly timeout: number | undefined;

  constructor(message: string = 'Request timeout', timeout?: number, options?: ErrorOptions) {
    super(message, 'TIMEOUT', undefined, options);
    this.timeout = timeout;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), timeout: this.timeout };
  }
}

export class CancelledError extends SdkError {
  constructor(message: string = 'Request cancelled', options?: ErrorOptions) {
    super(message, 'CANCELLED', undefined, options);
  }
}

export class AuthenticationError extends SdkError {
  constructor(message: string = 'Authentication failed', options?: ErrorOptions) {
    super(message, 'UNAUTHORIZED', HTTP_STATUS.UNAUTHORIZED, options);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Token expired', options?: ErrorOptions) {
    super(message, options);
    (this as { code: ErrorCode }).code = 'TOKEN_EXPIRED';
  }
}

export class TokenInvalidError extends AuthenticationError {
  constructor(message: string = 'Invalid token', options?: ErrorOptions) {
    super(message, options);
    (this as { code: ErrorCode }).code = 'TOKEN_INVALID';
  }
}

export class ForbiddenError extends SdkError {
  constructor(message: string = 'Access forbidden', options?: ErrorOptions) {
    super(message, 'FORBIDDEN', HTTP_STATUS.FORBIDDEN, options);
  }
}

export class NotFoundError extends SdkError {
  constructor(message: string = 'Resource not found', options?: ErrorOptions) {
    super(message, 'NOT_FOUND', HTTP_STATUS.NOT_FOUND, options);
  }
}

export class ValidationError extends SdkError {
  constructor(message: string = 'Validation error', details?: ErrorDetail[], options?: ErrorOptions) {
    super(
      message,
      'VALIDATION_ERROR',
      HTTP_STATUS.BAD_REQUEST,
      details === undefined ? options : { ...options, details }
    );
  }
}

export class ConflictError extends SdkError {
  constructor(message: string = 'Resource conflict', options?: ErrorOptions) {
    super(message, 'CONFLICT', HTTP_STATUS.CONFLICT, options);
  }
}

export class MethodNotAllowedError extends SdkError {
  public readonly allowedMethods: string[] | undefined;

  constructor(message: string = 'Method not allowed', allowedMethods?: string[], options?: ErrorOptions) {
    super(message, 'VALIDATION_ERROR', HTTP_STATUS.METHOD_NOT_ALLOWED, options);
    this.allowedMethods = allowedMethods;
  }
}

export class RateLimitError extends SdkError {
  public readonly retryAfter: number | undefined;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, options?: ErrorOptions) {
    super(message, 'RATE_LIMIT', HTTP_STATUS.TOO_MANY_REQUESTS, options);
    this.retryAfter = retryAfter;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), retryAfter: this.retryAfter };
  }
}

export class ServerError extends SdkError {
  constructor(message: string = 'Server error', httpStatus: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, options?: ErrorOptions) {
    super(message, 'SERVER_ERROR', httpStatus, options);
  }
}

export class BadGatewayError extends ServerError {
  constructor(message: string = 'Bad gateway', options?: ErrorOptions) {
    super(message, HTTP_STATUS.BAD_GATEWAY, options);
    (this as { code: ErrorCode }).code = 'BAD_GATEWAY';
  }
}

export class ServiceUnavailableError extends ServerError {
  constructor(message: string = 'Service unavailable', options?: ErrorOptions) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, options);
    (this as { code: ErrorCode }).code = 'SERVICE_UNAVAILABLE';
  }
}

export class GatewayTimeoutError extends ServerError {
  constructor(message: string = 'Gateway timeout', options?: ErrorOptions) {
    super(message, HTTP_STATUS.GATEWAY_TIMEOUT, options);
    (this as { code: ErrorCode }).code = 'GATEWAY_TIMEOUT';
  }
}

export class BusinessError extends SdkError {
  public readonly businessCode: string | number | undefined;
  public readonly data?: unknown;

  constructor(message: string, code?: string | number, data?: unknown, options?: ErrorOptions) {
    super(message, 'BUSINESS_ERROR', undefined, options);
    this.businessCode = code;
    this.data = data;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), businessCode: this.businessCode, data: this.data };
  }
}

export function isSdkError(error: unknown): error is SdkError {
  return error instanceof SdkError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isCancelledError(error: unknown): error is CancelledError {
  return error instanceof CancelledError;
}

export function isAuthError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}

export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof SdkError)) return false;
  
  return (
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    error instanceof ServerError ||
    error instanceof RateLimitError ||
    error instanceof BadGatewayError ||
    error instanceof ServiceUnavailableError ||
    error instanceof GatewayTimeoutError
  );
}
