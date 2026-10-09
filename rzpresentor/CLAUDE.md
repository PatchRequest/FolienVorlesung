# CLAUDE.md

## Project Overview

RZPresenter is a lightweight, Hedgedoc-inspired presentation tool where slides are authored in markdown. Built for Hochschule Fulda using their corporate design.

## Tech Stack

- **Backend:** Node.js, Express 5, better-sqlite3, bcryptjs, express-session
- **Frontend:** React 18, Vite, CodeMirror 6, React Router v6
- **Markdown:** markdown-it with 8 custom plugins (color, gradient, animation, fragment, embed, LaTeX, fontSize, fontFamily)
- **Deploy:** Docker Compose, single container, GitHub Actions CI for image builds

## Project Structure

```
server/           # Express backend (ESM)
  config.js       # Environment config via dotenv
  db/             # SQLite connection + migrations
  middleware/     # auth (requireAuth/requireAdmin), security (helmet, rate-limit)
  routes/         # auth, admin, presentations, uploads
  utils/          # validation + sanitization
src/              # React frontend
  api/            # fetch wrapper
  components/     # editor/, preview/, presenter/, common/
    editor/       # MarkdownEditor, EditorToolbar, ColorPicker, AngleDial, SettingsPanel, ViewToggle
    preview/      # SlidePreview (auto-fit), SlideList (fixed-size thumbnails)
    presenter/    # Timer, AnnotationCanvas (offscreen canvas for non-stacking marker)
    common/       # Layout, ProtectedRoute, Logo
  context/        # AuthContext
  lib/            # markdown/ (parser + 8 plugins), slideParser, useAutoFit hook, CSS
  pages/          # Login, Register, Dashboard, Editor, Present, Presenter, Preview, Admin
public/           # fonts (Nunito Sans), logo.svg/logo.png (favicon + app icon)
cdhandbuch/       # Corporate design assets (gitignored, local only)
data/             # SQLite DB + uploads (gitignored, Docker volume)
```

## Development

```bash
# Install dependencies
npm install

# Run backend (port 3000)
npm run dev:server

# Run frontend (port 5173, proxies /api to backend)
npm run dev

# Production build
npm run build && npm start

# Docker
docker compose up --build
```

## Key Conventions

- ESM throughout (`"type": "module"` in package.json)
- All API routes under `/api/` prefix
- Session-based auth with SQLite session store, rolling sessions
- Slides separated by `===` in markdown
- Settings block: `---settings---` / `---/settings---`
- Custom markdown syntax: `{color:}`, `{gradient:color1,color2,ANGLEdeg}`, `{anim:}`, `{fragment:}`, `{size:}`, `{font:}`, `@[youtube](url)`
- First registered user becomes admin
- Data directory (`./data/`) is outside webserver public scope
- Corporate design: Nunito Sans font, `#72BF44` green accent, `#000000` text, `#F4F1F2` gray
- `cdhandbuch/` is gitignored -- contains original CD assets, not needed at runtime
- Toolbar groups: Font/Format are direct controls; Heading, Color, Motion, Insert are dropdowns
- Slide preview auto-scales to fit container (ResizeObserver) and auto-shrinks text on overflow (useAutoFit)
- Presenter annotations use offscreen canvas for non-stacking transparent marker
- Pop-out preview syncs via BroadcastChannel
- Keep-alive ping every 5 min during presentation to prevent session expiry
- Presenter fullscreen mode (F key) hides panel, scales slide to viewport; Esc exits fullscreen first, then editor
- useEffect dependency arrays must include all state read inside the handler (stale closure pitfall)

## Security

- Passwords hashed with bcryptjs (cost 12)
- User IDs are UUIDs
- HTML disabled in markdown-it (`html: false`)
- Parameterized SQL queries (no string concatenation)
- Rate limiting on auth endpoints
- Helmet CSP headers
- Path traversal protection on uploads
- sameSite + rolling cookies for CSRF protection

## Environment Variables

See `.env.example` for all options. Key ones:
- `PORT` - Server port (default 3000)
- `SESSION_SECRET` - Session encryption key
- `DB_PATH` - SQLite database path
- `ALLOW_REGISTRATION` - Enable/disable user registration
- `COOKIE_SECURE` - Set `true` behind HTTPS proxy
