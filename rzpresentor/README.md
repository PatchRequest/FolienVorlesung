# RZPresenter

A lightweight markdown-based presentation tool inspired by Hedgedoc. Create, edit, and present slides using an extended markdown syntax with rich formatting, animations, and LaTeX support.

## Quick Start

```bash
npm install
cp .env.example .env

# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173 and log in.

**Default credentials:** `admin` / `admin`

The repository ships with a pre-populated SQLite database containing all lecture slides. The default account has admin privileges.

### Docker

```bash
cp .env.example .env
# Edit .env with your SESSION_SECRET
docker compose up --build
```

Access at http://localhost:3000

Or pull the pre-built image:

```bash
docker pull ghcr.io/etlon/rzpresentor:latest
```

### Production

```bash
npm install
npm run build
cp .env.example .env
# Edit .env with production values
node server/index.js
```

## Features

### Editor
- **Three view modes:** Editor only, Preview only, Side-by-side
- **CodeMirror 6** markdown editor with syntax highlighting and autocomplete
- **Toolbar** with dropdown menus (Heading, Color, Motion, Insert) and direct controls (Font, Size, Bold, Italic)
- **Color picker** with preset swatches and live preview
- **Gradient editor** with two-color picker and circular angle dial
- **Font size & family** per word
- **Auto-save** with 1.5s debounce
- **Pop-out preview** in a separate browser tab with live sync via BroadcastChannel
- **Responsive preview** that scales to fit available space
- **Auto-shrink** text when slide content overflows the canvas
- **Slide thumbnails** with fixed-size cards and scrollbar

### Markdown Extensions

| Syntax | Result |
|--------|--------|
| `{color:#ff0000}text{/color}` | Colored text |
| `{gradient:#72BF44,#6EB2F7}text{/gradient}` | Gradient text (default 90deg) |
| `{gradient:#72BF44,#6EB2F7,45deg}text{/gradient}` | Gradient with custom angle |
| `{anim:fadeIn}text{/anim}` | Animated text (fadeIn, bounceIn, typewriter, etc.) |
| `{fragment:1}text{/fragment}` | Progressive reveal (click to show) |
| `{size:32px}text{/size}` | Custom font size |
| `{font:Georgia}text{/font}` | Custom font family |
| `{columns}left \|\|\| right{/columns}` | Two-column layout |
| `@[youtube](URL)` | Embedded YouTube video |
| `$E=mc^2$` | Inline LaTeX |
| `$$\sum_{i=1}^n$$` | Block LaTeX |
| `===` | Page break (new slide) |

### Slide Settings

```
---settings---
style: dracula
animation: fade
transition: slide
footer: My Presentation
pageNumbers: true
logo: false
---/settings---
```

Themes: `modern`, `minimal`, `dark`, `dracula`

### Presenter Mode
- **Current slide** (large) + **next slide** preview
- **Timer** with start/pause/reset/continue
- **Annotation tools:** Marker (M), Laser pointer (L), Eraser (E), Clear (C)
- **Fragment reveals** with keyboard navigation
- Session keep-alive prevents logout during long presentations

### Presentation Mode
- Fullscreen slides scaled to viewport
- Keyboard navigation (arrows, space, escape, F for fullscreen)
- Fragment progressive reveal
- Auto-shrink text on overflow

### Mermaid Diagrams

Mermaid code blocks in slide markdown are pre-rendered to SVG for reliable display. Run the renderer with:

```bash
node scripts/render-mermaid.js            # all presentations
node scripts/render-mermaid.js <slug>...  # specific presentations
```

SVGs are written to the `images/` directory (sibling to this project by default, configurable via `IMAGES_DIR`).

### User Management
- First registered user becomes admin
- **Admin panel:** reset passwords, lock/unlock accounts, disable registration

## Configuration

All settings via `.env` file (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | - | Session encryption key (required) |
| `DB_PATH` | `./data/rzpresenter.db` | SQLite database location |
| `IMAGES_DIR` | `../images` (relative to project) | Slide images served under `/images` |
| `UPLOAD_DIR` | `./data/uploads` | Image upload directory |
| `MAX_UPLOAD_SIZE_MB` | `10` | Max upload file size |
| `ALLOW_REGISTRATION` | `true` | Allow new user registration |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS proxy |

## Tech Stack

- **Backend:** Node.js, Express 5, SQLite (better-sqlite3)
- **Frontend:** React 18, Vite, CodeMirror 6
- **Markdown:** markdown-it + 8 custom plugins
- **Math:** KaTeX
- **Auth:** bcryptjs, express-session
- **Deploy:** Docker Compose, GitHub Actions CI

## License

MIT
