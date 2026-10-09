export default function pluginGradient(md) {
  // Supports: {gradient:color1,color2} and {gradient:color1,color2,ANGLEdeg}
  const OPEN_RE = /\{gradient:([^,}]+),([^,}]+)(?:,(\d+)deg)?\}/;
  const CLOSE_RE = /\{\/gradient\}/;

  md.inline.ruler.before('emphasis', 'gradient_open', (state, silent) => {
    const match = state.src.slice(state.pos).match(OPEN_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    const angle = match[3] || '90';
    const token = state.push('gradient_open', 'span', 1);
    token.attrSet('style',
      `background: linear-gradient(${angle}deg, ${match[1]}, ${match[2]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
    );
    token.markup = match[0];
    state.pos += match[0].length;
    return true;
  });

  md.inline.ruler.before('emphasis', 'gradient_close', (state, silent) => {
    const match = state.src.slice(state.pos).match(CLOSE_RE);
    if (!match || match.index !== 0) return false;
    if (silent) return true;

    state.push('gradient_close', 'span', -1);
    state.pos += match[0].length;
    return true;
  });
}
