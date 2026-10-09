export default function pluginAnimation(md) {
  const OPEN_RE = /\{anim:([a-zA-Z]+)\}/;
  const CLOSE_RE = /\{\/anim\}/;

  md.inline.ruler.before('emphasis', 'anim_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const token = state.push('anim_open', 'span', 1);
    token.attrSet('class', `anim anim-${match[1]}`);
    token.attrSet('data-animation', match[1]);
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'anim_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('anim_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
