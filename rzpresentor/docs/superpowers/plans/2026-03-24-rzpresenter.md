# RZPresenter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight, Hedgedoc-inspired presentation tool where slides are authored in markdown, with rich formatting (colors, gradients, animations, LaTeX), a three-mode editor, presenter view with annotation tools, user authentication with admin controls, and Hochschule Fulda corporate design -- all deployable via Docker Compose.

**Architecture:** Single Docker container running a Node.js/Express backend serving a React (Vite) SPA. The backend provides REST API endpoints for auth, admin, and presentation CRUD, backed by SQLite. The frontend uses CodeMirror 6 as the markdown editor and markdown-it with custom plugins for slide parsing/rendering. Presentation mode renders slides with CSS animations and canvas-based annotation tools. The SQLite database and user uploads live in a `data/` directory outside the webserver public scope, mounted as a Docker volume.

**Tech Stack:**
- **Backend:** Node.js, Express, better-sqlite3, bcryptjs, express-session, uuid, helmet, express-rate-limit
- **Frontend:** React 18, Vite, CodeMirror 6 (@codemirror/view, @codemirror/lang-markdown), React Router v6
- **Markdown:** markdown-it + custom plugins (color, gradient, animation, fragment, slide-break, embed), KaTeX for LaTeX
- **Fonts:** Nunito Sans (from cdhandbuch/02-Schrift/)
- **Deploy:** Docker, Docker Compose

---

## Corporate Design Reference (Hochschule Fulda)

Extracted from `cdhandbuch/Corporate-Design-2024-Manual-v1.2.pdf` (57 pages):

### Official Colors

| Token | Value | CD Usage Rules |
|-------|-------|----------------|
| `--color-black` | `#000000` | **Text color ONLY**. All text must be black on white. No colored text allowed in CD. |
| `--color-white` | `#FFFFFF` | Backgrounds, white space |
| `--color-primary` (Green) | `#72BF44` | Accent color only (links, highlights, logo). **NOT for backgrounds or text.** PANTONE 368 C, RAL 6018. No transparency/gradients. |
| `--color-gray` | `#F4F1F2` | Light gray for info boxes, table cell backgrounds. Rare use only. |
| `--color-blue` | `#6EB2F7` | Charts, tables, underlines **only**. Not for backgrounds or text. |
| `--color-orange` | `#FFA64B` | Charts, tables, underlines **only**. Not for backgrounds or text. |
| `--color-pink` | `#FF7AD7` | Charts, tables, underlines **only**. Not for backgrounds or text. |

**CD Rule**: Blue, Pink, Orange colors must never touch each other -- always separated by white space.

### Font System

| Element | Font | Weight | Style |
|---------|------|--------|-------|
| H1, H2 | Nunito Sans Extra Bold + Light | 800 + 300 | UPPERCASE, letter-spacing: 100 (2pt in Office) |
| H3, H4 | Nunito Sans Extra Bold + Light | 800 + 300 | UPPERCASE, letter-spacing: 100 |
| H5, H6 | Nunito Sans Regular | 400 | Normal case |
| Body | Nunito Sans Regular | 400 | Normal case |
| Captions | Nunito Sans Regular | 400 | Normal case |
| Fallback | Arial | - | For environments without Nunito Sans |

**Typography scale**: Base 12pt, Fibonacci factor 1.618 (12 -> 19.4 -> 31.4 -> 50.8pt)

### Icons
- Source: **Lucide** icon library (open source, ISC license)
- Style: Black on white only, stroke 2px, size 24px
- No icon color changes allowed

### Bullet Points
- Use single opening guillemet `»` character (from Nunito Sans glyphs)

### Hyperlinks
- Underlined text in GREEN (`#72BF44`), 3pt distance between text and underline

### Logo Usage in Presentations
- Beech leaf icon may be used alone in presentations **IF** the full horizontal logo appears on at least one previous slide
- Logo comes in: horizontal (standard), round, icon-only variants

### Application to RZPresenter

The CD rules apply to the **application UI** (nav, buttons, forms, admin). For **user slide content**, the default "modern" theme follows CD guidelines, but users are free to use colors/gradients in their own presentations via the markdown extensions. The UI CSS variables:

| CSS Variable | Value | Notes |
|-------|-------|-------|
| `--color-primary` | `#72BF44` | Green accent (buttons, active states, links) |
| `--color-primary-dark` | `#5a9936` | Hover states (derived) |
| `--color-text` | `#000000` | All UI text (per CD: black only) |
| `--color-text-light` | `#666666` | Secondary/muted text |
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-bg-secondary` | `#F4F1F2` | Panel/card backgrounds (CD light gray) |
| `--color-border` | `#E0E0E0` | Borders |
| `--color-danger` | `#dc3545` | Error states (app-specific, not CD) |
| `--color-warning` | `#ffc107` | Warning states (app-specific, not CD) |

---

## Markdown Dialect Design

### Why markdown-it with custom plugins (not a new parser)

Standard markdown covers ~70% of needs (headings, bold, italic, lists, links, images, code blocks). The remaining features (colors, gradients, animations, fragments, page breaks, embeds) can each be implemented as isolated markdown-it plugins using its well-documented `ruler` and `renderer` APIs. Creating a fully custom parser would be months of work for marginal benefit.

### Custom syntax extensions

```
=== (page break - three equals on own line)

---settings---
style: modern
animation: fade
transition: slide
---/settings---

{color:red}colored text{/color}
{color:#ff6600}hex color{/color}
{gradient:green,blue}gradient text{/gradient}
{gradient:#72bf44,#1a1a1a}gradient text{/gradient}
{anim:fadeIn}animated element{/anim}
{anim:typewriter}typed text{/anim}
{anim:bounceIn}bouncing text{/anim}
{fragment:1}appears on first click{/fragment}
{fragment:2}appears on second click{/fragment}

![image](url)
@[youtube](VIDEO_ID)
$$LaTeX block$$
$inline LaTeX$
```

### Available animations
| Name | Effect |
|------|--------|
| `fadeIn` | Opacity 0 -> 1 |
| `fadeInUp` | Slide up + fade |
| `fadeInDown` | Slide down + fade |
| `fadeInLeft` | Slide from left + fade |
| `fadeInRight` | Slide from right + fade |
| `bounceIn` | Scale bounce entrance |
| `typewriter` | Letter-by-letter reveal |
| `zoomIn` | Scale 0 -> 1 |

### Slide settings (YAML front matter)

```yaml
---settings---
style: modern|minimal|dark
animation: fade|slide|none
transition: slide|fade|zoom|none
footer: "Custom footer text"
pageNumbers: true|false
logo: true|false
---/settings---
```

---

## File Structure

