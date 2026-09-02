const { Router } = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const env = require('../config/env');

const router = Router();

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ponytail: in-memory per-IP lockout, single process only, resets on
// restart. Fine for a single-user app behind one Node process; move to a
// shared store (Redis) if this ever runs clustered.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

function isLocked(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() > rec.resetAt) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const rec = attempts.get(ip);
  if (rec && Date.now() <= rec.resetAt) rec.count++;
  else attempts.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
}

router.post('/login', (req, res) => {
  const ip = req.ip;
  if (isLocked(ip)) {
    const retryAfter = Math.ceil((attempts.get(ip).resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: 'Too many attempts, try again later' });
  }

  const { username, password } = req.body || {};
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !safeEqual(username, env.AUTH_USERNAME) ||
    !safeEqual(password, env.AUTH_PASSWORD)
  ) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  attempts.delete(ip);
  const token = jwt.sign({ sub: username }, env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

module.exports = router;
