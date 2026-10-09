#!/usr/bin/env node
/**
 * Pre-renders mermaid code blocks in presentation markdown to SVG files,
 * replacing the ```mermaid blocks with image references.
 *
 * Usage:
 *   node scripts/render-mermaid.js            # all presentations
 *   node scripts/render-mermaid.js <slug>...  # only the given presentations
 *
 * SVG files are named after a hash of the diagram source
 * (mermaid_<slug>_<hash>.svg), so new diagrams never overwrite the SVG of an
 * already rendered diagram and re-rendering the same source is idempotent.
 *
 * The content update is a compare-and-set: if the presentation was edited
 * while rendering, it is left untouched and reported, so no edit is lost.
 */

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = process.env.IMAGES_DIR || path.resolve(PROJECT_ROOT, '..', 'images');
const DB_PATH = process.env.DB_PATH || path.join(PROJECT_ROOT, 'data', 'rzpresenter.db');
// execFileSync is safe against shell injection — arguments are passed as an array
const MMDC = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'mmdc');

// Crop SVG to its actual content by adjusting width/height and viewBox
function cropSvg(filePath) {
  let svg = fs.readFileSync(filePath, 'utf-8');

  // mmdc outputs SVGs with a large viewBox but the diagram may be smaller.
  // Parse the SVG, find all elements' bounds via the viewBox and actual content,
  // and tighten the viewBox. We do this by finding the svg dimensions and
  // setting width/height to match the viewBox aspect ratio tightly.

  // Extract current viewBox
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return;

  // Remove any hardcoded width/height with large values, keep viewBox
  // The key fix: set width and height to match the viewBox dimensions
  const parts = vbMatch[1].split(/\s+/).map(Number);
  if (parts.length !== 4) return;
  const [, , vbW, vbH] = parts;

  // Replace width="..." and height="..." on the <svg> tag to match viewBox
  svg = svg.replace(/<svg([^>]*)width="[^"]*"/, `<svg$1width="${vbW}"`);
  svg = svg.replace(/<svg([^>]*)height="[^"]*"/, `<svg$1height="${vbH}"`);

  // Also remove any style="max-width:..." that mmdc adds
  svg = svg.replace(/style="[^"]*max-width:[^"]*"/, '');

  fs.writeFileSync(filePath, svg);
}

// Mermaid config for Dracula theme
const MERMAID_CONFIG = {
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#282a36',
    primaryColor: '#bd93f9',
    primaryTextColor: '#f8f8f2',
    primaryBorderColor: '#6272a4',
    secondaryColor: '#44475a',
    tertiaryColor: '#44475a',
    lineColor: '#6272a4',
    textColor: '#f8f8f2',
    mainBkg: '#44475a',
    nodeBorder: '#6272a4',
    clusterBkg: '#282a36',
    titleColor: '#f8f8f2',
    edgeLabelBackground: '#282a36',
  },
  flowchart: { useMaxWidth: false, htmlLabels: true, padding: 20 },
  sequence: { useMaxWidth: false },
};

// Per-run scratch directory, so concurrent runs never share temp files
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-mermaid-'));
const configPath = path.join(workDir, 'mermaid-config.json');
fs.writeFileSync(configPath, JSON.stringify(MERMAID_CONFIG));

const slugFilter = process.argv.slice(2);
const db = new Database(DB_PATH);
const presentations = db.prepare('SELECT id, slug, content FROM presentations').all()
  .filter((pres) => slugFilter.length === 0 || slugFilter.includes(pres.slug));

const unknownSlugs = slugFilter.filter((slug) => !presentations.some((pres) => pres.slug === slug));
for (const slug of unknownSlugs) console.warn(`Unknown slug: ${slug}`);

const updateContent = db.prepare(
  "UPDATE presentations SET content = ?, updated_at = datetime('now') WHERE id = ? AND content = ?"
);

let totalRendered = 0;
let failed = unknownSlugs.length > 0;

for (const pres of presentations) {
  const original = pres.content;
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;

  // Render every block; collect replacements and only apply them all at once
  const replacements = new Map();
  let match;
  while ((match = mermaidRegex.exec(original)) !== null) {
    if (replacements.has(match[0])) continue;
    const source = match[1].trim();
    const hash = createHash('sha256').update(source).digest('hex').slice(0, 10);
    const filename = `mermaid_${pres.slug}_${hash}.svg`;
    const outputPath = path.join(IMAGES_DIR, filename);
    const inputPath = path.join(workDir, `${hash}.mmd`);

    try {
      fs.writeFileSync(inputPath, source);
      execFileSync(MMDC, [
        '-i', inputPath,
        '-o', outputPath,
        '-c', configPath,
        '-b', '#282a36',
        '--quiet',
      ], { timeout: 30000 });

      // Crop the SVG to fit its content tightly
      cropSvg(outputPath);

      replacements.set(match[0], `![](images/${filename})`);
      totalRendered++;
      console.log(`  Rendered: ${filename}`);
    } catch (err) {
      failed = true;
      console.warn(`  Failed to render mermaid block in ${pres.slug}: ${err.message}`);
    }
  }

  if (replacements.size === 0) continue;

  let content = original;
  for (const [block, imgTag] of replacements) content = content.split(block).join(imgTag);

  const { changes } = updateContent.run(content, pres.id, original);
  if (changes === 1) {
    console.log(`Updated: ${pres.slug} (${replacements.size} diagrams)`);
  } else {
    failed = true;
    console.warn(`Skipped: ${pres.slug} was modified during rendering, run again`);
  }
}

fs.rmSync(workDir, { recursive: true, force: true });
db.close();
console.log(`\nDone! Rendered ${totalRendered} mermaid diagrams to SVG.`);
if (failed) process.exitCode = 1;
