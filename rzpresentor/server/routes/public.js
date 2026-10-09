import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /api/public/presentations — list all public presentations
router.get('/presentations', (req, res) => {
  const presentations = db.prepare(
    'SELECT id, title, slug, updated_at FROM presentations WHERE public = 1 AND slug IS NOT NULL ORDER BY title ASC'
  ).all();
  res.json(presentations);
});

// GET /api/public/presentations/:slug — get single public presentation by slug
router.get('/presentations/:slug', (req, res) => {
  const presentation = db.prepare(
    'SELECT id, title, slug, content, updated_at FROM presentations WHERE slug = ? AND public = 1'
  ).get(req.params.slug);
  if (!presentation) return res.status(404).json({ error: 'Presentation not found' });
  res.json(presentation);
});

export default router;
