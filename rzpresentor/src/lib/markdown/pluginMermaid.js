// Markdown-it plugin: renders ```mermaid blocks as <div class="mermaid">
// instead of <pre><code>, so mermaid.js can process them client-side.
export default function pluginMermaid(md) {
  const defaultFence = md.renderer.rules.fence;

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info.trim().toLowerCase();

    if (info === 'mermaid') {
      // Mermaid reads diagram source via element.textContent, so we must
      // HTML-escape the content to prevent the browser from interpreting
      // characters like < > as HTML tags. When mermaid reads textContent,
      // the browser automatically decodes entities back to raw characters.
      // Security: mermaid securityLevel:'strict' + markdown-it html:false.
      const raw = token.content.trim();
      const escaped = md.utils.escapeHtml(raw);
      return `<div class="mermaid">${escaped}</div>`;
    }

    // Fall through to default fence rendering for other languages
    if (defaultFence) {
      return defaultFence(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };
}
