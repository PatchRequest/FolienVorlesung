export default function pluginImageWidth(md) {
  const defaultRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx];

    // Fix relative image paths: images/foo.png → /images/foo.png
    const src = token.attrGet('src');
    if (src && src.startsWith('images/')) {
      token.attrSet('src', '/' + src);
    }

    // Handle width syntax: ![image:width:NN%](url)
    const alt = token.children ? token.children.map(c => c.content).join('') : '';
    const match = alt.match(/^image:width:(\d+%?)$/);
    if (match) {
      token.attrSet('style', `max-width: ${match[1]}; height: auto;`);
      token.children = [];
    }

    return defaultRender(tokens, idx, options, env, self);
  };
}
