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

test('legacy projection setters never become identity projection headers (API_SPEC §10.2)', () => {
  const tokenManager = createTokenManager({
    accessToken: 'AT-123',
    authToken: 'AU-456',
  });
  const client = new TestClient({ baseUrl: 'http://x', tokenManager });
  client.setTenantId('100001');
  client.setOrganizationId('org-1');
  client.setPlatform('web-admin');
  client.setUserId('u-1');

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
