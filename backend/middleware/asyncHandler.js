/**
 * Wraps asynchronous express route handlers to catch any errors and pass them
 * to Express next() error handler, eliminating redundant try/catch blocks across routes (DRY).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
