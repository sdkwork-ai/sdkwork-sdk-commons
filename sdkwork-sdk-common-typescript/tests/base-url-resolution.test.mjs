import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  resolveBaseUrl,
  readRuntimeEnv,
  splitBaseUrls,
  getEnvironmentLabel,
  getBrand,
  getApiHostForEnvironment,
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

test('resolveBaseUrl falls back to the first candidate when nothing matches', () => {
  const result = resolveBaseUrl({
    baseUrls: 'https://api-dev.sdkwork.com,http://api-staging.sdkwork.com',
    hostname: 'im-dev.sdkwork.com',
    protocol: 'https',
  });
  assert.equal(result.url, 'https://api-dev.sdkwork.com');
  assert.equal(result.reason, 'fallback-first');
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
