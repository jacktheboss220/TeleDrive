const DEFAULT_RETRIES = 5;

// Retries transient network errors with exponential backoff, and Telegram
// FLOOD_WAIT errors by sleeping exactly the seconds Telegram tells us to.
async function withRetry(fn, { retries = DEFAULT_RETRIES, baseDelayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const floodSeconds = floodWaitSeconds(err);
      const isFlood = floodSeconds != null;
      if (attempt >= retries || (!isFlood && !isTransient(err))) throw err;
      const delayMs = isFlood ? floodSeconds * 1000 : baseDelayMs * 2 ** attempt;
      await sleep(delayMs);
    }
  }
}

function floodWaitSeconds(err) {
  if (typeof err?.seconds === 'number') return err.seconds;
  const msg = String(err?.errorMessage || err?.message || '');
  const match = msg.match(/FLOOD_WAIT_(\d+)/);
  return match ? Number(match[1]) : null;
}

function isTransient(err) {
  const msg = String(err?.message || err?.errorMessage || '');
  return /TIMEOUT|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|Not connected|socket/i.test(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { withRetry };
