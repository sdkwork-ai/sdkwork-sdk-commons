import type { RetryConfig } from '../core/types';
import { DEFAULT_RETRY_CONFIG } from '../core/types';
import { isRetryableError } from '../errors';

export { DEFAULT_RETRY_CONFIG };

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateDelay(
  attempt: number,
  baseDelay: number,
  backoff: RetryConfig['retryBackoff'],
  maxDelay: number
): number {
  let delay: number;

  switch (backoff) {
    case 'fixed':
      delay = baseDelay;
      break;
    case 'linear':
      delay = baseDelay * attempt;
      break;
    case 'exponential':
      delay = baseDelay * Math.pow(2, attempt - 1);
      break;
    default:
      delay = baseDelay;
  }

  return Math.min(delay, maxDelay);
}

export function shouldRetry(
  error: Error,
  attempt: number,
  config: RetryConfig
): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  if (config.retryCondition) {
    return config.retryCondition(error, attempt);
  }

  return isRetryableError(error);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= fullConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (!shouldRetry(lastError, attempt, fullConfig)) {
        throw lastError;
      }

      const delay = calculateDelay(
        attempt,
        fullConfig.retryDelay,
        fullConfig.retryBackoff,
        fullConfig.maxRetryDelay
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

export function createRetryConfig(config?: Partial<RetryConfig>): RetryConfig {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
}
