const { Router } = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/uploadController');

const router = Router();

router.post('/upload', auth, upload.single('file'), ctrl.uploadFile);
router.get('/upload/:id/progress', auth, ctrl.uploadProgress);

module.exports = router;
