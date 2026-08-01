import assert from 'node:assert/strict';

import { createBaseHttpClient } from '../dist/index.js';

const encoder = new TextEncoder();

function createChunkedResponse(chunks, contentType) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { 'content-type': contentType },
    },
  );
}

const sse = [
  '\ufeff: keepalive',
  'event: delta',
  'id: 42',
  'data: {"text":',
  'data: "你"}',
  '',
  'event: sentinel',
  'data: [DONE]',
  '',
  'retry: 1000',
  'event: completion',
  'data: {"done":true}',
].join('\r\n');
const sseBytes = encoder.encode(sse);
const firstCrByte = encoder.encode(sse.slice(0, sse.indexOf('\r') + 1)).length;
const chineseByte = encoder.encode(sse.slice(0, sse.indexOf('你'))).length;
const sseChunks = [
  sseBytes.slice(0, firstCrByte),
  sseBytes.slice(firstCrByte, chineseByte + 1),
  sseBytes.slice(chineseByte + 1),
];

const requests = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  requests.push({ input: String(input), init });
  if (requests.length === 1) {
    return createChunkedResponse(sseChunks, 'text/event-stream; charset=utf-8');
  }

  return createChunkedResponse(
    [encoder.encode(' alpha\r'), encoder.encode('\ndata: beta\nevent: raw')],
    'text/plain; charset=utf-8',
  );
};

try {
  const client = createBaseHttpClient({
    baseUrl: 'https://sdkwork.test',
    logger: { level: 'silent' },
  });

  const serializedBody = '{"message":"hello"}';
  const events = [];
  for await (const event of client.stream('/events', {
    method: 'POST',
    params: { mode: 'live' },
    body: serializedBody,
  })) {
    events.push(event);
  }

  assert.deepEqual(
    events,
    ['{"text":\n"你"}', '{"done":true}'],
    'SSE parsing must join data fields while ignoring comments, metadata, and the done sentinel',
  );
  assert.deepEqual(JSON.parse(events[0]), { text: '你' });
  assert.equal(requests[0].input, 'https://sdkwork.test/events?mode=live');
  assert.equal(
    requests[0].init.body,
    serializedBody,
    'stream requests must not JSON-stringify an already serialized body a second time',
  );

  const legacyLines = [];
  for await (const line of client.stream('/plain', {
    method: 'POST',
    body: false,
  })) {
    legacyLines.push(line);
  }

  assert.deepEqual(
    legacyLines,
    ['alpha', 'beta', 'event: raw'],
    'non-SSE line streams must retain the previous data-prefix compatibility behavior',
  );
  assert.equal(
    requests[1].init.body,
    'false',
    'stream requests must serialize falsy JSON bodies instead of dropping them',
  );
} finally {
  globalThis.fetch = originalFetch;
}
