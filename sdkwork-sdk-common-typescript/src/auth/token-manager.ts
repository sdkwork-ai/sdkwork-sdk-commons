export interface AuthTokens {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

export interface TokenManagerEvents {
  onTokenRefresh?: (tokens: AuthTokens) => void;
  onTokenExpired?: () => void;
  onTokenCleared?: () => void;
  onTokenSet?: (tokens: AuthTokens) => void;
  onTokenInvalid?: () => void;
}

export interface AuthTokenManager {
  getAccessToken(): string | undefined;
  getAuthToken(): string | undefined;
  getRefreshToken(): string | undefined;
  getTokens(): AuthTokens;
  setTokens(tokens: AuthTokens): void;
  setAccessToken(token: string): void;
  setAuthToken(token: string): void;
  setRefreshToken(token: string): void;
  clearTokens(): void;
  clearAuthToken(): void;
  clearAccessToken(): void;
  isExpired(): boolean;
  isValid(): boolean;
  hasToken(): boolean;
  hasAuthToken(): boolean;
  hasAccessToken(): boolean;
  willExpireIn(seconds: number): boolean;
}

export type AuthMode = 'apikey' | 'dual-token';

export interface AuthConfig {
  mode: AuthMode;
  apiKey?: string;
  accessToken?: string;
  authToken?: string;
  tokenManager?: AuthTokenManager;
}

export class DefaultAuthTokenManager implements AuthTokenManager {
  private tokens: AuthTokens = {};
  private readonly events: TokenManagerEvents | undefined;

  constructor(initialTokens?: AuthTokens, events?: TokenManagerEvents) {
    if (initialTokens) {
      this.tokens = { ...initialTokens };
      if (initialTokens.expiresIn && !initialTokens.expiresAt) {
        this.tokens.expiresAt = Date.now() + initialTokens.expiresIn * 1000;
      }
    }
    this.events = events;
  }

  getAccessToken(): string | undefined {
    return this.tokens.accessToken;
  }

  getAuthToken(): string | undefined {
    return this.tokens.authToken;
  }

  getRefreshToken(): string | undefined {
    return this.tokens.refreshToken;
  }

  getTokens(): AuthTokens {
    return { ...this.tokens };
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = { ...tokens };
    if (tokens.expiresIn && !tokens.expiresAt) {
      this.tokens.expiresAt = Date.now() + tokens.expiresIn * 1000;
    }
    this.events?.onTokenSet?.(this.tokens);
  }

  setAccessToken(token: string): void {
    this.tokens.accessToken = token;
    this.events?.onTokenSet?.(this.tokens);
  }

  setAuthToken(token: string): void {
    this.tokens.authToken = token;
    this.events?.onTokenSet?.(this.tokens);
  }

  setRefreshToken(token: string): void {
    this.tokens.refreshToken = token;
  }

  clearTokens(): void {
    this.tokens = {};
    this.events?.onTokenCleared?.();
  }

  clearAuthToken(): void {
    delete this.tokens.authToken;
  }

  clearAccessToken(): void {
    delete this.tokens.accessToken;
  }

  isExpired(): boolean {
    if (!this.tokens.expiresAt) {
      return false;
    }
    const expired = Date.now() >= this.tokens.expiresAt;
    if (expired) {
      this.events?.onTokenExpired?.();
    }
    return expired;
  }

  isValid(): boolean {
    return this.hasToken() && !this.isExpired();
  }

  hasToken(): boolean {
    return !!(this.tokens.accessToken || this.tokens.authToken);
  }

  hasAuthToken(): boolean {
    return !!this.tokens.authToken;
  }

  hasAccessToken(): boolean {
    return !!this.tokens.accessToken;
  }

  willExpireIn(seconds: number): boolean {
    if (!this.tokens.expiresAt) {
      return false;
    }
    return Date.now() + seconds * 1000 >= this.tokens.expiresAt;
  }
}

export function createTokenManager(tokens?: AuthTokens, events?: TokenManagerEvents): AuthTokenManager {
  return new DefaultAuthTokenManager(tokens, events);
}

export function buildAuthHeaders(
  authMode: AuthMode,
  apiKey?: string,
  tokenManager?: AuthTokenManager
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (authMode === 'apikey') {
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  } else if (authMode === 'dual-token') {
    if (tokenManager) {
      const accessToken = tokenManager.getAccessToken();
      const authToken = tokenManager.getAuthToken();

      if (accessToken) {
        headers['Access-Token'] = accessToken;
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    }
  }

  return headers;
}

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
}

export interface OAuthTokens extends AuthTokens {
  tokenType: string;
  scope?: string;
}

export function isTokenValid(manager: AuthTokenManager | undefined): boolean {
  return manager?.isValid() ?? false;
}

export function requiresRefresh(manager: AuthTokenManager | undefined, thresholdSeconds: number = 300): boolean {
  if (!manager) return false;
  return manager.willExpireIn(thresholdSeconds);
}
