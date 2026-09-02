const File = require('../models/File');
const Folder = require('../models/Folder');

async function listFiles(req, res) {
  const { page = 1, limit = 20, folder, mime, tag, from, to, q } = req.query;
  const query = {};
  if (folder) query.folder = folder;
  if (mime) query.mimetype = new RegExp(`^${mime}`, 'i');
  if (tag) query.tags = tag;
  if (q) query.filename = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (from || to) {
    query.uploadedAt = {};
    if (from) query.uploadedAt.$gte = new Date(from);
    if (to) query.uploadedAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total, sizeAgg] = await Promise.all([
    File.find(query)
      .sort({ uploadedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    File.countDocuments(query),
    File.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$size' } } }]),
  ]);

  res.json({
    items,
    total,
    totalSize: sizeAgg[0]?.total ?? 0,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  });
}

async function listFolders(req, res) {
  const [fileFolders, explicitFolders] = await Promise.all([
    File.aggregate([{ $group: { _id: '$folder', count: { $sum: 1 } } }]),
    Folder.find(),
  ]);

  const counts = new Map(fileFolders.map((f) => [f._id, f.count]));
  for (const f of explicitFolders) {
    if (!counts.has(f.name)) counts.set(f.name, 0);
  }

  const result = [...counts.entries()]
    .map(([folder, count]) => ({ folder, count }))
    .sort((a, b) => a.folder.localeCompare(b.folder));

  res.json(result);
}

async function createFolder(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Folder name required' });

  await Folder.updateOne({ name }, { name }, { upsert: true });
  res.status(201).json({ folder: name });
}

async function listTags(req, res) {
  const tags = await File.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(tags.map((t) => ({ tag: t._id, count: t.count })));
}

module.exports = { listFiles, listFolders, createFolder, listTags };
