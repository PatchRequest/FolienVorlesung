// markdown-it plugin for {font:FAMILY}text{/font}
export default function pluginFontFamily(md) {
  const OPEN_RE = /\{font:([^}]+)\}/;
  const CLOSE_RE = /\{\/font\}/;

  md.inline.ruler.before('emphasis', 'fontfamily_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('fontfamily_open', 'span', 1);
    token.attrSet('style', `font-family:${match[1]}`);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'fontfamily_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('fontfamily_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
