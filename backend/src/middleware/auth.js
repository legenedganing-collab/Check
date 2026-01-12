const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and extract user info
 * This protects routes that require authentication
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authMiddleware };
