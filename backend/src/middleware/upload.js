const multer = require('multer');
const os = require('node:os');

// Disk storage: GramJS uploads large files by path in chunks, so we never
// need to hold the whole thing in process memory.
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `teledrive-${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB, MTProto's practical ceiling
});

module.exports = upload;
