import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitize, validateSlug } from '../utils/validation.js';

const router = express.Router();

// All presentation routes require authentication
router.use(requireAuth);

// GET /api/presentations
router.get('/', (req, res) => {
  try {
    const presentations = db.prepare(
      'SELECT id, title, slug, "public", created_at, updated_at FROM presentations WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(req.session.userId);

    return res.json(presentations);
  } catch (err) {
    console.error('Get presentations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/presentations
router.post('/', (req, res) => {
  try {
    const { title = 'Untitled', content = '' } = req.body;

    const id = uuidv4();
    const sanitizedTitle = sanitize(title) || 'Untitled';

    db.prepare(
      'INSERT INTO presentations (id, user_id, title, content) VALUES (?, ?, ?, ?)'
    ).run(id, req.session.userId, sanitizedTitle, content);

    const presentation = db.prepare(
      'SELECT id, user_id, title, content, slug, "public", created_at, updated_at FROM presentations WHERE id = ?'
    ).get(id);

    return res.status(201).json(presentation);
  } catch (err) {
    console.error('Create presentation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/presentations/:id
router.get('/:id', (req, res) => {
  try {
    const presentation = db.prepare(
      'SELECT id, user_id, title, content, slug, "public", created_at, updated_at FROM presentations WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.session.userId);

    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    return res.json(presentation);
  } catch (err) {
    console.error('Get presentation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/presentations/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare(
      'SELECT id FROM presentations WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.session.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const { title, content, slug, public: isPublic } = req.body;
    const updates = [];
    const params = [];

    if (slug !== undefined) {
      if (!validateSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
      const slugConflict = db.prepare('SELECT id FROM presentations WHERE slug = ? AND id != ?').get(slug, req.params.id);
      if (slugConflict) return res.status(409).json({ error: 'Slug already in use' });
    }

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(sanitize(title) || 'Untitled');
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (isPublic !== undefined) {
      updates.push('"public" = ?');
      params.push(isPublic ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id, req.session.userId);

    db.prepare(
      `UPDATE presentations SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...params);

    const presentation = db.prepare(
      'SELECT id, user_id, title, content, slug, "public", created_at, updated_at FROM presentations WHERE id = ?'
    ).get(req.params.id);

    return res.json(presentation);
  } catch (err) {
    console.error('Update presentation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/presentations/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM presentations WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.session.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    return res.json({ message: 'Presentation deleted' });
  } catch (err) {
    console.error('Delete presentation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
