const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header → "Bearer <token>"
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. No token provided.');
  }

  // Verify signature + expiry
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Attach user to request (available in all controllers after this)
  req.user = await User.findById(decoded.id).select('-password');

  if (!req.user) {
    res.status(401);
    throw new Error('User belonging to this token no longer exists');
  }

  next();
});

module.exports = { protect };