// Global Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || [
      {
        type: err.name || 'ServerError',
        message: message
      }
    ],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'n/a'
    }
  });
}

module.exports = errorHandler;
