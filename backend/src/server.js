const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const mongoose = require('mongoose');
const env = require('./config/env');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const fileRoutes = require('./routes/files');
const folderRoutes = require('./routes/folders');
const tagRoutes = require('./routes/tags');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.get('/health', (req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  res.status(mongoUp ? 200 : 503).json({ status: mongoUp ? 'ok' : 'degraded', mongo: mongoUp });
});

app.use('/auth', authRoutes);
app.use('/', uploadRoutes);
app.use('/', fileRoutes);
app.use('/', folderRoutes);
app.use('/', tagRoutes);

// Frontend build gets copied here at image-build time (see root Dockerfile).
// Absent in plain `npm start` dev mode, where Vite serves the frontend itself.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get(/^(?!\/(auth|files|folders|tags|upload|health)).*/, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

mongoose
  .connect(env.MONGO_URI)
  .then(() => app.listen(env.PORT, () => console.log(`TeleDrive listening on :${env.PORT}`)))
  .catch((err) => {
    console.error('Mongo connection failed', err);
    process.exit(1);
  });
