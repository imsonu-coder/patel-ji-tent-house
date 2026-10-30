const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  if (!decoded || typeof decoded.id !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.id)) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = user;
  } catch (error) {
    return next(error);
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
