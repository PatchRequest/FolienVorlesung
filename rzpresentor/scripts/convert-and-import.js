#!/usr/bin/env node
/**
 * convert-and-import.js
 *
 * Reads presenterm .md files from the parent directory, converts them to
 * rzpresentor format, and inserts/updates them in the SQLite database.
 *
 * Usage:
 *   node scripts/convert-and-import.js
 *
 * Environment:
 *   DB_PATH  — path to SQLite DB (default: ./data/rzpresenter.db)
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PARENT_DIR = path.resolve(PROJECT_ROOT, '..');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(PROJECT_ROOT, 'data', 'rzpresenter.db');

// ---------------------------------------------------------------------------
// File → presentation mapping
// ---------------------------------------------------------------------------

const FILE_MAP = [
  { file: 'slides.md',       title: 'Offensive Security',   slug: 'offensive-security'   },
  { file: 'intro.md',        title: 'Introduction',         slug: 'introduction'         },
  { file: 'ad.md',           title: 'Active Directory',     slug: 'active-directory'     },
  { file: 'c2.md',           title: 'Command & Control 101', slug: 'command-and-control' },
  { file: 'c2_deepdive.md',  title: 'Advanced C2',          slug: 'c2-deep-dive'         },
  { file: 'osint.md',        title: 'OSINT',                slug: 'osint'                },
  { file: 'physical.md',     title: 'Physical Pentesting',  slug: 'physical-security'    },
  { file: 'pivoting.md',     title: 'Pivoting',             slug: 'pivoting'             },
  { file: 'gamehacking.md',  title: 'Game Hacking',         slug: 'game-hacking'         },
  { file: 'web.md',          title: 'Web Hacking',          slug: 'web-hacking'          },
];

// ---------------------------------------------------------------------------
// Settings block prepended to every presentation
// ---------------------------------------------------------------------------

const SETTINGS_BLOCK = `---settings---
style: dracula
animation: fade
transition: slide
footer: Daniel Riebel — DHBW Mannheim
pageNumbers: true
logo: false
---/settings---`;

// ---------------------------------------------------------------------------
// Conversion logic
// ---------------------------------------------------------------------------

/**
 * Convert a presenterm markdown file to rzpresentor format.
 * @param {string} raw  Raw file contents
 * @returns {string}    Converted content
 */
