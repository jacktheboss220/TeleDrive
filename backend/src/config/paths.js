const fs = require('node:fs');
const path = require('node:path');

const THUMB_DIR = path.join(__dirname, '..', '..', 'thumbnails');
fs.mkdirSync(THUMB_DIR, { recursive: true });

module.exports = { THUMB_DIR };
