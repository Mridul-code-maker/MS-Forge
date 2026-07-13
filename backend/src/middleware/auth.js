const jwt = require('jsonwebtoken');

// Enforce JWT authentication and set active tenant context
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required. Please authenticate.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'mridul_sharma_ms_forge_secret_2026', (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired access token. Access denied.'
      });
    }

    // Set user context
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      tenantId: decoded.tenantId
    };

    // CRITICAL: Force all database actions to run under this tenant scope
    req.tenantId = decoded.tenantId;

    next();
  });
}

// Restrict routes to specified roles (e.g. Admin only)
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.'
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles
};