function convert(raw) {
  let text = raw;

  // 1. Strip YAML front matter (--- ... ---)
  text = text.replace(/^---\n[\s\S]*?\n---\n?/, '');

  // 2. Remove <!-- font_size: N --> lines
  text = text.replace(/^[ \t]*<!--\s*font_size:[^>]*-->\s*\n?/gm, '');

  // 3. Replace <!-- end_slide --> with ===
  text = text.replace(/^[ \t]*<!--\s*end_slide\s*-->/gm, '===');

  // 4-6. Convert column layout directives to {columns} syntax
  // <!-- column_layout: [1, 1] --> → {columns}
  // <!-- column: 0 --> → (removed, first column is implicit)
  // <!-- column: 1 --> → |||
  // <!-- reset_layout --> → {/columns}
  text = text.replace(/^[ \t]*<!--\s*column_layout:\s*\[[^\]]*\]\s*-->\s*\n?/gm, '{columns}\n');
  text = text.replace(/^[ \t]*<!--\s*column:\s*0\s*-->\s*\n?/gm, '');
  text = text.replace(/^[ \t]*<!--\s*column:\s*1\s*-->\s*\n?/gm, '|||\n');
  text = text.replace(/^[ \t]*<!--\s*reset_layout\s*-->\s*\n?/gm, '{/columns}\n');

  // 7. Remove <!-- pause --> lines
  text = text.replace(/^[ \t]*<!--\s*pause\s*-->\s*\n?/gm, '');

  // 8. Remove <!-- incremental_lists: true --> and any remaining presenterm HTML comments
  text = text.replace(/^[ \t]*<!--[^>]*-->\s*\n?/gm, '');

  // 9. Strip +render from mermaid fences: ```mermaid +render → ```mermaid
  text = text.replace(/^([ \t]*```mermaid)\s*\+render/gm, '$1');

  // 9b. Fix invalid mermaid syntax within mermaid blocks:
  // <=> (presenterm bidirectional) → <<->> (mermaid v11 bidirectional)
  text = text.replace(/(```mermaid[\s\S]*?```)/g, (block) => {
    return block.replace(/<=>/g, '<<->>');
  });

  // 10. Clean excessive blank lines (4+ consecutive newlines → 2 newlines)
  text = text.replace(/\n{4,}/g, '\n\n');

  // 11. Auto-column: slides with short text + single trailing image get
  // wrapped in {columns} for side-by-side layout.
  const slideChunks = text.split('===');
  for (let si = 0; si < slideChunks.length; si++) {
    const s = slideChunks[si];
    if (s.includes('{columns}')) continue;
    // Match: heading + some text/list lines, then a single image at the end
    const m = s.match(/^(\s*)(## .+\n)([\s\S]*?)\n*(!\[(?:image:width:\d+%?)?\]\(images\/[^)]+\))\s*$/);
    if (m) {
      const [, indent, heading, bodyText, img] = m;
      // Count non-empty content lines (excluding the heading)
      const lines = bodyText.split('\n').filter(l => l.trim()).length;
      // Only auto-column if text is short enough and image is not mermaid
      if (lines >= 1 && lines <= 10 && !img.includes('mermaid_')) {
        slideChunks[si] = `\n${heading}\n{columns}\n${bodyText.trim()}\n\n|||\n\n${img}\n{/columns}\n`;
      }
    }
  }
  text = slideChunks.join('===');

  // 12. Trim leading/trailing whitespace
  text = text.trim();

  // 12. Prepend settings block
  text = SETTINGS_BLOCK + '\n\n' + text;

  return text;
}

// ---------------------------------------------------------------------------
// Post-conversion slide fixes
// Fixes overflow issues by splitting dense slides, adding column layouts,
// and reducing image widths for tall diagrams.
// ---------------------------------------------------------------------------

function postFixSlides(content, slug) {
  const slides = content.split('===');

  function replaceSlide(idx, newContent) {
    if (idx < slides.length) slides[idx] = newContent;
  }

  function splitSlide(idx, part1, part2) {
    if (idx < slides.length) {
      slides[idx] = part1;
      slides.splice(idx + 1, 0, part2);
    }
  }

  // Helper: wrap mermaid/image + text into columns
  function columnsLayout(heading, leftText, rightImg) {
    return `\n\n## ${heading}\n\n{columns}\n${leftText}\n\n|||\n\n${rightImg}\n{/columns}\n\n`;
  }

  if (slug === 'c2-deep-dive') {
    // Slide: Simplest Redirector — text + code image side by side
    const simpIdx = slides.findIndex(s => s.includes('Simplest Redirector') && s.includes('c2dd_01'));
    if (simpIdx > -1) replaceSlide(simpIdx, columnsLayout(
      'Simplest Redirector',
      "Simplest Redirector (Don't Use This)\n\nThis forwards everything to your C2 — no filtering at all. Anyone who visits your redirector reaches your teamserver.\n\nThis is only useful for understanding the syntax. Never deploy this in an actual operation.",
      '![image:width:90%](images/c2dd_01.png)'
    ));

    // Slide: APT Tradecraft — split into two
    const aptIdx = slides.findIndex(s => s.includes('Real-World APT Tradecraft') && s.includes('APT29'));
    if (aptIdx > -1) {
      splitSlide(aptIdx,
        '\n\n## Real-World APT Tradecraft (1/2)\nAPT29 (Cozy Bear / Russia)\n- C2 via Twitter and GitHub\n- Commands encoded in social media posts\n\nAPT37 (Reaper / North Korea)\n- Cloud-based C2 using Dropbox, pCloud, Mediafire\n- Multi-platform redundancy\n\n',
        '\n\n## Real-World APT Tradecraft (2/2)\nAPT41 (Winnti / China)\n- Dead drop resolvers on GitHub, Pastebin, Microsoft TechNet\n- Comments sections for C2 addresses\n\nVolt Typhoon (China)\n- Combined LOTL + LOTS\n- Years of undetected access to critical infrastructure\n- Minimal custom tooling\n\n'
      );
    }

    // Slide: Good Redirector — image + text side by side
    const goodIdx = slides.findIndex(s => s.includes('What makes a good redirector') && s.includes('c2dd_21'));
    if (goodIdx > -1) replaceSlide(goodIdx, columnsLayout(
      'What makes a good redirector',
      "A good redirector isn't just a proxy.",
      '![image:width:90%](images/c2dd_21.png)'
    ));

    // Slide: Blending Look Legitimate
    const blendIdx = slides.findIndex(s => s.includes('Blending Look Legitimate') && s.includes('c2dd_23'));
    if (blendIdx > -1) replaceSlide(blendIdx, columnsLayout(
      'Blending Look Legitimate',
      'Your redirector should look like something that belongs on the network',
      '![image:width:90%](images/c2dd_23.png)'
    ));

    // Slide: Fresh Domains — split
    const freshIdx = slides.findIndex(s => s.includes('Why Fresh Domains Get Caught') && s.includes('Security tools check'));
    if (freshIdx > -1) {
      splitSlide(freshIdx,
        '\n\n## Why Fresh Domains Get Caught\nThreat intel feeds flag:\n- Recently registered domains (WHOIS data)\n- Domains with no history\n- Domains with no backlinks\n- Domains with no traffic baseline\n- Domains not categorized\n\n',
        '\n\n## Why Fresh Domains Get Caught (cont.)\nSecurity tools check:\n- Domain age in DNS lookups\n- Reputation scores (Cisco Umbrella, Zscaler, etc.)\n- Category (Uncategorized = suspicious)\n- SSL certificate age\n\n'
      );
    }

    // All mermaid+text slides: wrap in columns
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.includes('{columns}')) continue; // already has columns
      const m = s.match(/^\s*## (.+)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\n\n(.+[\s\S]*?)\s*$/);
      if (m) {
        const [, title, img, text] = m;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) {
          replaceSlide(i, columnsLayout(title, text.trim(), img));
        }
      }
      // Also: text then mermaid image
      const m2 = s.match(/^\s*## (.+)\n\n([\s\S]+?)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\s*$/);
      if (m2 && !s.includes('{columns}')) {
        const [, title, text, img] = m2;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) {
          replaceSlide(i, columnsLayout(title, text.trim(), img));
        }
      }
    }

    // Tall mermaid-only slides: reduce width
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.includes('{columns}')) continue;
      const m = s.match(/^\s*## (.+)\n\n!\[\]\(images\/mermaid_[^)]+\.svg\)\s*$/);
      if (m) {
        const img = s.match(/!\[\]\(images\/mermaid_[^)]+\.svg\)/)[0];
        replaceSlide(i, `\n\n## ${m[1]}\n\n${img.replace('![]', '![image:width:50%]')}\n\n`);
      }
    }
  }

  if (slug === 'active-directory') {
    // Mermaid+text slides: auto-detect and wrap in columns
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.includes('{columns}')) continue;
      // Pattern: heading, mermaid image, short text
      const m = s.match(/^\s*## (.+)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\n\n([\s\S]+?)\s*$/);
      if (m) {
        const [, title, img, text] = m;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
      // Pattern: heading, short text, mermaid image
      const m2 = s.match(/^\s*## (.+)\n\n([\s\S]+?)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\s*$/);
      if (m2 && !s.includes('{columns}')) {
        const [, title, text, img] = m2;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
    }
  }

  if (slug === 'command-and-control') {
    // Auto-detect mermaid+text overflow patterns
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.includes('{columns}')) continue;
      // Mermaid then text
      const m = s.match(/^\s*## (.+)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\n\n([\s\S]+?)\s*$/);
      if (m) {
        const [, title, img, text] = m;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
      // Text then mermaid
      const m2 = s.match(/^\s*## (.+)\n\n([\s\S]+?)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\s*$/);
      if (m2 && !s.includes('{columns}')) {
        const [, title, text, img] = m2;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
      // Lone tall mermaid
      const m3 = s.match(/^\s*## (.+)\n\n!\[\]\(images\/mermaid_[^)]+\.svg\)\s*$/);
      if (m3 && !s.includes('{columns}')) {
        const img = s.match(/!\[\]\(images\/mermaid_[^)]+\.svg\)/)[0];
        replaceSlide(i, `\n\n## ${m3[1]}\n\n${img.replace('![]', '![image:width:50%]')}\n\n`);
      }
      // Tall regular images (only heading + image, no text)
      const m4 = s.match(/^\s*## (.+)\n\n!\[\]\(images\/c2_\d+\.\w+\)\s*$/);
      if (m4) {
        const img = s.match(/!\[\]\(images\/c2_\d+\.\w+\)/)[0];
        replaceSlide(i, `\n\n## ${m4[1]}\n\n${img.replace('![]', '![image:width:70%]')}\n\n`);
      }
    }

    // Trim specific verbose column slides
    const opSecIdx = slides.findIndex(s => s.includes('Enhancing Stealth with Proxies'));
    if (opSecIdx > -1 && slides[opSecIdx].includes('{columns}')) {
      // Already in columns from conversion, just ensure text is trimmed
    }
  }

  if (slug === 'game-hacking') {
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.includes('{columns}')) continue;
      const m = s.match(/^\s*## (.+)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\n\n([\s\S]+?)\s*$/);
      if (m) {
        const [, title, img, text] = m;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
      const m2 = s.match(/^\s*## (.+)\n\n([\s\S]+?)\n\n(!\[(?:image:width:\d+%?)?\]\(images\/mermaid_[^)]+\))\s*$/);
      if (m2 && !s.includes('{columns}')) {
        const [, title, text, img] = m2;
        const lines = text.trim().split('\n').filter(l => l.trim()).length;
        if (lines <= 5) replaceSlide(i, columnsLayout(title, text.trim(), img));
      }
      const m3 = s.match(/^\s*## (.+)\n\n!\[\]\(images\/mermaid_[^)]+\.svg\)\s*$/);
      if (m3 && !s.includes('{columns}')) {
        const img = s.match(/!\[\]\(images\/mermaid_[^)]+\.svg\)/)[0];
        replaceSlide(i, `\n\n## ${m3[1]}\n\n${img.replace('![]', '![image:width:50%]')}\n\n`);
      }
    }
  }

  if (slug === 'osint') {
    // Split: Search Operator Cheatsheet + The Cool Search Engines
    const searchIdx = slides.findIndex(s => s.includes('Search Operator Cheatsheet') && s.includes('cool search engines'));
    if (searchIdx > -1) {
      const parts = slides[searchIdx].split(/\n## The [Cc]ool [Ss]earch [Ee]ngines/);
      if (parts.length === 2) {
        splitSlide(searchIdx, parts[0].trim() + '\n\n', '\n\n## The Cool Search Engines\n' + parts[1].trim() + '\n\n');
      }
    }

    // Split: Username and Email Recon + Hidden Data
    const userIdx = slides.findIndex(s => s.includes('Username and Email Recon') && s.includes('Hidden Data'));
    if (userIdx > -1) {
      const parts = slides[userIdx].split(/\n## Hidden Data/);
      if (parts.length === 2) {
        splitSlide(userIdx, parts[0].trim() + '\n\n', '\n\n## Hidden Data' + parts[1].trim() + '\n\n');
      }
    }

    // Trim: Communities are real
    const commIdx = slides.findIndex(s => s.includes('Communities are real') && s.includes('{columns}'));
    if (commIdx > -1) {
      replaceSlide(commIdx, columnsLayout(
        'Communities are real',
        '- Mutual connections form visible clusters\n- Engagement patterns show who interacts with whom\n- Group membership reveals shared interests\n- Interaction frequency indicates relationship strength\n- You can map all of this manually',
        slides[commIdx].match(/!\[.*?\]\(images\/[^)]+\)/)?.[0] || ''
      ));
    }
  }

  return slides.join('===');
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

function openDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: Database not found at ${DB_PATH}`);
    console.error('Make sure the server has been started at least once to initialise the DB.');
    process.exit(1);
  }
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function getAdminUser(db) {
  const user = db.prepare(
    'SELECT id FROM users WHERE is_admin = 1 ORDER BY created_at ASC LIMIT 1'
  ).get();
  if (!user) {
    console.error('Error: No admin user found in the database.');
    console.error('Please register the first user via the web UI before running this script.');
    process.exit(1);
  }
  return user;
}

function slugExists(db, slug) {
  const row = db.prepare('SELECT id FROM presentations WHERE slug = ?').get(slug);
  return row ? row.id : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const db = openDb();
const admin = getAdminUser(db);

const upsert = db.prepare(`
  INSERT INTO presentations (id, user_id, title, content, slug, public, created_at, updated_at)
  VALUES (@id, @user_id, @title, @content, @slug, 1, datetime('now'), datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    title      = excluded.title,
    content    = excluded.content,
    public     = 1,
    updated_at = datetime('now')
`);

for (const { file, title, slug } of FILE_MAP) {
  const filePath = path.join(PARENT_DIR, file);

  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping (not found): ${file}`);
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const converted = convert(raw);
  const content = postFixSlides(converted, slug);

  const existingId = slugExists(db, slug);
  const id = existingId ?? uuidv4();

  upsert.run({ id, user_id: admin.id, title, content, slug });
  console.log(`Imported: ${title} → /view/${slug}`);
}

db.close();
console.log('Done.');
