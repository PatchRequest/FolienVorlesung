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