```
rzpresenter/
├── docker-compose.yml              # Docker Compose config
├── Dockerfile                      # Multi-stage build (build React, serve with Node)
├── .env.example                    # Template for env vars
├── .gitignore
├── package.json                    # Root package.json (workspaces or single)
├── vite.config.js                  # Vite config (proxy API in dev)
├── cdhandbuch/                     # Corporate design assets (existing, not deployed)
├── data/                           # Runtime data (Docker volume, gitignored)
│   ├── rzpresenter.db              # SQLite database
│   └── uploads/                    # User-uploaded images
│
├── server/                         # Backend
│   ├── index.js                    # Express entry, static file serving
│   ├── config.js                   # Reads .env, exports config object
│   ├── db/
│   │   ├── connection.js           # better-sqlite3 singleton
│   │   └── migrations.js           # CREATE TABLE statements, runs on startup
│   ├── middleware/
│   │   ├── auth.js                 # requireAuth, requireAdmin middleware
│   │   └── security.js             # helmet, rate-limit, CSRF cookie setup
│   ├── routes/
│   │   ├── auth.js                 # POST /api/auth/register, /login, /logout, GET /me
│   │   ├── admin.js                # GET/PUT /api/admin/users, PUT /settings
│   │   ├── presentations.js        # CRUD /api/presentations
│   │   └── uploads.js              # POST /api/uploads (image upload)
│   └── utils/
│       └── validation.js           # sanitizeHtml, validateEmail, etc.
│
├── src/                            # React frontend
│   ├── main.jsx                    # React entry
│   ├── App.jsx                     # Router setup
│   ├── index.css                   # Global styles, CSS variables, font-face
│   │
│   ├── api/
│   │   └── client.js               # fetch wrapper with CSRF, auth error handling
│   │
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state, login/logout/register functions
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx       # List/create/delete presentations
│   │   ├── EditorPage.jsx          # Editor with three view modes
│   │   ├── PresentPage.jsx         # Fullscreen presentation
│   │   ├── PresenterPage.jsx       # Presenter control view
│   │   └── AdminPage.jsx           # Admin panel
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── MarkdownEditor.jsx  # CodeMirror 6 wrapper
│   │   │   ├── EditorToolbar.jsx   # Bold, italic, heading, color, anim buttons
│   │   │   ├── SettingsPanel.jsx   # GUI for slide settings (style, animation)
│   │   │   └── ViewToggle.jsx      # Editor/Preview/SideBySide switcher
│   │   ├── preview/
│   │   │   ├── SlidePreview.jsx    # Renders single slide HTML
│   │   │   └── SlideList.jsx       # Vertical slide strip (thumbnails)
│   │   ├── presenter/
│   │   │   ├── PresenterView.jsx   # Current slide + next slide + timer
│   │   │   ├── Timer.jsx           # Stopwatch with start/pause/reset
│   │   │   └── AnnotationCanvas.jsx # Canvas overlay for marker/laser/eraser
│   │   └── common/
│   │       ├── Layout.jsx          # App shell (nav, sidebar)
│   │       ├── ProtectedRoute.jsx  # Auth guard
│   │       └── Logo.jsx            # HS Fulda logo component
│   │
│   └── lib/
│       ├── markdown/
│       │   ├── parser.js           # markdown-it instance with all plugins
│       │   ├── pluginColor.js      # {color:X}...{/color} -> <span style="color:X">
│       │   ├── pluginGradient.js   # {gradient:a,b}...{/gradient} -> gradient span
│       │   ├── pluginAnimation.js  # {anim:X}...{/anim} -> <span class="anim-X">
│       │   ├── pluginFragment.js   # {fragment:N}...{/fragment} -> <span data-fragment="N">
│       │   ├── pluginEmbed.js      # @[youtube](ID) -> iframe
│       │   └── pluginLatex.js      # $$...$$ and $...$ -> KaTeX HTML
│       ├── slideParser.js          # Split markdown by === into slides, parse settings
│       ├── animations.css          # @keyframes for all animation types
│       └── slideStyles.css         # Slide layout styles (modern, minimal, dark)
│
└── public/
    └── fonts/
        ├── NunitoSans-Regular.ttf
        ├── NunitoSans-Italic.ttf
        ├── NunitoSans-LightItalic.ttf
        └── NunitoSans-ExtraBold.ttf
```

---

## Task 1: Project Scaffolding & Docker Setup

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `vite.config.js`

- [ ] **Step 1: Initialize package.json**

```bash
cd /c/Users/Cedric/claude_projects/rzpresenter
npm init -y
```

- [ ] **Step 2: Install backend dependencies**

```bash
npm install express better-sqlite3 bcryptjs uuid express-session express-rate-limit helmet multer connect-sqlite3 dotenv
```

- [ ] **Step 3: Install frontend dependencies**

```bash
npm install react react-dom react-router-dom lucide-react
npm install -D vite @vitejs/plugin-react
```

- [ ] **Step 4: Install editor and markdown dependencies**

```bash
npm install markdown-it katex @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/language @codemirror/commands @codemirror/autocomplete @codemirror/search @codemirror/lint codemirror
```

- [ ] **Step 5: Create .env.example**

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Session
SESSION_SECRET=change-me-to-a-random-string

# Database
DB_PATH=./data/rzpresenter.db

# Uploads
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_SIZE_MB=10

# Cookies
COOKIE_SECURE=false

# Registration
ALLOW_REGISTRATION=true
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
data/
.env
*.log
```

- [ ] **Step 7: Create vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 8: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY public ./public
RUN mkdir -p /app/data/uploads
EXPOSE 3000
CMD ["node", "server/index.js"]
```

- [ ] **Step 9: Create docker-compose.yml**

```yaml
services:
  rzpresenter:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    env_file:
      - .env
    volumes:
      - rzpresenter-data:/app/data
    restart: unless-stopped

volumes:
  rzpresenter-data:
```

- [ ] **Step 10: Create index.html in project root**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RZPresenter</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 11: Add scripts to package.json**

Add to `scripts`:
```json
{
  "dev": "vite",
  "build": "vite build",
  "start": "node server/index.js",
  "dev:server": "node --watch server/index.js"
}
```

- [ ] **Step 12: Commit**

```bash
git init
git add package.json .env.example .gitignore docker-compose.yml Dockerfile vite.config.js index.html
git commit -m "feat: project scaffolding with Docker, Vite, Express setup"
```

---

## Task 2: Database Schema & Connection

**Files:**
- Create: `server/config.js`
- Create: `server/db/connection.js`
- Create: `server/db/migrations.js`

- [ ] **Step 1: Create server/config.js**

```js
import 'dotenv/config';

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  dbPath: process.env.DB_PATH || './data/rzpresenter.db',
  uploadDir: process.env.UPLOAD_DIR || './data/uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
  allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
};
```

- [ ] **Step 2: Create server/db/connection.js**

```js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config.js';

const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
```

- [ ] **Step 3: Create server/db/migrations.js**

```js
import db from './connection.js';

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presentations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('allow_registration', 'true');
  `);
}
```

- [ ] **Step 4: Verify migrations run without error**

Create a quick test script and run it:
```bash
node -e "import('./server/db/migrations.js').then(m => { m.runMigrations(); console.log('OK'); })"
```
Expected: "OK" printed, `data/rzpresenter.db` created.

- [ ] **Step 5: Commit**

```bash
git add server/config.js server/db/
git commit -m "feat: SQLite database schema with users, presentations, settings"
```

---

## Task 3: Express Server & Security Middleware

**Files:**
- Create: `server/index.js`
- Create: `server/middleware/security.js`

- [ ] **Step 1: Create server/middleware/security.js**

```js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function setupSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        fontSrc: ["'self'"],
      },
    },
  }));

  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, try again later' },
  }));

  app.use('/api/auth/register', rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Too many registration attempts, try again later' },
  }));
}
```

- [ ] **Step 2: Create server/index.js**

```js
import express from 'express';
import session from 'express-session';
import ConnectSQLite from 'connect-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { runMigrations } from './db/migrations.js';
import { setupSecurity } from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Run database migrations
runMigrations();

// Security
setupSecurity(app);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Sessions
const SQLiteStore = ConnectSQLite(session);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.dirname(config.dbPath) }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true', // set COOKIE_SECURE=true when behind HTTPS proxy
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

// API routes (added in later tasks)
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/presentations', presentationRoutes);
// app.use('/api/uploads', uploadRoutes);

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.use('/fonts', express.static(path.join(__dirname, '..', 'public', 'fonts')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(config.port, config.host, () => {
  console.log(`RZPresenter running on http://${config.host}:${config.port}`);
});
```

- [ ] **Step 3: Test server starts**

```bash
cp .env.example .env
node server/index.js
```
Expected: "RZPresenter running on http://0.0.0.0:3000" (will 404 on pages since no frontend yet).

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/middleware/security.js
git commit -m "feat: Express server with session, helmet, rate-limiting"
```

---

## Task 4: Authentication Routes

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/utils/validation.js`
- Create: `server/routes/auth.js`

- [ ] **Step 1: Create server/utils/validation.js**

```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function validateUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_-]{3,30}$/.test(username.trim());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
```

- [ ] **Step 2: Create server/middleware/auth.js**

```js
export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

- [ ] **Step 3: Create server/routes/auth.js**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { validateEmail, validateUsername, validatePassword } from '../utils/validation.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, username, password } = req.body;

  // Check if registration is allowed
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('allow_registration');
  if (setting && setting.value === 'false') {
    return res.status(403).json({ error: 'Registration is disabled' });
  }

  if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!validateUsername(username)) return res.status(400).json({ error: 'Username must be 3-30 chars (letters, numbers, _, -)' });
  if (!validatePassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.trim(), username.trim());
  if (existing) return res.status(409).json({ error: 'Email or username already taken' });

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 12);

  // First user becomes admin
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const isAdmin = userCount === 0 ? 1 : 0;

  db.prepare(
    'INSERT INTO users (id, email, username, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.trim(), username.trim(), passwordHash, isAdmin);

  req.session.userId = id;
  req.session.isAdmin = isAdmin === 1;

  res.status(201).json({ id, email: email.trim(), username: username.trim(), isAdmin: isAdmin === 1 });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body; // login = email or username

  if (!login || !password) return res.status(400).json({ error: 'Login and password required' });

  const user = db.prepare(
    'SELECT id, email, username, password_hash, is_admin, is_locked FROM users WHERE email = ? OR username = ?'
  ).get(login.trim(), login.trim());

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.is_locked) return res.status(403).json({ error: 'Account is locked' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  req.session.isAdmin = user.is_admin === 1;

  res.json({ id: user.id, email: user.email, username: user.username, isAdmin: user.is_admin === 1 });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.prepare('SELECT id, email, username, is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({ id: user.id, email: user.email, username: user.username, isAdmin: user.is_admin === 1 });
});

export default router;
```

- [ ] **Step 4: Wire auth routes into server/index.js**

Add to server/index.js before the static file serving:
```js
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);
```

- [ ] **Step 5: Test registration and login with curl**

```bash
# Register first user (should become admin)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.de","username":"admin","password":"testtest1"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"testtest1"}'
```
Expected: 201 with user JSON (isAdmin: true), then 200 with same user.

- [ ] **Step 6: Commit**

```bash
git add server/middleware/auth.js server/utils/validation.js server/routes/auth.js server/index.js
git commit -m "feat: user authentication with register, login, logout, session management"
```

---

## Task 5: Admin Routes

**Files:**
- Create: `server/routes/admin.js`

- [ ] **Step 1: Create server/routes/admin.js**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(
    'SELECT id, email, username, is_admin, is_locked, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users.map(u => ({ ...u, isAdmin: u.is_admin === 1, isLocked: u.is_locked === 1 })));
});

// PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.params.id);
  res.json({ ok: true });
});

// PUT /api/admin/users/:id/lock
router.put('/users/:id/lock', (req, res) => {
  const { locked } = req.body;
  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_admin) return res.status(400).json({ error: 'Cannot lock admin account' });

  db.prepare('UPDATE users SET is_locked = ?, updated_at = datetime(\'now\') WHERE id = ?').run(locked ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  const { allowRegistration } = req.body;
  if (typeof allowRegistration === 'boolean') {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('allow_registration', String(allowRegistration));
  }
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Wire admin routes into server/index.js**

```js
import adminRoutes from './routes/admin.js';
app.use('/api/admin', adminRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/admin.js server/index.js
git commit -m "feat: admin routes for user management and settings"
```

---

## Task 6: Presentation CRUD Routes

**Files:**
- Create: `server/routes/presentations.js`

- [ ] **Step 1: Create server/routes/presentations.js**

```js
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitize } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

