const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { getClient } = require('../telegram/client');
const { getChannel, getMessage } = require('../telegram/channel');
const { withRetry } = require('../telegram/retry');
const File = require('../models/File');
const { THUMB_DIR } = require('../config/paths');

async function downloadFile(req, res) {
  const doc = await File.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const client = await getClient();
  const channel = await getChannel(client);
  const message = await getMessage(client, channel, doc.messageId);
  if (!message?.media) return res.status(404).json({ error: 'Telegram message missing' });

  const disposition = req.query.inline ? 'inline' : 'attachment';
  res.setHeader('Content-Type', doc.mimetype);
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(doc.filename)}"`);
  res.setHeader('Content-Length', doc.size);

  // Adapts Express's res into the writable GramJS streams chunks into, so we
  // never buffer the whole file in memory.
  const writable = {
    write: (chunk) =>
      new Promise((resolve, reject) => res.write(chunk, (err) => (err ? reject(err) : resolve()))),
  };

  try {
    await withRetry(() => client.downloadMedia(message.media, { outputFile: writable }));
    res.end();
  } catch (err) {
    if (!res.headersSent) res.status(502).json({ error: 'Download failed' });
    else res.end();
  }
}

async function thumbnail(req, res) {
  const doc = await File.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  if (doc.thumbnailPath && fs.existsSync(doc.thumbnailPath)) {
    return res.sendFile(doc.thumbnailPath);
  }

  if (!doc.mimetype.startsWith('image/')) {
    return res.status(404).json({ error: 'No thumbnail for this type' });
  }

  const client = await getClient();
  const channel = await getChannel(client);
  const message = await getMessage(client, channel, doc.messageId);
  if (!message?.media) return res.status(404).json({ error: 'Telegram message missing' });

  // Telegram's thumbs array is ordered smallest -> largest; grab the largest
  // available instead of index 0, so sharp downscales instead of upscaling
  // a tiny (often ~90px) source into blur.
  const thumbs = message.media.document?.thumbs || [];
  const thumbOpt = thumbs.length > 0 ? { thumb: thumbs.length - 1 } : {};

  const buffer = await withRetry(() => client.downloadMedia(message.media, thumbOpt));
  const outPath = path.join(THUMB_DIR, `${doc._id}.jpg`);
  await sharp(buffer)
    .resize(256, 256, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(outPath);

  doc.thumbnailPath = outPath;
  await doc.save();

  res.sendFile(outPath);
}

module.exports = { downloadFile, thumbnail };
