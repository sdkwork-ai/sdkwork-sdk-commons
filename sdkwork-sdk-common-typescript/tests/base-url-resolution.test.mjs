import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  resolveBaseUrl,
  readRuntimeEnv,
  splitBaseUrls,
  getEnvironmentLabel,
  getBrand,
  getApiHostForEnvironment,
  resolveApiHost,
  resolveApiPort,
  resolveDeploymentMode,
  CLOUD_GATEWAY_DEV_PORT,
} from '../dist/index.js';

test('getEnvironmentLabel maps -dev / -test / -staging suffixes', () => {
  assert.equal(getEnvironmentLabel('im-dev.sdkwork.com'), 'dev');
  assert.equal(getEnvironmentLabel('api-test.birdcoder.cn'), 'test');
  assert.equal(getEnvironmentLabel('server-staging.sdkwork.com'), 'staging');
  assert.equal(getEnvironmentLabel('api.sdkwork.com'), 'production');
  assert.equal(getEnvironmentLabel('server.sdkwork.com'), 'production');
  assert.equal(getEnvironmentLabel('localhost'), 'development');
  assert.equal(getEnvironmentLabel('127.0.0.1'), 'development');
});

test('getBrand extracts eTLD+1', () => {
  assert.equal(getBrand('im-dev.sdkwork.com'), 'sdkwork.com');
  assert.equal(getBrand('api-dev.birdcoder.cn'), 'birdcoder.cn');
  assert.equal(getBrand('api.sdkwork.com'), 'sdkwork.com');
  assert.equal(getBrand('localhost'), 'localhost');
});

test('getApiHostForEnvironment builds the expected api host', () => {
  assert.equal(getApiHostForEnvironment('dev', 'sdkwork.com'), 'api-dev.sdkwork.com');
  assert.equal(getApiHostForEnvironment('test', 'birdcoder.cn'), 'api-test.birdcoder.cn');
  assert.equal(getApiHostForEnvironment('staging', 'sdkwork.com'), 'api-staging.sdkwork.com');
  assert.equal(getApiHostForEnvironment('production', 'sdkwork.com'), 'api.sdkwork.com');
});

test('splitBaseUrls handles comma and semicolon separators', () => {
  assert.deepEqual(splitBaseUrls('http://a,http://b;http://c'), [
    'http://a',
    'http://b',
    'http://c',
  ]);
  assert.deepEqual(splitBaseUrls(' http://a ; http://b ,'), ['http://a', 'http://b']);
  assert.deepEqual(splitBaseUrls(''), []);
  assert.deepEqual(splitBaseUrls(['http://a', 'http://b']), ['http://a', 'http://b']);
});