// GET /api/presentations
router.get('/', (req, res) => {
  const presentations = db.prepare(
    'SELECT id, title, created_at, updated_at FROM presentations WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.session.userId);
  res.json(presentations);
});

// POST /api/presentations
router.post('/', (req, res) => {
  const id = uuidv4();
  const title = sanitize((req.body.title || 'Untitled').slice(0, 200));
  const content = req.body.content || '';

  db.prepare(
    'INSERT INTO presentations (id, user_id, title, content) VALUES (?, ?, ?, ?)'
  ).run(id, req.session.userId, title, content);

  res.status(201).json({ id, title, content });
});

// GET /api/presentations/:id
router.get('/:id', (req, res) => {
  const p = db.prepare(
    'SELECT * FROM presentations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// PUT /api/presentations/:id
router.put('/:id', (req, res) => {
  const p = db.prepare(
    'SELECT id FROM presentations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.session.userId);
  if (!p) return res.status(404).json({ error: 'Not found' });

  const title = sanitize((req.body.title || 'Untitled').slice(0, 200));
  const content = req.body.content ?? '';

  db.prepare(
    'UPDATE presentations SET title = ?, content = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(title, content, req.params.id);

  res.json({ ok: true });
});

// DELETE /api/presentations/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM presentations WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.session.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Wire presentation routes into server/index.js**

```js
import presentationRoutes from './routes/presentations.js';
app.use('/api/presentations', presentationRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/presentations.js server/index.js
git commit -m "feat: presentation CRUD API endpoints"
```

---

## Task 7: File Upload Route

**Files:**
- Create: `server/routes/uploads.js`

- [ ] **Step 1: Create server/routes/uploads.js**

```js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/uploads
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/api/uploads/${req.file.filename}` });
});

// GET /api/uploads/:filename (serve uploaded files)
router.get('/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(config.uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.resolve(filePath));
});

export default router;
```

- [ ] **Step 2: Wire upload routes into server/index.js**

```js
import uploadRoutes from './routes/uploads.js';
app.use('/api/uploads', uploadRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/uploads.js server/index.js
git commit -m "feat: image upload API with multer, path traversal protection"
```

---

## Task 8: React App Shell & Routing

**Files:**
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`
- Create: `src/api/client.js`
- Create: `src/context/AuthContext.jsx`
- Create: `src/components/common/Layout.jsx`
- Create: `src/components/common/ProtectedRoute.jsx`
- Create: `src/components/common/Logo.jsx`
- Copy fonts to: `public/fonts/`

- [ ] **Step 1: Copy Nunito Sans fonts to public/fonts/**

```bash
mkdir -p public/fonts
cp cdhandbuch/02-Schrift/*.ttf public/fonts/
```

- [ ] **Step 2: Create src/index.css with HS Fulda theme**

```css
@font-face {
  font-family: 'Nunito Sans';
  src: url('/fonts/NunitoSans-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Nunito Sans';
  src: url('/fonts/NunitoSans-Italic.ttf') format('truetype');
  font-weight: 400;
  font-style: italic;
}
@font-face {
  font-family: 'Nunito Sans';
  src: url('/fonts/NunitoSans-LightItalic.ttf') format('truetype');
  font-weight: 300;
  font-style: italic;
}
@font-face {
  font-family: 'Nunito Sans';
  src: url('/fonts/NunitoSans-ExtraBold.ttf') format('truetype');
  font-weight: 800;
  font-style: normal;
}

:root {
  --color-primary: #72bf44;
  --color-primary-dark: #5a9936;
  --color-primary-light: #e8f5e0;
  --color-text: #000000;
  --color-text-light: #666666;
  --color-bg: #ffffff;
  --color-bg-secondary: #F4F1F2;
  --color-border: #e0e0e0;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --radius: 6px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 3px; }
a:hover { color: var(--color-primary-dark); }

button {
  font-family: var(--font-family);
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.15s, transform 0.1s;
}
button:active { transform: scale(0.98); }

.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover { background: var(--color-primary-dark); }

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { background: var(--color-border); }

input, select {
  font-family: var(--font-family);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  width: 100%;
}
input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}
```

- [ ] **Step 3: Create src/api/client.js**

```js
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
```

- [ ] **Step 4: Create src/context/AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (login, password) => {
    const data = await api.post('/api/auth/login', { login, password });
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (email, username, password) => {
    const data = await api.post('/api/auth/register', { email, username, password });
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 5: Create src/components/common/Logo.jsx**

```jsx
export default function Logo({ size = 32 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src="/fonts/../cdhandbuch/01-Logo/02-Sonderfall-nur-Buchenblatt/RGB-Digital/hs-fulda_logo_icon_gruen_72ppi.png"
        alt="HS Fulda" height={size} style={{ objectFit: 'contain' }} />
      <span style={{ fontWeight: 800, fontSize: size * 0.5 }}>RZPresenter</span>
    </div>
  );
}
```

Note: We'll serve the logo from public/ in a later step. For now we reference it directly.

- [ ] **Step 6: Create src/components/common/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}
```

- [ ] **Step 7: Create src/components/common/Layout.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        background: 'white',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.25rem' }}>RZ</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Presenter</span>
        </Link>
        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/">Presentations</Link>
            {user.isAdmin && <Link to="/admin">Admin</Link>}
            <span style={{ color: 'var(--color-text-light)' }}>{user.username}</span>
            <button className="btn-secondary" onClick={handleLogout}>Logout</button>
          </nav>
        )}
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 8: Create src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import PresentPage from './pages/PresentPage';
import PresenterPage from './pages/PresenterPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
          <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/present/:id" element={<ProtectedRoute><PresentPage /></ProtectedRoute>} />
          <Route path="/presenter/:id" element={<ProtectedRoute><PresenterPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><AdminPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 9: Create src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
);
```

- [ ] **Step 10: Create placeholder page components**

Create each of these files with a minimal placeholder:
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/EditorPage.jsx`
- `src/pages/PresentPage.jsx`
- `src/pages/PresenterPage.jsx`
- `src/pages/AdminPage.jsx`

Each should export a default component with just a heading, e.g.:
```jsx
export default function LoginPage() {
  return <div style={{ padding: '2rem' }}><h1>Login</h1></div>;
}
```

- [ ] **Step 11: Test the dev server**

```bash
npm run dev
```
Expected: Vite dev server on port 5173, shows "Login" page (redirects since not auth'd).

- [ ] **Step 12: Commit**

```bash
git add src/ public/fonts/ index.html
git commit -m "feat: React app shell with routing, auth context, HS Fulda theme"
```

---

## Task 9: Login & Register Pages

**Files:**
- Modify: `src/pages/LoginPage.jsx`
- Modify: `src/pages/RegisterPage.jsx`

- [ ] **Step 1: Implement LoginPage.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: doLogin, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await doLogin(login, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--color-primary)' }}>RZ</span>Presenter
        </h1>
        {error && <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Email or Username</label>
            <input value={login} onChange={e => setLogin(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-light)' }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement RegisterPage.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--color-primary)' }}>RZ</span>Presenter
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>Create your account</p>
        {error && <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={30} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-light)' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test login/register flow in browser**

Run `npm run dev` and `npm run dev:server` in parallel. Navigate to localhost:5173/register, create a user, verify redirect to dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.jsx src/pages/RegisterPage.jsx
git commit -m "feat: login and register pages with form validation"
```

---

## Task 10: Dashboard Page

**Files:**
- Modify: `src/pages/DashboardPage.jsx`

- [ ] **Step 1: Implement DashboardPage.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function DashboardPage() {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/presentations').then(setPresentations).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const p = await api.post('/api/presentations', { title: 'Untitled Presentation' });
    navigate(`/edit/${p.id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this presentation?')) return;
    await api.delete(`/api/presentations/${id}`);
    setPresentations(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Presentations</h1>
        <button className="btn-primary" onClick={handleCreate}>+ New Presentation</button>
      </div>
      {presentations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
          No presentations yet. Create your first one!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {presentations.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{p.title}</h3>
                <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                  Updated: {new Date(p.updated_at).toLocaleString('de-DE')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={() => navigate(`/edit/${p.id}`)}>Edit</button>
                <button className="btn-secondary" onClick={() => navigate(`/present/${p.id}`)}>Present</button>
                <button className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardPage.jsx
git commit -m "feat: dashboard page listing presentations with create/delete"
```

---

## Task 11: Admin Page

**Files:**
- Modify: `src/pages/AdminPage.jsx`

- [ ] **Step 1: Implement AdminPage.jsx**

```jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [resetPw, setResetPw] = useState({});

  useEffect(() => {
    api.get('/api/admin/users').then(setUsers);
    api.get('/api/admin/settings').then(setSettings);
  }, []);

  const toggleLock = async (userId, currentlyLocked) => {
    await api.put(`/api/admin/users/${userId}/lock`, { locked: !currentlyLocked });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !currentlyLocked, is_locked: !currentlyLocked ? 1 : 0 } : u));
  };

  const resetPassword = async (userId) => {
    const pw = resetPw[userId];
    if (!pw || pw.length < 8) return alert('Password must be at least 8 characters');
    await api.put(`/api/admin/users/${userId}/reset-password`, { newPassword: pw });
    setResetPw(prev => ({ ...prev, [userId]: '' }));
    alert('Password reset successfully');
  };

  const toggleRegistration = async () => {
    const newVal = settings.allow_registration !== 'true';
    await api.put('/api/admin/settings', { allowRegistration: newVal });
    setSettings(prev => ({ ...prev, allow_registration: String(newVal) }));
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Panel</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Settings</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.allow_registration === 'true'} onChange={toggleRegistration} />
          Allow new user registration
        </label>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Users ({users.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Username</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem' }}>{u.username}</td>
                <td style={{ padding: '0.5rem' }}>{u.email}</td>
                <td style={{ padding: '0.5rem' }}>{u.isAdmin ? 'Admin' : 'User'}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{ color: u.isLocked ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                    {u.isLocked ? 'Locked' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {!u.isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" onClick={() => toggleLock(u.id, u.isLocked)}>
                        {u.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <input
                        placeholder="New password"
                        type="password"
                        value={resetPw[u.id] || ''}
                        onChange={e => setResetPw(prev => ({ ...prev, [u.id]: e.target.value }))}
                        style={{ width: 140 }}
                      />
                      <button className="btn-danger" onClick={() => resetPassword(u.id)}>Reset PW</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminPage.jsx
git commit -m "feat: admin panel with user management and registration toggle"
```

---

## Task 12: Markdown Parser & Custom Plugins

**Files:**
- Create: `src/lib/markdown/parser.js`
- Create: `src/lib/markdown/pluginColor.js`
- Create: `src/lib/markdown/pluginGradient.js`
- Create: `src/lib/markdown/pluginAnimation.js`
- Create: `src/lib/markdown/pluginFragment.js`
- Create: `src/lib/markdown/pluginEmbed.js`
- Create: `src/lib/markdown/pluginLatex.js`
- Create: `src/lib/slideParser.js`

- [ ] **Step 1: Create src/lib/markdown/pluginColor.js**

Parses `{color:red}text{/color}` and `{color:#ff6600}text{/color}`.

```js
// markdown-it plugin for {color:VALUE}text{/color}
export default function pluginColor(md) {
  const OPEN_RE = /\{color:([^}]+)\}/;
  const CLOSE_RE = /\{\/color\}/;

  md.inline.ruler.before('emphasis', 'color_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('color_open', 'span', 1);
    token.attrSet('style', `color:${match[1]}`);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'color_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('color_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
```

- [ ] **Step 2: Create src/lib/markdown/pluginGradient.js**

Parses `{gradient:color1,color2}text{/gradient}`.

```js
export default function pluginGradient(md) {
  const OPEN_RE = /\{gradient:([^,}]+),([^}]+)\}/;
  const CLOSE_RE = /\{\/gradient\}/;

  md.inline.ruler.before('emphasis', 'gradient_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('gradient_open', 'span', 1);
    token.attrSet('style',
      `background: linear-gradient(90deg, ${match[1]}, ${match[2]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
    );
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'gradient_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('gradient_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
```

- [ ] **Step 3: Create src/lib/markdown/pluginAnimation.js**

Parses `{anim:fadeIn}text{/anim}`.

```js
export default function pluginAnimation(md) {
  const OPEN_RE = /\{anim:([a-zA-Z]+)\}/;
  const CLOSE_RE = /\{\/anim\}/;

  md.inline.ruler.before('emphasis', 'anim_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('anim_open', 'span', 1);
    token.attrSet('class', `anim anim-${match[1]}`);
    token.attrSet('data-animation', match[1]);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'anim_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('anim_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
```

- [ ] **Step 4: Create src/lib/markdown/pluginFragment.js**

Parses `{fragment:N}content{/fragment}` for progressive reveal.

```js
export default function pluginFragment(md) {
  const OPEN_RE = /\{fragment:(\d+)\}/;
  const CLOSE_RE = /\{\/fragment\}/;

  md.inline.ruler.before('emphasis', 'fragment_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('fragment_open', 'span', 1);
    token.attrSet('class', 'fragment');
    token.attrSet('data-fragment', match[1]);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'fragment_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('fragment_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
```

- [ ] **Step 5: Create src/lib/markdown/pluginEmbed.js**

Parses `@[youtube](VIDEO_ID)`.

```js
export default function pluginEmbed(md) {
  const EMBED_RE = /^@\[youtube\]\(([^)]+)\)/;

  md.inline.ruler.before('emphasis', 'embed', (state, silent) => {
    const match = state.src.slice(state.pos).match(EMBED_RE);
    if (!match) return false;
    if (silent) return true;

    const token = state.push('embed', '', 0);
    token.content = match[1];
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.renderer.rules.embed = (tokens, idx) => {
    const videoId = tokens[idx].content.replace(/[^a-zA-Z0-9_-]/g, '');
    return `<div class="embed-container"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
  };
}
```

- [ ] **Step 6: Create src/lib/markdown/pluginLatex.js**

Renders `$$block$$` and `$inline$` LaTeX via KaTeX.

```js
import katex from 'katex';

export default function pluginLatex(md) {
  // Block: $$...$$
  md.block.ruler.before('fence', 'latex_block', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    if (state.src.slice(startPos, startPos + 2) !== '$$') return false;
    if (silent) return true;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      if (state.src.slice(pos, pos + 2) === '$$') break;
      nextLine++;
    }
    if (nextLine >= endLine) return false;

    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], false).trim();
    const token = state.push('latex_block', '', 0);
    token.content = content;
    token.map = [startLine, nextLine + 1];
    state.line = nextLine + 1;
    return true;
  });

  md.renderer.rules.latex_block = (tokens, idx) => {
    try {
      return `<div class="katex-block">${katex.renderToString(tokens[idx].content, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="katex-error">${tokens[idx].content}</div>`;
    }
  };

  // Inline: $...$
  md.inline.ruler.before('emphasis', 'latex_inline', (state, silent) => {
    if (state.src[state.pos] !== '$' || state.src[state.pos + 1] === '$') return false;
    const end = state.src.indexOf('$', state.pos + 1);
    if (end === -1) return false;
    if (silent) return true;

    const content = state.src.slice(state.pos + 1, end);
    const token = state.push('latex_inline', '', 0);
    token.content = content;
    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.latex_inline = (tokens, idx) => {
    try {
      return katex.renderToString(tokens[idx].content, { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tokens[idx].content}</span>`;
    }
  };
}
```

- [ ] **Step 7: Create src/lib/markdown/parser.js**

Assembles all plugins into one markdown-it instance.

```js
import MarkdownIt from 'markdown-it';
import pluginColor from './pluginColor.js';
import pluginGradient from './pluginGradient.js';
import pluginAnimation from './pluginAnimation.js';
import pluginFragment from './pluginFragment.js';
import pluginEmbed from './pluginEmbed.js';
import pluginLatex from './pluginLatex.js';

const md = new MarkdownIt({
  html: false,       // Disable raw HTML for security (XSS prevention)
  linkify: true,      // Auto-link URLs
  typographer: true,  // Smart quotes
  breaks: true,       // Newlines become <br>
});

md.use(pluginColor);
md.use(pluginGradient);
md.use(pluginAnimation);
md.use(pluginFragment);
md.use(pluginEmbed);
md.use(pluginLatex);

export default md;
```

- [ ] **Step 8: Create src/lib/slideParser.js**

Splits markdown by `===`, parses settings header.

```js
import md from './markdown/parser.js';

const SETTINGS_RE = /^---settings---\n([\s\S]*?)\n---\/settings---/;

const DEFAULT_SETTINGS = {
  style: 'modern',
  animation: 'fade',
  transition: 'slide',
  footer: '',
  pageNumbers: true,
  logo: true,
};

function parseSettings(content) {
  const match = content.match(SETTINGS_RE);
  if (!match) return { settings: { ...DEFAULT_SETTINGS }, body: content };

  const settings = { ...DEFAULT_SETTINGS };
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      const val = rest.join(':').trim();
      if (val === 'true') settings[key.trim()] = true;
      else if (val === 'false') settings[key.trim()] = false;
      else settings[key.trim()] = val;
    }
  });

  const body = content.slice(match[0].length).trim();
  return { settings, body };
}

export function parsePresentation(rawContent) {
  const { settings, body } = parseSettings(rawContent);

  const slides = body
    .split(/^===$/m)
    .map(s => s.trim())
    .filter(Boolean)
    .map((slideContent, index) => ({
      index,
      raw: slideContent,
      html: md.render(slideContent),
    }));

  return { settings, slides };
}

export function renderMarkdown(content) {
  return md.render(content);
}
```

- [ ] **Step 9: Test in browser console**

Import and run `parsePresentation` with test markdown to verify all plugins work.

- [ ] **Step 10: Commit**

```bash
git add src/lib/
git commit -m "feat: markdown parser with color, gradient, animation, fragment, embed, LaTeX plugins"
```

---

## Task 13: CSS Animations

**Files:**
- Create: `src/lib/animations.css`
- Create: `src/lib/slideStyles.css`

- [ ] **Step 1: Create src/lib/animations.css**

```css
/* Animation base */
.anim { display: inline-block; }

/* fadeIn */
.anim-fadeIn { animation: fadeIn 0.6s ease both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* fadeInUp */
.anim-fadeInUp { animation: fadeInUp 0.6s ease both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* fadeInDown */
.anim-fadeInDown { animation: fadeInDown 0.6s ease both; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }

/* fadeInLeft */
.anim-fadeInLeft { animation: fadeInLeft 0.6s ease both; }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }

/* fadeInRight */
.anim-fadeInRight { animation: fadeInRight 0.6s ease both; }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

/* bounceIn */
.anim-bounceIn { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both; }
@keyframes bounceIn { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }

/* zoomIn */
.anim-zoomIn { animation: zoomIn 0.5s ease both; }
@keyframes zoomIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }

/* typewriter */
.anim-typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid var(--color-text);
  animation: typewriter 2s steps(40) both, blink 0.75s step-end infinite;
  width: 0;
}
@keyframes typewriter { to { width: 100%; } }
@keyframes blink { 50% { border-color: transparent; } }

/* Fragment visibility */
.fragment { opacity: 0; transition: opacity 0.4s ease, transform 0.4s ease; }
.fragment.visible { opacity: 1; }

/* Slide transitions */
.slide-transition-fade-enter { opacity: 0; }
.slide-transition-fade-enter-active { opacity: 1; transition: opacity 0.4s ease; }

.slide-transition-slide-enter { transform: translateX(100%); }
.slide-transition-slide-enter-active { transform: translateX(0); transition: transform 0.4s ease; }

.slide-transition-zoom-enter { transform: scale(0.8); opacity: 0; }
.slide-transition-zoom-enter-active { transform: scale(1); opacity: 1; transition: all 0.4s ease; }
```

- [ ] **Step 2: Create src/lib/slideStyles.css**

```css
/* Base slide styles */
.slide {
  width: 100%;
  height: 100%;
  padding: 3rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: var(--font-family);
  overflow: hidden;
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.slide h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
.slide h2 { font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem; }
.slide h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
.slide p { font-size: 1.25rem; margin-bottom: 0.75rem; line-height: 1.6; }
.slide ul, .slide ol { font-size: 1.25rem; margin-left: 2rem; margin-bottom: 0.75rem; }
.slide ul { list-style: none; }
.slide ul > li::before { content: '\00BB\00A0'; color: var(--color-primary, #72BF44); } /* CD guillemet bullets */
.slide li { margin-bottom: 0.4rem; line-height: 1.5; }
.slide li > ul, .slide li > ol { margin-top: 0.25rem; }

.slide img {
  max-width: 100%;
  max-height: 60%;
  object-fit: contain;
  border-radius: var(--radius);
}

.slide .embed-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  padding-bottom: 56.25%;
}
.slide .embed-container iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: var(--radius);
}

.slide code {
  background: var(--color-bg-secondary);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}
.slide pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: var(--radius);
  overflow-x: auto;
  font-size: 0.9rem;
}

.slide .katex-block {
  text-align: center;
  margin: 1rem 0;
  font-size: 1.3rem;
}

/* Slide footer */
.slide-footer {
  position: absolute;
  bottom: 1rem;
  left: 4rem;
  right: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* Style: modern (default - follows HS Fulda CD: black text on white) */
.slide-style-modern {
  background: white;
  color: #000000;
}
.slide-style-modern h1,
.slide-style-modern h2 {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
/* Green accent line under headings per CD */
.slide-style-modern h1::after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: #72BF44;
  margin-top: 0.5rem;
}

/* Style: minimal */
.slide-style-minimal {
  background: white;
  color: var(--color-text);
}

/* Style: dark */
.slide-style-dark {
  background: #1a1a1a;
  color: #f0f0f0;
}
.slide-style-dark h1,
.slide-style-dark h2 {
  color: var(--color-primary);
}
.slide-style-dark code { background: #333; }
```

- [ ] **Step 3: Import animations.css and slideStyles.css in index.css**

Add at the bottom of `src/index.css`:
```css
@import './lib/animations.css';
@import './lib/slideStyles.css';
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/animations.css src/lib/slideStyles.css src/index.css
git commit -m "feat: CSS animations and slide style themes (modern, minimal, dark)"
```

---

## Task 14: Markdown Editor (CodeMirror 6)

**Files:**
- Create: `src/components/editor/MarkdownEditor.jsx`
- Create: `src/components/editor/EditorToolbar.jsx`
- Create: `src/components/editor/SettingsPanel.jsx`
- Create: `src/components/editor/ViewToggle.jsx`

- [ ] **Step 1: Create src/components/editor/MarkdownEditor.jsx**

```jsx
import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: "'Nunito Sans', monospace",
  },
  '.cm-content': { padding: '1rem' },
  '.cm-gutters': { background: '#F4F1F2', border: 'none' },
  '&.cm-focused': { outline: 'none' },
});

