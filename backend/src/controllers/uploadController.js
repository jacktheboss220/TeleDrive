const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');
const { getClient } = require('../telegram/client');
const { getChannel } = require('../telegram/channel');
const { withRetry } = require('../telegram/retry');
const uploadJobs = require('../telegram/uploadJobs');
const File = require('../models/File');
const { THUMB_DIR } = require('../config/paths');

const execFileAsync = promisify(execFile);

// Telegram never gets a chance to generate its own video thumb here (we
// upload with forceDocument to preserve the original file), so we grab a
// frame ourselves from the local temp file before it's deleted.
async function generateVideoThumb(inputPath, outPath) {
  const framePath = `${outPath}.frame.jpg`;
  try {
    await execFileAsync(ffmpegPath, ['-y', '-ss', '00:00:01', '-i', inputPath, '-frames:v', '1', framePath]);
    await sharp(framePath).resize(256, 256, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(outPath);
  } finally {
    await fsp.unlink(framePath).catch(() => {});
  }
}

async function uploadFile(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { path: tmpPath, originalname, size, mimetype } = req.file;
  const { folder = 'root', tags = '' } = req.body;

  const jobId = crypto.randomUUID();
  uploadJobs.createJob(jobId);
  res.status(202).json({ uploadId: jobId });

  // The multipart leg (browser -> us) is usually fast; the real bottleneck
  // is us -> Telegram, which can take a while for large files. Report that
  // via the job map so /upload/:id/progress can stream it back.
  (async () => {
    try {
      const client = await getClient();
      const channel = await getChannel(client);

      const message = await withRetry(() =>
        client.sendFile(channel, {
          file: tmpPath,
          caption: originalname,
          forceDocument: true,
          workers: 4,
          progressCallback: (progress) => uploadJobs.updateProgress(jobId, progress),
        })
      );

      const doc = await File.create({
        messageId: message.id,
        fileId: message.media?.document?.id?.toString() ?? String(message.id),
        filename: originalname,
        size,
        mimetype,
        folder,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });

      if (mimetype.startsWith('video/')) {
        try {
          const outPath = path.join(THUMB_DIR, `${doc._id}.jpg`);
          await generateVideoThumb(tmpPath, outPath);
          doc.thumbnailPath = outPath;
          await doc.save();
        } catch (err) {
          console.error('Video thumbnail generation failed:', err.message);
        }
      }

      uploadJobs.completeJob(jobId, doc);
    } catch (err) {
      uploadJobs.failJob(jobId, err.message || 'Upload failed');
    } finally {
      await fsp.unlink(tmpPath).catch(() => {});
    }
  })();
}

async function uploadProgress(req, res) {
  const { id } = req.params;
  if (!uploadJobs.getJob(id)) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const interval = setInterval(() => {
    const job = uploadJobs.getJob(id);
    if (!job) {
      clearInterval(interval);
      return res.end();
    }
    if (job.phase === 'uploading') {
      send({ phase: 'uploading', progress: job.progress });
      return;
    }
    if (job.phase === 'done') send({ phase: 'done', file: job.result });
    else send({ phase: 'error', error: job.error });
    clearInterval(interval);
    uploadJobs.deleteJob(id);
    res.end();
  }, 300);

  req.on('close', () => clearInterval(interval));
}

module.exports = { uploadFile, uploadProgress };
