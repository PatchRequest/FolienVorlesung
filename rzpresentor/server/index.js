import express from 'express';
import session from 'express-session';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { runMigrations } from './db/migrations.js';
import { setupSecurity } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import presentationRoutes from './routes/presentations.js';
import uploadRoutes from './routes/uploads.js';
import publicRoutes from './routes/public.js';

const require = createRequire(import.meta.url);
const ConnectSQLite = require('connect-sqlite3');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Run database migrations
runMigrations();

// Security
setupSecurity(app);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Static /images/ serving
app.use('/images', express.static(config.imagesDir));

// Sessions
const SQLiteStore = ConnectSQLite(session);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.dirname(config.dbPath) }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
}));

// API routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.use('/fonts', express.static(path.join(__dirname, '..', 'public', 'fonts')));

// SPA fallback
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(config.port, config.host, () => {
  console.log(`RZPresenter running on http://${config.host}:${config.port}`);
});
