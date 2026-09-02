const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/queryController');

const router = Router();

router.get('/tags', auth, ctrl.listTags);

module.exports = router;
