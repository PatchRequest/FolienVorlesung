// Extract YouTube video ID from various URL formats or a bare ID
function extractYouTubeId(input) {
  const trimmed = input.trim();
  // youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  // bare ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

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
    const videoId = extractYouTubeId(tokens[idx].content);
    if (!videoId) {
      return `<div class="embed-container"><span style="color:red">Invalid YouTube URL</span></div>`;
    }
    return `<div class="embed-container"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
  };
}