test('resolveBaseUrl prefers same env + brand + same protocol', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com,http://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl picks the http candidate when the page is http', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com,http://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'http',
  });
  assert.equal(result.url, 'http://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl matches env+brand regardless of order in the list', () => {
  // The matching api-dev host appears after an unrelated host.
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.birdcoder.cn;https://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl derives the api host when no candidate matches', () => {
  // No candidate has the api-dev.sdkwork.com host for the current im-dev page,
  // so the base URL is derived from the current host instead of silently using
  // an unrelated candidate.
  const result = resolveBaseUrl({
    baseUrls: 'https://api-test.sdkwork.com,http://api-staging.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'derived-from-host');
});

test('resolveBaseUrl returns empty when no candidates', () => {
  const result = resolveBaseUrl({ baseUrls: '' });
  assert.equal(result.url, '');
  assert.equal(result.reason, 'empty');
});

test('resolveBaseUrl reads candidates from a custom readEnv', () => {
  const env = { SDKWORK_API_BASE_URL: 'https://api-dev.sdkwork.com,http://api.sdkwork.com' };
  const result = resolveBaseUrl({
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
    readEnv: (key) => env[key],
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl honors a custom envKey', () => {
  const env = { CUSTOM_BASE_URL: 'http://api-dev.sdkwork.com;https://api-dev.sdkwork.com' };
  const result = resolveBaseUrl({
    envKey: 'CUSTOM_BASE_URL',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'http',
    readEnv: (key) => env[key],
  });
  assert.equal(result.url, 'http://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl matches production host without env suffix', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api.sdkwork.com,https://api-dev.sdkwork.com',
    hostname: 'im.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl preserves path when preservePath is set', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com/app/v3/api,http://api-dev.sdkwork.com/app/v3/api',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
    preservePath: true,
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com/app/v3/api');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl drops the path by default (base origin)', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com/app/v3/api,http://api-dev.sdkwork.com/app/v3/api',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl derives the api host from the current host when no candidates', () => {
  const result = resolveBaseUrl({
    baseUrls: '',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'derived-from-host');
});

test('resolveBaseUrl derives the http api host for an http page with no candidates', () => {
  const result = resolveBaseUrl({
    baseUrls: '',
    hostname: 'im-test.sdkwork.com',
    protocol: 'http',
  });
  assert.equal(result.url, 'http://api-test.sdkwork.com');
  assert.equal(result.reason, 'derived-from-host');
});

test('resolveDeploymentMode defaults to cloud and reads env keys', () => {
  assert.equal(resolveDeploymentMode(), 'cloud');
  assert.equal(resolveDeploymentMode({ mode: 'standalone' }), 'standalone');
  assert.equal(resolveDeploymentMode({ mode: 'STANDALONE' }), 'standalone');
  assert.equal(resolveDeploymentMode({ mode: 'nonsense' }), 'cloud');
  const env = { SDKWORK_DEPLOYMENT_PROFILE: 'standalone' };
  assert.equal(resolveDeploymentMode({ readEnv: (key) => env[key] }), 'standalone');
  const viteEnv = { VITE_SDKWORK_DEPLOY_MODE: 'standalone' };
  assert.equal(resolveDeploymentMode({ readEnv: (key) => viteEnv[key] }), 'standalone');
});

test('cloud mode maps a module host onto the shared api gateway host', () => {
  assert.equal(
    resolveApiHost({ hostname: 'im.sdkwork.com', mode: 'cloud' }),
    'api.sdkwork.com',
  );
  assert.equal(
    resolveApiHost({ hostname: 'im-dev.sdkwork.com', mode: 'cloud' }),
    'api-dev.sdkwork.com',
  );
  assert.equal(
    resolveApiHost({ hostname: 'im-test.sdkwork.com', mode: 'cloud' }),
    'api-test.sdkwork.com',
  );
  assert.equal(
    resolveApiHost({ hostname: 'im-staging.sdkwork.com', mode: 'cloud' }),
    'api-staging.sdkwork.com',
  );
});

test('standalone mode keeps the module host itself as the api host', () => {
  assert.equal(
    resolveApiHost({ hostname: 'im.sdkwork.com', mode: 'standalone' }),
    'im.sdkwork.com',
  );
  assert.equal(
    resolveApiHost({ hostname: 'im-dev.sdkwork.com', mode: 'standalone' }),
    'im-dev.sdkwork.com',
  );
});

test('pnpm dev resolves to the same origin in standalone and to the gateway port in cloud', () => {
  // Standalone dev: the page dev server also serves the API (same IP + port).
  assert.equal(
    resolveApiPort({ hostname: 'localhost', mode: 'standalone', currentPort: '5173' }),
    '5173',
  );
  assert.equal(
    resolveApiHost({ hostname: 'localhost', mode: 'standalone' }),
    'localhost',
  );
  // Cloud dev: the API is served by sdkwork-api-cloud-gateway on its own port.
  assert.equal(
    resolveApiPort({ hostname: 'localhost', mode: 'cloud', currentPort: '5173' }),
    CLOUD_GATEWAY_DEV_PORT,
  );
  assert.equal(resolveApiPort({ hostname: 'localhost', mode: 'cloud' }), CLOUD_GATEWAY_DEV_PORT);
});

test('resolveBaseUrl returns the same-origin dev server for standalone pnpm dev', () => {
  const result = resolveBaseUrl({
    mode: 'standalone',
    hostname: 'localhost',
    protocol: 'http',
    port: '5173',
  });
  assert.equal(result.url, 'http://localhost:5173');
  assert.equal(result.environment, 'development');
  assert.equal(result.mode, 'standalone');
});

test('resolveBaseUrl returns the same-origin IP for standalone pnpm dev over LAN', () => {
  const result = resolveBaseUrl({
    mode: 'standalone',
    hostname: '192.168.1.20',
    protocol: 'http',
    port: '3000',
  });
  assert.equal(result.url, 'http://192.168.1.20:3000');
});

test('resolveBaseUrl returns the cloud gateway dev port for cloud pnpm dev', () => {
  const result = resolveBaseUrl({
    mode: 'cloud',
    hostname: 'localhost',
    protocol: 'http',
    port: '5173',
  });
  assert.equal(result.url, `http://localhost:${CLOUD_GATEWAY_DEV_PORT}`);
  assert.equal(result.reason, 'derived-from-host');
});

test('resolveBaseUrl honours SDKWORK_API_DEV_PORT for cloud pnpm dev', () => {
  const env = { SDKWORK_API_DEV_PORT: '4910' };
  const result = resolveBaseUrl({
    mode: 'cloud',
    hostname: 'localhost',
    protocol: 'http',
    port: '5173',
    readEnv: (key) => env[key],
  });
  assert.equal(result.url, 'http://localhost:4910');
});

test('resolveBaseUrl prefers a configured gateway candidate on a cloud dev page', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com,http://localhost:3910',
    mode: 'cloud',
    hostname: 'localhost',
    protocol: 'http',
    port: '5173',
  });
  assert.equal(result.url, 'http://localhost:3910');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl prefers an explicit local candidate on a standalone dev page', () => {
  const result = resolveBaseUrl({
    baseUrls: 'http://127.0.0.1:8080,https://api-dev.sdkwork.com',
    mode: 'standalone',
    hostname: 'localhost',
    protocol: 'http',
    port: '5173',
  });
  assert.equal(result.url, 'http://127.0.0.1:8080');
  assert.equal(result.reason, 'development-local-candidate');
});

test('resolveBaseUrl reads the deployment mode from the runtime env', () => {
  const env = { SDKWORK_DEPLOY_MODE: 'standalone' };
  const result = resolveBaseUrl({
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
    readEnv: (key) => env[key],
  });
  assert.equal(result.url, 'https://im-dev.sdkwork.com');
  assert.equal(result.mode, 'standalone');
});

test('resolveBaseUrl keeps standalone hosts for every environment', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://im-dev.sdkwork.com,https://api-dev.sdkwork.com',
    mode: 'standalone',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://im-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('readRuntimeEnv reads from a Node-like process.env', () => {
  // Simulate a process.env object on globalThis for the lookup.
  const originalProcess = (globalThis).process;
  (globalThis).process = { env: { SDKWORK_API_BASE_URL: 'http://api-dev.sdkwork.com' } };
  try {
    assert.equal(readRuntimeEnv('SDKWORK_API_BASE_URL'), 'http://api-dev.sdkwork.com');
  } finally {
    if (originalProcess === undefined) {
      delete (globalThis).process;
    } else {
      (globalThis).process = originalProcess;
    }
  }
});

test('readRuntimeEnv returns undefined when key is absent', () => {
  assert.equal(readRuntimeEnv('SDKWORK_DOES_NOT_EXIST_XYZ'), undefined);
});

test('resolveBaseUrl aligns a cross-protocol candidate to the http page scheme', () => {
  // A page served over http:// must target the http:// API origin: the cloud
  // edge terminates both schemes on the same gateway host, and a TLS-less dev
  // edge would close https:// connections (ERR_CONNECTION_CLOSED).
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'http',
  });
  assert.equal(result.url, 'http://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl aligns a cross-protocol candidate to the https page scheme', () => {
  const result = resolveBaseUrl({
    baseUrls: 'http://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl keeps the path while aligning the protocol', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com/app/v3/api',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'http',
    preservePath: true,
  });
  assert.equal(result.url, 'http://api-dev.sdkwork.com/app/v3/api');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl prefers the same-protocol candidate before aligning', () => {
  const result = resolveBaseUrl({
    baseUrls: 'http://api-dev.sdkwork.com,https://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});

test('resolveBaseUrl leaves non-http(s) candidates unchanged', () => {
  // A ws:// candidate that matches the target host wins pass 2 (host+port,
  // any protocol) and is returned as-is: protocol alignment only rewrites
  // http<->https candidates.
  const result = resolveBaseUrl({
    baseUrls: 'ws://api-dev.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'ws://api-dev.sdkwork.com');
  assert.equal(result.reason, 'current-host-match');
});