// Autocomplete for custom syntax
const customCompletions = (context) => {
  const before = context.matchBefore(/\{[a-z]*/);
  if (!before) return null;
  return {
    from: before.from,
    options: [
      { label: '{color:}', type: 'keyword', detail: 'Text color', apply: '{color:red}' },
      { label: '{gradient:}', type: 'keyword', detail: 'Gradient text', apply: '{gradient:green,blue}' },
      { label: '{anim:fadeIn}', type: 'keyword', detail: 'Fade in animation' },
      { label: '{anim:fadeInUp}', type: 'keyword', detail: 'Fade in from bottom' },
      { label: '{anim:bounceIn}', type: 'keyword', detail: 'Bounce animation' },
      { label: '{anim:typewriter}', type: 'keyword', detail: 'Typewriter effect' },
      { label: '{anim:zoomIn}', type: 'keyword', detail: 'Zoom in animation' },
      { label: '{fragment:1}', type: 'keyword', detail: 'Fragment reveal' },
      { label: '{/color}', type: 'keyword', detail: 'Close color' },
      { label: '{/gradient}', type: 'keyword', detail: 'Close gradient' },
      { label: '{/anim}', type: 'keyword', detail: 'Close animation' },
      { label: '{/fragment}', type: 'keyword', detail: 'Close fragment' },
    ],
  };
};

export default function MarkdownEditor({ value, onChange }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const listenerCompartment = useRef(new Compartment());

  // Keep ref in sync so the EditorView listener always calls the latest onChange
  useEffect(() => {
    onChangeRef.current = onChange;
    // Reconfigure the listener compartment with fresh closure
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: listenerCompartment.current.reconfigure(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          })
        ),
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        history(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        autocompletion({ override: [customCompletions] }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        theme,
        listenerCompartment.current.of(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          })
        ),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => view.destroy();
  }, []); // Only create once

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }} />;
}
```

- [ ] **Step 2: Create src/components/editor/EditorToolbar.jsx**

```jsx
export default function EditorToolbar({ onInsert }) {
  const actions = [
    { label: 'B', title: 'Bold', insert: ['**', '**'] },
    { label: 'I', title: 'Italic', insert: ['*', '*'] },
    { label: 'H1', title: 'Heading 1', insert: ['# ', ''] },
    { label: 'H2', title: 'Heading 2', insert: ['## ', ''] },
    { label: 'H3', title: 'Heading 3', insert: ['### ', ''] },
    { label: '---', title: 'Page Break', insert: ['\n===\n', ''] },
    { label: 'Color', title: 'Color', insert: ['{color:red}', '{/color}'] },
    { label: 'Gradient', title: 'Gradient', insert: ['{gradient:#72bf44,#1a1a1a}', '{/gradient}'] },
    { label: 'Anim', title: 'Animation', insert: ['{anim:fadeIn}', '{/anim}'] },
    { label: 'Frag', title: 'Fragment', insert: ['{fragment:1}', '{/fragment}'] },
    { label: 'LaTeX', title: 'LaTeX block', insert: ['\n$$\n', '\n$$\n'] },
    { label: '$', title: 'Inline LaTeX', insert: ['$', '$'] },
    { label: 'YT', title: 'YouTube embed', insert: ['@[youtube](', ')'] },
    { label: 'Img', title: 'Image', insert: ['![alt](', ')'] },
    { label: 'Link', title: 'Link', insert: ['[text](', ')'] },
    { label: 'Code', title: 'Code block', insert: ['\n```\n', '\n```\n'] },
    { label: 'List', title: 'Bullet list', insert: ['- ', ''] },
  ];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '0.5rem',
      borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
    }}>
      {actions.map(a => (
        <button
          key={a.title}
          title={a.title}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 0 }}
          onClick={() => onInsert(a.insert[0], a.insert[1])}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/editor/SettingsPanel.jsx**

```jsx
import { useState, useEffect } from 'react';

const SETTINGS_TEMPLATE = `---settings---
style: {style}
animation: {animation}
transition: {transition}
footer: {footer}
pageNumbers: {pageNumbers}
logo: {logo}
---/settings---`;

export default function SettingsPanel({ content, onUpdateContent }) {
  const [settings, setSettings] = useState({
    style: 'modern', animation: 'fade', transition: 'slide',
    footer: '', pageNumbers: 'true', logo: 'true',
  });

  useEffect(() => {
    const match = content.match(/^---settings---\n([\s\S]*?)\n---\/settings---/);
    if (match) {
      const parsed = {};
      match[1].split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) parsed[key.trim()] = rest.join(':').trim();
      });
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  }, [content]);

  const apply = (newSettings) => {
    const block = SETTINGS_TEMPLATE
      .replace('{style}', newSettings.style)
      .replace('{animation}', newSettings.animation)
      .replace('{transition}', newSettings.transition)
      .replace('{footer}', newSettings.footer)
      .replace('{pageNumbers}', newSettings.pageNumbers)
      .replace('{logo}', newSettings.logo);

    const existing = content.match(/^---settings---\n[\s\S]*?\n---\/settings---\n?/);
    const newContent = existing
      ? content.replace(existing[0], block + '\n')
      : block + '\n' + content;
    onUpdateContent(newContent);
    setSettings(newSettings);
  };

  const update = (key, value) => {
    apply({ ...settings, [key]: value });
  };

  const fieldStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600, width: 80 };

  return (
    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
      <div style={fieldStyle}>
        <span style={labelStyle}>Style</span>
        <select value={settings.style} onChange={e => update('style', e.target.value)} style={{ width: 'auto' }}>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Animation</span>
        <select value={settings.animation} onChange={e => update('animation', e.target.value)} style={{ width: 'auto' }}>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="none">None</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Transition</span>
        <select value={settings.transition} onChange={e => update('transition', e.target.value)} style={{ width: 'auto' }}>
          <option value="slide">Slide</option>
          <option value="fade">Fade</option>
          <option value="zoom">Zoom</option>
          <option value="none">None</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Footer</span>
        <input value={settings.footer} onChange={e => update('footer', e.target.value)} placeholder="Footer text" style={{ width: 'auto', flex: 1 }} />
      </div>
      <div style={fieldStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input type="checkbox" checked={settings.pageNumbers === 'true'} onChange={e => update('pageNumbers', String(e.target.checked))} />
          <span style={{ fontSize: '0.8rem' }}>Page numbers</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '1rem' }}>
          <input type="checkbox" checked={settings.logo === 'true'} onChange={e => update('logo', String(e.target.checked))} />
          <span style={{ fontSize: '0.8rem' }}>Show logo</span>
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/editor/ViewToggle.jsx**

```jsx
export default function ViewToggle({ mode, onChange }) {
  const modes = [
    { key: 'editor', label: 'Editor' },
    { key: 'preview', label: 'Preview' },
    { key: 'split', label: 'Side by Side' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2px', background: 'var(--color-bg-secondary)', padding: '2px', borderRadius: 'var(--radius)' }}>
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius)',
            background: mode === m.key ? 'var(--color-primary)' : 'transparent',
            color: mode === m.key ? 'white' : 'var(--color-text)',
            border: 'none', cursor: 'pointer', fontWeight: mode === m.key ? 600 : 400,
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/
git commit -m "feat: CodeMirror 6 markdown editor with toolbar, settings panel, view toggle"
```

---

## Task 15: Slide Preview Component

**Files:**
- Create: `src/components/preview/SlidePreview.jsx`
- Create: `src/components/preview/SlideList.jsx`

- [ ] **Step 1: Create src/components/preview/SlidePreview.jsx**

```jsx
import 'katex/dist/katex.min.css';

export default function SlidePreview({ html, settings, index, total, scale = 1 }) {
  const styleClass = `slide slide-style-${settings.style || 'modern'}`;

  return (
    <div style={{
      width: 960, height: 540,
      transform: `scale(${scale})`, transformOrigin: 'top left',
      boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div
        className={styleClass}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
        <div className="slide-footer">
          <span>{settings.footer || ''}</span>
          <span>{index + 1} / {total}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/preview/SlideList.jsx**

```jsx
import SlidePreview from './SlidePreview';

export default function SlideList({ slides, settings, currentIndex, onSelect }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      padding: '0.5rem', overflowY: 'auto', height: '100%',
    }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          style={{
            cursor: 'pointer',
            border: i === currentIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <SlidePreview html={slide.html} settings={settings} index={i} total={slides.length} scale={0.2} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/preview/
git commit -m "feat: slide preview and slide list thumbnail components"
```

---

## Task 16: Editor Page (Full Integration)

**Files:**
- Modify: `src/pages/EditorPage.jsx`

- [ ] **Step 1: Implement EditorPage.jsx**

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import SettingsPanel from '../components/editor/SettingsPanel';
import ViewToggle from '../components/editor/ViewToggle';
import SlidePreview from '../components/preview/SlidePreview';
import SlideList from '../components/preview/SlideList';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    api.get(`/api/presentations/${id}`).then(p => {
      setTitle(p.title);
      setContent(p.content || '---settings---\nstyle: modern\nanimation: fade\ntransition: slide\nfooter: \npageNumbers: true\nlogo: true\n---/settings---\n\n# Welcome\n\nEdit your presentation here\n\n===\n\n# Slide 2\n\nAdd more content...');
    }).catch(() => navigate('/'));
  }, [id]);

  const save = useCallback(async (newContent, newTitle) => {
    setSaving(true);
    try {
      await api.put(`/api/presentations/${id}`, { title: newTitle || title, content: newContent ?? content });
    } finally {
      setSaving(false);
    }
  }, [id, title, content]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newContent), 1500);
  }, [save]);

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(content, newTitle), 1500);
  };

  const handleInsert = (before, after) => {
    setContent(prev => prev + before + 'text' + after);
  };

  const { settings, slides } = parsePresentation(content);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem',
        borderBottom: '1px solid var(--color-border)', background: 'white',
      }}>
        <Link to="/" style={{ color: 'var(--color-text)', fontWeight: 800 }}>
          <span style={{ color: 'var(--color-primary)' }}>RZ</span>P
        </Link>
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          style={{ border: 'none', fontWeight: 600, fontSize: '1rem', flex: 1, outline: 'none' }}
        />
        <ViewToggle mode={viewMode} onChange={setViewMode} />
        <button className="btn-secondary" onClick={() => setShowSettings(!showSettings)}>
          Settings
        </button>
        <span style={{ fontSize: '0.75rem', color: saving ? 'var(--color-warning)' : 'var(--color-primary)' }}>
          {saving ? 'Saving...' : 'Saved'}
        </span>
        <button className="btn-primary" onClick={() => navigate(`/presenter/${id}?slide=${currentSlide}`)}>Present</button>
        <button className="btn-secondary" onClick={() => navigate(`/presenter/${id}`)}>From Start</button>
      </div>

      {showSettings && <SettingsPanel content={content} onUpdateContent={setContent} />}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: viewMode === 'split' ? '1px solid var(--color-border)' : 'none' }}>
            <EditorToolbar onInsert={handleInsert} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MarkdownEditor value={content} onChange={handleContentChange} />
            </div>
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '1rem', overflowY: 'auto' }}>
              {slides[currentSlide] && (
                <SlidePreview
                  html={slides[currentSlide].html}
                  settings={settings}
                  index={currentSlide}
                  total={slides.length}
                  scale={viewMode === 'split' ? 0.55 : 0.75}
                />
              )}
            </div>
            <div style={{ width: 140, borderLeft: '1px solid var(--color-border)' }}>
              <SlideList slides={slides} settings={settings} currentIndex={currentSlide} onSelect={setCurrentSlide} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test the editor in the browser**

