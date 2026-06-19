const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — validates JWT Bearer token from Authorization header.
 * On success, attaches `req.user` with the authenticated user document.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract Bearer token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Verify the JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password) to ensure user still exists
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    console.error('[authMiddleware] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = { protect };
