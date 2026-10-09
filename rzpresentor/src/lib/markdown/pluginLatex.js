import katex from 'katex';

export default function pluginLatex(md) {
  // Block: $$...$$
  md.block.ruler.before('fence', 'latex_block', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    if (state.src.slice(startPos, startPos + 2) !== '$$') return false;
    if (silent) return true;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      if (state.src.slice(pos, pos + 2) === '$$') break;
      nextLine++;
    }
    if (nextLine >= endLine) return false;

    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], false).trim();
    const token = state.push('latex_block', '', 0);
    token.content = content;
    token.map = [startLine, nextLine + 1];
    state.line = nextLine + 1;
    return true;
  });

  md.renderer.rules.latex_block = (tokens, idx) => {
    try {
      return `<div class="katex-block">${katex.renderToString(tokens[idx].content, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="katex-error">${tokens[idx].content}</div>`;
    }
  };

  // Inline: $...$
  md.inline.ruler.before('emphasis', 'latex_inline', (state, silent) => {
    if (state.src[state.pos] !== '$' || state.src[state.pos + 1] === '$') return false;
    const end = state.src.indexOf('$', state.pos + 1);
    if (end === -1) return false;
    if (silent) return true;

    const content = state.src.slice(state.pos + 1, end);
    const token = state.push('latex_inline', '', 0);
    token.content = content;
    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.latex_inline = (tokens, idx) => {
    try {
      return katex.renderToString(tokens[idx].content, { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tokens[idx].content}</span>`;
    }
  };
}
