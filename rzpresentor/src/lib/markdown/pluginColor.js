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
