// Wraps every async controller so we never repeat try/catch
// Usage: const myController = asyncHandler(async (req, res) => { ... })
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;