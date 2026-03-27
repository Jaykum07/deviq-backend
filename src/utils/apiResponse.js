// Every API response in this project uses these two functions
// Keeps response shape identical across all routes

const successResponse = (res, statusCode, message, data = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
  };
  
  const errorResponse = (res, statusCode, message, errors = null) => {
    const response = { success: false, message };
    if (errors !== null) response.errors = errors;
    return res.status(statusCode).json(response);
  };
  
  module.exports = { successResponse, errorResponse };