Create a presentation from dashboard, verify the editor loads with CodeMirror, toolbar works, preview renders slides split by `===`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/EditorPage.jsx
git commit -m "feat: full editor page with split view, auto-save, slide preview"
```

---

## Task 17: Presentation Mode (Fullscreen)

**Files:**
- Modify: `src/pages/PresentPage.jsx`

- [ ] **Step 1: Implement PresentPage.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import 'katex/dist/katex.min.css';

export default function PresentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const startSlide = parseInt(searchParams.get('slide') || '0', 10);
  const [current, setCurrent] = useState(startSlide);
  const [fragmentIndex, setFragmentIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/presentations/${id}`).then(p => {
      const parsed = parsePresentation(p.content);
      setSlides(parsed.slides);
      setSettings(parsed.settings);
    }).catch(() => navigate('/'));
  }, [id]);

  const getFragments = useCallback((slideIndex) => {
    if (!slides[slideIndex]) return 0;
    const matches = slides[slideIndex].html.match(/data-fragment="(\d+)"/g);
    if (!matches) return 0;
    return Math.max(...matches.map(m => parseInt(m.match(/\d+/)[0])));
  }, [slides]);

  const goNext = useCallback(() => {
    const maxFrag = getFragments(current);
    if (fragmentIndex < maxFrag) {
      setFragmentIndex(f => f + 1);
    } else if (current < slides.length - 1) {
      setCurrent(c => c + 1);
      setFragmentIndex(0);
    }
  }, [current, fragmentIndex, slides.length, getFragments]);

  const goPrev = useCallback(() => {
    if (fragmentIndex > 0) {
      setFragmentIndex(f => f - 1);
    } else if (current > 0) {
      setCurrent(c => c - 1);
      setFragmentIndex(getFragments(current - 1));
    }
  }, [current, fragmentIndex, getFragments]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') navigate('/');
      if (e.key === 'f') {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Apply fragment visibility
  const getSlideHtml = (slide) => {
    if (!slide) return '';
    let html = slide.html;
    // Make fragments visible up to current fragmentIndex
    html = html.replace(/class="fragment"(\s+)data-fragment="(\d+)"/g, (match, space, num) => {
      const n = parseInt(num);
      if (n <= fragmentIndex) return `class="fragment visible"${space}data-fragment="${num}"`;
      return match;
    });
    return html;
  };

  const slide = slides[current];
  if (!slide) return <div style={{ background: 'black', width: '100vw', height: '100vh' }} />;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: settings.style === 'dark' ? '#1a1a1a' : 'white',
      cursor: 'none',
    }}
      onClick={goNext}
      onContextMenu={(e) => { e.preventDefault(); goPrev(); }}
    >
      <div style={{
        width: 960, height: 540,
        transform: `scale(${Math.min(window.innerWidth / 960, window.innerHeight / 540)})`,
        transformOrigin: 'center center',
        position: 'relative',
      }}>
        <div
          className={`slide slide-style-${settings.style || 'modern'}`}
          dangerouslySetInnerHTML={{ __html: getSlideHtml(slide) }}
        />
        {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
          <div className="slide-footer">
            <span>{settings.footer || ''}</span>
            <span>{current + 1} / {slides.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/PresentPage.jsx
git commit -m "feat: fullscreen presentation mode with fragment reveals, keyboard navigation"
```

---

## Task 18: Presenter View

**Files:**
- Modify: `src/pages/PresenterPage.jsx`
- Create: `src/components/presenter/Timer.jsx`
- Create: `src/components/presenter/AnnotationCanvas.jsx`

- [ ] **Step 1: Create src/components/presenter/Timer.jsx**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

export default function Timer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = useCallback(() => setRunning(r => !r), []);
  const reset = useCallback(() => { setRunning(false); setElapsed(0); }, []);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: '0.5rem' }}>
        {fmt(elapsed)}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={toggle} style={{ minWidth: 70 }}>
          {running ? 'Pause' : elapsed > 0 ? 'Continue' : 'Start'}
        </button>
        <button className="btn-secondary" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/presenter/AnnotationCanvas.jsx**

```jsx
import { useRef, useState, useEffect, useCallback } from 'react';

export default function AnnotationCanvas({ width, height }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('none'); // 'marker', 'laser', 'eraser', 'none'
  const [drawing, setDrawing] = useState(false);
  const [laserPos, setLaserPos] = useState(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const startDraw = useCallback((e) => {
    if (tool === 'none') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'laser') {
      setLaserPos({ x, y });
      return;
    }

    setDrawing(true);
    const ctx = getCtx();
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'marker') {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'source-over';
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
    }
  }, [tool]);

  const draw = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'laser') {
      setLaserPos({ x, y });
      return;
    }

    if (!drawing) return;
    const ctx = getCtx();
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [drawing, tool]);

  const stopDraw = useCallback(() => {
    setDrawing(false);
    if (tool === 'laser') setLaserPos(null);
    const ctx = getCtx();
    if (ctx) ctx.globalCompositeOperation = 'source-over';
  }, [tool]);

  const clearAll = () => {
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, width, height);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'm') setTool(t => t === 'marker' ? 'none' : 'marker');
      if (e.key === 'l') setTool(t => t === 'laser' ? 'none' : 'laser');
      if (e.key === 'e') setTool(t => t === 'eraser' ? 'none' : 'eraser');
      if (e.key === 'c') clearAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toolStyle = (t) => ({
    padding: '0.25rem 0.5rem', fontSize: '0.75rem',
    background: tool === t ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
    color: tool === t ? 'white' : 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    cursor: 'pointer',
  });

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute', top: 0, left: 0,
          cursor: tool === 'none' ? 'default' : tool === 'laser' ? 'crosshair' : 'crosshair',
          pointerEvents: tool === 'none' ? 'none' : 'auto',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
      {laserPos && (
        <div style={{
          position: 'absolute', left: laserPos.x - 8, top: laserPos.y - 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'red', opacity: 0.8, pointerEvents: 'none',
          boxShadow: '0 0 10px 5px rgba(255,0,0,0.3)',
        }} />
      )}
      <div style={{
        position: 'absolute', bottom: -40, left: 0, display: 'flex', gap: '4px',
      }}>
        <button style={toolStyle('marker')} onClick={() => setTool(t => t === 'marker' ? 'none' : 'marker')}>Marker (M)</button>
        <button style={toolStyle('laser')} onClick={() => setTool(t => t === 'laser' ? 'none' : 'laser')}>Laser (L)</button>
        <button style={toolStyle('eraser')} onClick={() => setTool(t => t === 'eraser' ? 'none' : 'eraser')}>Eraser (E)</button>
        <button style={{ ...toolStyle('none'), background: 'var(--color-bg-secondary)' }} onClick={clearAll}>Clear (C)</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement PresenterPage.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import Timer from '../components/presenter/Timer';
