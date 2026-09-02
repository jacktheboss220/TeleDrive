const { Router } = require('express');
const auth = require('../middleware/auth');
const query = require('../controllers/queryController');
const media = require('../controllers/mediaController');
const mutation = require('../controllers/mutationController');

const router = Router();

router.get('/files', auth, query.listFiles);
router.post('/files/batch-delete', auth, mutation.batchDelete);
router.post('/files/batch-move', auth, mutation.batchMove);
router.get('/files/:id/download', auth, media.downloadFile);
router.get('/files/:id/thumbnail', auth, media.thumbnail);
router.patch('/files/:id', auth, mutation.updateFile);
router.delete('/files/:id', auth, mutation.deleteFile);

module.exports = router;
