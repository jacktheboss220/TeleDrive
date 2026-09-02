const fsp = require('node:fs/promises');
const { getClient } = require('../telegram/client');
const { getChannel } = require('../telegram/channel');
const { withRetry } = require('../telegram/retry');
const File = require('../models/File');

async function updateFile(req, res) {
  const doc = await File.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const { filename, folder, tags } = req.body || {};
  const renamed = typeof filename === 'string' && filename.trim() && filename.trim() !== doc.filename;

  if (renamed) doc.filename = filename.trim();
  if (typeof folder === 'string' && folder.trim()) doc.folder = folder.trim();
  if (Array.isArray(tags)) doc.tags = tags;
  else if (typeof tags === 'string') doc.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

  if (renamed) {
    // Best-effort: updates the message caption shown in Telegram. The
    // document's own filename attribute is set at upload time and can't be
    // changed after the fact - that's an MTProto limitation, not fixable
    // here. Our own download endpoint always uses doc.filename regardless.
    try {
      const client = await getClient();
      const channel = await getChannel(client);
      await withRetry(() => client.editMessage(channel, { message: doc.messageId, text: doc.filename }));
    } catch (err) {
      console.error('Failed to update Telegram caption on rename:', err.message);
    }
  }

  await doc.save();
  res.json(doc);
}

async function deleteFile(req, res) {
  const doc = await File.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const client = await getClient();
  const channel = await getChannel(client);
  await withRetry(() => client.deleteMessages(channel, [doc.messageId], { revoke: true }));

  if (doc.thumbnailPath) await fsp.unlink(doc.thumbnailPath).catch(() => {});
  await doc.deleteOne();

  res.status(204).end();
}

async function batchDelete(req, res) {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) return res.status(400).json({ error: 'No ids given' });

  const docs = await File.find({ _id: { $in: ids } });
  if (docs.length === 0) return res.json({ deleted: 0 });

  const client = await getClient();
  const channel = await getChannel(client);
  // One Telegram call for the whole batch instead of one per file - cheaper
  // and far less likely to hit a flood-wait.
  await withRetry(() =>
    client.deleteMessages(
      channel,
      docs.map((d) => d.messageId),
      { revoke: true }
    )
  );

  await Promise.all(docs.map((d) => (d.thumbnailPath ? fsp.unlink(d.thumbnailPath).catch(() => {}) : null)));
  await File.deleteMany({ _id: { $in: docs.map((d) => d._id) } });

  res.json({ deleted: docs.length });
}

async function batchMove(req, res) {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const folder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : '';
  if (ids.length === 0 || !folder) return res.status(400).json({ error: 'ids and folder are required' });

  const result = await File.updateMany({ _id: { $in: ids } }, { folder });
  res.json({ moved: result.modifiedCount });
}

module.exports = { updateFile, deleteFile, batchDelete, batchMove };
