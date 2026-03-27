const errorHandler = (err, req, res, next) => {
    console.error(`${err.message}`);
  
    let statusCode = err.statusCode || 500;
    let message    = err.message    || 'Internal Server Error';
  
    // Mongoose bad ObjectId  → "507f1f77bcf86cd799439011abc" typo
    if (err.name === 'CastError') {
      statusCode = 400;
      message    = 'Invalid ID format';
    }
  
    // Mongoose duplicate unique field  → email already exists
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      statusCode  = 400;
      message     = `${field} already exists`;
    }
  
    // JWT expired
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message    = 'Session expired. Please login again';
    }
  
    // JWT invalid / tampered
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message    = 'Invalid token. Please login again';
    }
  
    res.status(statusCode).json({ success: false, message });
  };
  
  module.exports = errorHandler;