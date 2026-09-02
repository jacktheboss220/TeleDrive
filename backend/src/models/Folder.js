const { Schema, model } = require('mongoose');

// Explicit record so a folder created with no files yet still persists and
// shows up in the sidebar (File.folder alone can't represent an empty one).
const folderSchema = new Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model('Folder', folderSchema);
