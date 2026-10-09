// markdown-it plugin for {size:VALUE}text{/size}
// VALUE can be: 12px, 1.5em, 2rem, etc.
export default function pluginFontSize(md) {
  const OPEN_RE = /\{size:([^}]+)\}/;
  const CLOSE_RE = /\{\/size\}/;

  md.inline.ruler.before('emphasis', 'fontsize_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('fontsize_open', 'span', 1);
    token.attrSet('style', `font-size:${match[1]}`);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'fontsize_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('fontsize_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
