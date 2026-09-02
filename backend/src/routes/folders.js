const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/queryController');

const router = Router();

router.get('/folders', auth, ctrl.listFolders);
router.post('/folders', auth, ctrl.createFolder);

module.exports = router;
