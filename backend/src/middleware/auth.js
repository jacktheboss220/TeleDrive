const jwt = require('jsonwebtoken');
const env = require('../config/env');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  // ponytail: <img>/<a> tags can't set headers, so image/download links pass
  // the token as ?token=. Fine for a personal single-user app; revisit
  // (signed short-lived links) if this ever gets shared with others.
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token || null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
