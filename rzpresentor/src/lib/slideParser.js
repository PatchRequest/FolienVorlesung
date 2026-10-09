import md from './markdown/parser.js';

const SETTINGS_RE = /^---settings---\n([\s\S]*?)\n---\/settings---/;

const DEFAULT_SETTINGS = {
  style: 'dracula',
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
