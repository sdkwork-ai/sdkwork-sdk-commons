import type { CacheConfig, RequestConfig } from '../core/types';
import { DEFAULT_CACHE_CONFIG } from '../core/types';

export interface CacheStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheStore implements CacheStore {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;
  private defaultTtl: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.maxSize = config.maxSize ?? DEFAULT_CACHE_CONFIG.maxSize;
    this.defaultTtl = config.ttl ?? DEFAULT_CACHE_CONFIG.ttl;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
    this.cache.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export function createCacheStore(config?: Partial<CacheConfig>): CacheStore {
  return new MemoryCacheStore(config);
}

export function generateCacheKey(config: RequestConfig): string {
  const parts = [
    config.method,
    config.url,
    JSON.stringify(config.params ?? {}),
    JSON.stringify(config.body ?? {}),
  ];

  return parts.join(':');
}
