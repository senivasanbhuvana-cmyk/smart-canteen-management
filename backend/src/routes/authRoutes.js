const express = require('express');
const { getDb } = require('../db');
const { hashPassword, verifyPassword, createToken, tokenRequired } = require('../auth');

const router = express.Router();
const EMAIL_REGEX = /^[\w.-]+@[\w.-]+\.\w+$/;

// POST /api/auth/register
router.post('/register', (req, res) => {
  const data = req.body || {};
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();
  const studentId = (data.student_id || '').trim().toUpperCase();
  const password = (data.password || '').trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const db = getDb();
  const existingUser = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
    .get(email);

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const existingStudent = db
    .prepare('SELECT id FROM users WHERE UPPER(student_id) = ?')
    .get(studentId);

  if (existingStudent) {
    return res.status(409).json({ error: 'An account with this Student ID already exists' });
  }

  const pwHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (name, email, student_id, password_hash, role)
    VALUES (?, ?, ?, ?, 'student')
  `).run(name, email, studentId, pwHash);

  const userId = result.lastInsertRowid;
  const token = createToken(userId, 'student', email);

  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: userId,
      name,
      email,
      student_id: studentId,
      role: 'student',
    },
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const data = req.body || {};
  const email = (data.email || '').trim().toLowerCase();
  const password = (data.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, name, email, student_id, password_hash, role FROM users WHERE LOWER(email) = LOWER(?)')
    .get(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createToken(user.id, user.role, user.email);

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      student_id: user.student_id,
      role: user.role,
    },
  });
});

// GET /api/auth/me
router.get('/me', tokenRequired, (req, res) => {
  return res.status(200).json({
    user: req.currentUser,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Successfully logged out' });
});

module.exports = router;
