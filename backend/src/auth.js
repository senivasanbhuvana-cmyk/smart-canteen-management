const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

const SECRET_KEY = process.env.SECRET_KEY || 'smartbite_secret_super_key_2026_dev';
const TOKEN_EXPIRY = '24h';

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hashedPassword) {
  if (!password || !hashedPassword) return false;
  return bcrypt.compareSync(password, hashedPassword);
}

function createToken(userId, role, email) {
  return jwt.sign(
    {
      user_id: userId,
      role: role,
      email: email,
    },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function decodeToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

function tokenRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1].trim();
  const payload = decodeToken(token);
  if (!payload || !payload.user_id) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, name, email, student_id, role FROM users WHERE id = ?')
    .get(payload.user_id);

  if (!user) {
    return res.status(401).json({ error: 'User account no longer exists' });
  }

  req.currentUser = user;
  next();
}

function adminRequired(req, res, next) {
  tokenRequired(req, res, () => {
    if (!req.currentUser || req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required for this action' });
    }
    next();
  });
}

module.exports = {
  SECRET_KEY,
  hashPassword,
  verifyPassword,
  createToken,
  decodeToken,
  tokenRequired,
  adminRequired,
};
