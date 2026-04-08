const express = require('express');
const router = express.Router();

const {register, login, getMe, logout, updateProfile, changePassword} = require('../controllers/auth.controller');
const {protect} = require('../middleware/auth.middleware');

router.post('/register', register); //public 
router.post('/login', login); //public
router.get('/me',protect, getMe); //protected
router.post('/logout', protect, logout); //protected
router.put('/update-profile', protect, updateProfile); //protected
router.put('/change-password', protect, changePassword); //protected


module.exports = router;