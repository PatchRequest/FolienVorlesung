// Markdown-it plugin: two-column layout
// Converts {columns} ... ||| ... {/columns} in rendered HTML.
// Works as a post-render transform on the HTML string.

export default function pluginColumns(md) {
  const originalRender = md.render.bind(md);

  md.render = function (src, env) {
    let html = originalRender(src, env);

    // Replace {columns} / ||| / {/columns} markers in the rendered HTML.
    // These end up as text inside <p> tags after markdown-it processes them.

    // Opening: <p>{columns}</p> or {columns} inside a <p> with other content
    html = html.replace(/<p>\s*\{columns\}\s*<\/p>/gi,
      '<div class="slide-columns"><div class="slide-col">');

    // Also handle {columns} at start of a <p> with trailing content
    html = html.replace(/<p>\s*\{columns\}\s*<br>\s*/gi,
      '<div class="slide-columns"><div class="slide-col"><p>');

    // Separator: <p>|||</p>
    html = html.replace(/<p>\s*\|\|\|\s*<\/p>/gi,
      '</div><div class="slide-col">');

    // Separator inside a <p>: ...<br>\n|||<br>\n...
    html = html.replace(/<br>\s*\|\|\|\s*<br>/gi,
      '</p></div><div class="slide-col"><p>');

    // Closing: <p>{/columns}</p>
    html = html.replace(/<p>\s*\{\/columns\}\s*<\/p>/gi,
      '</div></div>');

    // Also handle {/columns} at end of a <p> with preceding content
    html = html.replace(/\s*<br>\s*\{\/columns\}\s*<\/p>/gi,
      '</p></div></div>');

    return html;
  };
}
