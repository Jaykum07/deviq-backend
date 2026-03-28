const express = require('express');
const router  = express.Router();
const { getHistory, deleteOneHistory, clearAllHistory } = require('../controllers/history.controller');
const { protect } = require('../middleware/auth.middleware');

// All history routes require login
router.use(protect);   // applies protect to ALL routes below — cleaner than repeating

router.get   ('/',    getHistory);        // GET    /api/history
router.delete('/:id', deleteOneHistory);  // DELETE /api/history/:id
router.delete('/',    clearAllHistory);   // DELETE /api/history

module.exports = router;