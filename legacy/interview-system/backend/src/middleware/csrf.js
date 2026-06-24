const crypto = require('crypto');

/**
 * CSRF Token Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

// Token storage (in production, use Redis)
const tokenStore = new Map();
const TOKEN_EXPIRY = 3600 * 1000; // 1 hour

/**
 * Generate a random CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate CSRF token for a session
 */
function createToken(sessionId) {
  const token = generateToken();
  const expiry = Date.now() + TOKEN_EXPIRY;

  tokenStore.set(`${sessionId}:${token}`, { expiry });

  // Clean up expired tokens
  cleanExpiredTokens();

  return token;
}

/**
 * Validate CSRF token
 */
function validateToken(sessionId, token) {
  if (!token) {
    return false;
  }

  const key = `${sessionId}:${token}`;
  const stored = tokenStore.get(key);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiry) {
    tokenStore.delete(key);
    return false;
  }

  return true;
}

/**
 * Clean up expired tokens
 */
function cleanExpiredTokens() {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now > value.expiry) {
      tokenStore.delete(key);
    }
  }
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS (these should not modify state)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that use JWT authentication
  // JWT tokens provide sufficient protection
  if (req.headers.authorization) {
    return next();
  }

  // Get session ID from cookie or session
  const sessionId = req.sessionID || req.ip || 'anonymous';

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body?.csrf_token || req.query?.csrf_token;

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF令牌缺失，请刷新页面重试'
    });
  }

  if (!validateToken(sessionId, token)) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token invalid',
      message: 'CSRF令牌无效或已过期，请刷新页面重试'
    });
  }

  next();
};

/**
 * CSRF token generation middleware
 * Adds a new CSRF token to the response
 */
const generateCsrfToken = (req, res, next) => {
  const sessionId = req.sessionID || req.ip || 'anonymous';
  const token = createToken(sessionId);

  res.locals.csrfToken = token;
  res.setHeader('X-CSRF-Token', token);

  next();
};

/**
 * Get CSRF token endpoint
 */
const getCsrfToken = (req, res) => {
  const sessionId = req.sessionID || req.ip || 'anonymous';
  const token = createToken(sessionId);

  res.json({
    success: true,
    data: { csrfToken: token }
  });
};

/**
 * Revoke all CSRF tokens for a session
 */
function revokeSessionTokens(sessionId) {
  const prefix = `${sessionId}:`;
  for (const key of tokenStore.keys()) {
    if (key.startsWith(prefix)) {
      tokenStore.delete(key);
    }
  }
}

module.exports = {
  csrfProtection,
  generateCsrfToken,
  getCsrfToken,
  validateToken,
  revokeSessionTokens
};
