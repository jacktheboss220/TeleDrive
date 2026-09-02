const test = require('node:test');
const assert = require('node:assert');
const { withRetry } = require('../src/telegram/retry');

test('retries transient errors then succeeds', async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls++;
      if (calls < 3) throw new Error('ECONNRESET');
      return 'ok';
    },
    { retries: 5, baseDelayMs: 1 }
  );
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('respects FLOOD_WAIT seconds from error', async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls++;
      if (calls < 2) {
        const err = new Error('flood');
        err.seconds = 0; // keep test fast
        throw err;
      }
      return 'done';
    },
    { retries: 3 }
  );
  assert.equal(result, 'done');
  assert.equal(calls, 2);
});

test('gives up after max retries on non-transient error', async () => {
  await assert.rejects(
    withRetry(
      async () => {
        throw new Error('boom');
      },
      { retries: 2, baseDelayMs: 1 }
    )
  );
});
