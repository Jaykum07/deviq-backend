const express = require('express');
const router  = express.Router();
const { createReport, getReports, getOneReport, deleteReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/',    createReport);    // POST   /api/reports
router.get ('/',    getReports);      // GET    /api/reports
router.get ('/:id', getOneReport);    // GET    /api/reports/:id
router.delete('/:id', deleteReport);  // DELETE /api/reports/:id

module.exports = router;