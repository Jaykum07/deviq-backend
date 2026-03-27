const express = require('express');
const router = express.Router();

const {analyzeUser} = require('../controllers/github.controller');
const {protect} = require('../middleware/auth.middleware');

//All github routes require login
router.post('/analyze/:username', protect, analyzeUser);

module.exports = router;