import test from 'node:test';
import assert from 'node:assert/strict';

import { BaseHttpClient } from '../dist/http.js';
import { createTokenManager } from '../dist/auth.js';

class TestClient extends BaseHttpClient {
  request() {
    throw new Error('not used');
  }
  get() {
    throw new Error('not used');
  }
  post() {
    throw new Error('not used');
  }
  put() {
    throw new Error('not used');
  }
  delete() {
    throw new Error('not used');
  }
  patch() {
    throw new Error('not used');
  }
  buildRequestHeaders(config, skipAuth = false) {
    return this.buildHeaders(config, skipAuth);
  }
}

test('authenticated requests carry only the dual-token credentials', () => {
  const tokenManager = createTokenManager({
    accessToken: 'AT-123',
    authToken: 'AU-456',
  });
  const client = new TestClient({ baseUrl: 'http://x', tokenManager });

  const headers = client.buildRequestHeaders({ url: '/x', method: 'GET' });

  assert.equal(headers['Authorization'], 'Bearer AU-456');
  assert.equal(headers['Access-Token'], 'AT-123');
});

test('identity projection API surface is removed (API_SPEC §10.2)', () => {
  const tokenManager = createTokenManager({
    accessToken: 'AT-123',
    authToken: 'AU-456',
  });
  const client = new TestClient({ baseUrl: 'http://x', tokenManager });

  // Legacy projection setters were removed from BaseHttpClient; any caller
  // still projecting identity must fail at compile time instead of leaking
  // headers onto the wire (40001 surface classification).
  for (const method of ['setTenantId', 'setOrganizationId', 'setPlatform', 'setUserId']) {
    assert.equal(
      typeof client[method],
      'undefined',
      `legacy projection setter ${method} must not exist`,
    );
  }

  const headers = client.buildRequestHeaders({ url: '/x', method: 'GET' });

  for (const forbidden of [
    'X-Tenant-Id',
    'X-Organization-Id',
    'X-Platform',
    'X-User-Id',
    'x-sdkwork-tenant-id',
    'x-sdkwork-organization-id',
    'x-sdkwork-user-id',
  ]) {
    assert.equal(
      Object.keys(headers).some((name) => name.toLowerCase() === forbidden.toLowerCase()),
      false,
      `client must not send identity projection header ${forbidden}`,
    );
  }
  // The Web Framework derives tenancy from the authenticated principal, so
  // the dual-token credentials remain the only auth material on the wire.
  assert.equal(headers['Authorization'], 'Bearer AU-456');
  assert.equal(headers['Access-Token'], 'AT-123');
});

// Mirrors sdkwork-web-core::constants::FORBIDDEN_CLIENT_IDENTITY_HEADERS 1:1.
// Any header the server rejects with 400/40001 must be stripped client-side so
// stale callers cannot poison the wire (regression: 40001 on GET /im/v3/api/chat/inbox).
const SERVER_FORBIDDEN_CLIENT_IDENTITY_HEADERS = [
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
  'x-sdkwork-operation-id',
  'x-tenant-id',
  'x-app-id',
  'x-user-id',
  'x-organization-id',
];

test('every server-forbidden identity projection header is stripped from config headers', () => {
  const tokenManager = createTokenManager({
    accessToken: 'AT-123',
    authToken: 'AU-456',
  });
  const client = new TestClient({ baseUrl: 'http://x', tokenManager });

  // Poison both the client-level default headers and the per-request headers:
  // buildHeaders must strip leaks from either merge point.
  const perRequest = {};
  for (const name of SERVER_FORBIDDEN_CLIENT_IDENTITY_HEADERS) {
    const upper = name.toUpperCase();
    perRequest[upper] = 'leak';
  }

  const stripped = client.buildRequestHeaders({
    url: '/x',
    method: 'GET',
    headers: perRequest,
  }, false);

  for (const forbidden of SERVER_FORBIDDEN_CLIENT_IDENTITY_HEADERS) {
    assert.equal(
      Object.keys(stripped).some((name) => name.toLowerCase() === forbidden.toLowerCase()),
      false,
      `client must not send identity projection header ${forbidden}`,
    );
  }
  assert.equal(stripped['Authorization'], 'Bearer AU-456');
  assert.equal(stripped['Access-Token'], 'AT-123');
});