import AnnotationCanvas from '../components/presenter/AnnotationCanvas';
import 'katex/dist/katex.min.css';

export default function PresenterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const startSlide = parseInt(searchParams.get('slide') || '0', 10);
  const [current, setCurrent] = useState(startSlide);
  const [fragmentIndex, setFragmentIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/presentations/${id}`).then(p => {
      const parsed = parsePresentation(p.content);
      setSlides(parsed.slides);
      setSettings(parsed.settings);
    }).catch(() => navigate('/'));
  }, [id]);

  const getFragments = useCallback((slideIndex) => {
    if (!slides[slideIndex]) return 0;
    const matches = slides[slideIndex].html.match(/data-fragment="(\d+)"/g);
    if (!matches) return 0;
    return Math.max(...matches.map(m => parseInt(m.match(/\d+/)[0])));
  }, [slides]);

  const goNext = useCallback(() => {
    const maxFrag = getFragments(current);
    if (fragmentIndex < maxFrag) {
      setFragmentIndex(f => f + 1);
    } else if (current < slides.length - 1) {
      setCurrent(c => c + 1);
      setFragmentIndex(0);
    }
  }, [current, fragmentIndex, slides.length, getFragments]);

  const goPrev = useCallback(() => {
    if (fragmentIndex > 0) {
      setFragmentIndex(f => f - 1);
    } else if (current > 0) {
      setCurrent(c => c - 1);
      setFragmentIndex(getFragments(current - 1));
    }
  }, [current, fragmentIndex, getFragments]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') navigate(`/edit/${id}`);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const getSlideHtml = (slide, fragIdx) => {
    if (!slide) return '';
    return slide.html.replace(/class="fragment"(\s+)data-fragment="(\d+)"/g, (match, space, num) => {
      return parseInt(num) <= fragIdx ? `class="fragment visible"${space}data-fragment="${num}"` : match;
    });
  };

  const currentSlide = slides[current];
  const nextSlide = slides[current + 1];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#2a2a2a', color: 'white',
      display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', padding: '1rem',
      overflow: 'hidden',
    }}>
      {/* Current slide (large) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{
          width: 960, height: 540,
          transform: 'scale(0.85)', transformOrigin: 'center center',
          position: 'relative',
        }}>
          {currentSlide && (
            <div
              className={`slide slide-style-${settings.style || 'modern'}`}
              dangerouslySetInnerHTML={{ __html: getSlideHtml(currentSlide, fragmentIndex) }}
              style={{ borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            />
          )}
          <AnnotationCanvas width={960} height={540} />
          {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
            <div className="slide-footer">
              <span>{settings.footer || ''}</span>
              <span>{current + 1} / {slides.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Next slide preview */}
        <div>
          <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem' }}>Next Slide</div>
          <div style={{ background: '#333', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {nextSlide ? (
              <div style={{ width: 320, height: 180, position: 'relative' }}>
                <div
                  className={`slide slide-style-${settings.style || 'modern'}`}
                  dangerouslySetInnerHTML={{ __html: nextSlide.html }}
                  style={{ transform: 'scale(0.333)', transformOrigin: 'top left', width: 960, height: 540 }}
                />
              </div>
            ) : (
              <div style={{ width: 320, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                End of presentation
              </div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div style={{ background: '#333', borderRadius: 'var(--radius)', padding: '1rem' }}>
          <Timer />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={goPrev} style={{ flex: 1 }}>Previous</button>
          <button className="btn-primary" onClick={goNext} style={{ flex: 1 }}>Next</button>
        </div>

        {/* Slide info */}
        <div style={{ fontSize: '0.85rem', color: '#999' }}>
          Slide {current + 1} of {slides.length}
          {getFragments(current) > 0 && ` | Fragment ${fragmentIndex}/${getFragments(current)}`}
        </div>

        {/* Controls help */}
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 'auto' }}>
          <div>Arrow keys / Space: Navigate</div>
          <div>M: Marker | L: Laser | E: Eraser | C: Clear</div>
          <div>Esc: Back to editor</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/PresenterPage.jsx src/components/presenter/
git commit -m "feat: presenter view with next slide preview, timer, annotation tools"
```

---

## Task 19: Logo Integration & Static Assets

**Files:**
- Copy logo to: `public/logo.png` and `public/logo.svg`

- [ ] **Step 1: Copy logo assets to public/**

```bash
cp "cdhandbuch/01-Logo/02-Sonderfall-nur-Buchenblatt/RGB-Digital/hs-fulda_logo_icon_gruen_72ppi.png" public/logo.png
cp "cdhandbuch/01-Logo/02-Sonderfall-nur-Buchenblatt/RGB-Digital/hs-fulda_logo_icon_gruen_RGB.svg" public/logo.svg
```

- [ ] **Step 2: Update Logo.jsx to use public asset**

```jsx
export default function Logo({ size = 32 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src="/logo.svg" alt="HS Fulda" height={size} style={{ objectFit: 'contain' }} />
      <span style={{ fontWeight: 800, fontSize: size * 0.5 }}>
        <span style={{ color: 'var(--color-primary)' }}>RZ</span>Presenter
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add public/logo.png public/logo.svg src/components/common/Logo.jsx
git commit -m "feat: integrate HS Fulda logo assets"
```

---

## Task 20: KaTeX CSS & Final Wiring

**Files:**
- Modify: `index.html` (add KaTeX CSS CDN or local)

- [ ] **Step 1: Import KaTeX CSS in index.css**

Add at top of `src/index.css`:
```css
@import 'katex/dist/katex.min.css';
```

- [ ] **Step 2: Add "type": "module" to package.json for ESM**

Ensure `package.json` has:
```json
"type": "module"
```

- [ ] **Step 3: Test full flow end-to-end**

1. `npm run dev:server` (terminal 1)
2. `npm run dev` (terminal 2)
3. Register a user
4. Create a presentation
5. Add markdown with `===` page breaks, colors, gradients, animations, fragments, LaTeX
6. Switch between editor/preview/split views
7. Open presenter view
8. Navigate slides, test fragment reveals
9. Test annotation tools (marker, laser, eraser)
10. Test timer (start, pause, reset, continue)

- [ ] **Step 4: Commit**

```bash
git add src/index.css package.json
git commit -m "feat: KaTeX CSS integration, final ESM wiring"
```

---

## Task 21: Docker Build & Deploy Test

- [ ] **Step 1: Build the frontend**

```bash
npm run build
```
Expected: `dist/` directory created with bundled React app.

- [ ] **Step 2: Test production server**

```bash
NODE_ENV=production node server/index.js
```
Expected: App accessible at http://localhost:3000 serving the built frontend.

- [ ] **Step 3: Test Docker build**

```bash
docker compose build
docker compose up -d
```
Expected: Container starts, app accessible at configured port.

- [ ] **Step 4: Verify data persistence**

```bash
docker compose down
docker compose up -d
```
Expected: Previously created users and presentations still exist (volume persisted).

- [ ] **Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: verify Docker build and deployment"
```

---

## Summary of Security Measures

| Threat | Mitigation |
|--------|-----------|
| XSS | markdown-it `html: false`, `sanitize()` on user inputs, helmet CSP headers |
| SQL Injection | Parameterized queries via better-sqlite3 prepared statements |
| Brute force | express-rate-limit on login (20/15min) and register (10/hr) |
| Session hijacking | httpOnly + sameSite cookies, secure flag in production |
| Password storage | bcryptjs with cost factor 12 |
| Path traversal | `path.basename()` on upload filenames, UUID filenames |
| CSRF | sameSite=lax cookies (same-origin API calls via fetch) |
| Data exposure | Data directory outside public, user scoped to own presentations |
| Admin privilege escalation | First-user-is-admin pattern, `requireAdmin` middleware |
