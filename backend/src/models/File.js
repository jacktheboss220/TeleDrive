const { Schema, model } = require('mongoose');

const fileSchema = new Schema({
  messageId: { type: Number, required: true, unique: true },
  fileId: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true, index: true },
  thumbnailPath: { type: String, default: null },
  folder: { type: String, default: 'root', index: true },
  tags: { type: [String], default: [] },
  uploadedAt: { type: Date, default: Date.now, index: true },
});

module.exports = model('File', fileSchema);
