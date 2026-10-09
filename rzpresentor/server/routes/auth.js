import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { validateEmail, validateUsername, validatePassword } from '../utils/validation.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    // Check registration setting
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('allow_registration');
    const allowRegistration = setting ? setting.value === 'true' : true;

    // Check if there are any users (first user bypasses registration setting)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const isFirstUser = userCount.count === 0;

    if (!isFirstUser && !allowRegistration) {
      return res.status(403).json({ error: 'Registration is currently disabled' });
    }

    const { email, username, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Invalid username (3-30 chars, alphanumeric, _ or -)' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check for existing email or username
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const isAdmin = isFirstUser ? 1 : 0;

    db.prepare(
      'INSERT INTO users (id, email, username, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email.trim().toLowerCase(), username.trim(), passwordHash, isAdmin);

    req.session.userId = id;
    req.session.isAdmin = isAdmin === 1;

    return res.status(201).json({
      id,
      email: email.trim().toLowerCase(),
      username: username.trim(),
      isAdmin: isAdmin === 1,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || typeof login !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const identifier = login.trim().toLowerCase();

    // Try to find by email or username
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ? OR username = ?'
    ).get(identifier, login.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_locked) {
      return res.status(403).json({ error: 'Account is locked' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin === 1;

    return res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin === 1,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare(
    'SELECT id, email, username, is_admin, is_locked, created_at FROM users WHERE id = ?'
  ).get(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }

  return res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.is_admin === 1,
    isLocked: user.is_locked === 1,
    createdAt: user.created_at,
  });
});

export default router;
