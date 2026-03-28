const express = require('express');
const router  = express.Router();
const { compareUsers } = require('../controllers/compare.controller');
const { protect }      = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', compareUsers);   // POST /api/compare

module.exports = router;