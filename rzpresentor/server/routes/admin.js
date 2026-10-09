import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { validatePassword } from '../utils/validation.js';

const router = express.Router();

// All admin routes require admin access
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, email, username, is_admin, is_locked, created_at, updated_at FROM users ORDER BY created_at ASC'
    ).all();

    return res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      isAdmin: u.is_admin === 1,
      isLocked: u.is_locked === 1,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    })));
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare(
      "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(passwordHash, id);

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/lock
router.put('/users/:id/lock', (req, res) => {
  try {
    const { id } = req.params;
    const { locked } = req.body;

    const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_admin === 1) {
      return res.status(403).json({ error: 'Cannot lock an admin account' });
    }

    const isLocked = locked ? 1 : 0;
    db.prepare(
      "UPDATE users SET is_locked = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(isLocked, id);

    return res.json({ message: isLocked ? 'User locked' : 'User unlocked', isLocked: isLocked === 1 });
  } catch (err) {
    console.error('Admin lock user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const { key, value } of settings) {
      result[key] = value;
    }
    return res.json(result);
  } catch (err) {
    console.error('Admin get settings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  try {
    const { allowRegistration } = req.body;

    if (typeof allowRegistration !== 'boolean') {
      return res.status(400).json({ error: 'allowRegistration must be a boolean' });
    }

    db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    ).run('allow_registration', allowRegistration ? 'true' : 'false');

    return res.json({ allowRegistration });
  } catch (err) {
    console.error('Admin put settings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
