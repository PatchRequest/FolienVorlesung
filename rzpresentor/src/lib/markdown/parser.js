import MarkdownIt from 'markdown-it';
import pluginColor from './pluginColor.js';
import pluginGradient from './pluginGradient.js';
import pluginAnimation from './pluginAnimation.js';
import pluginFragment from './pluginFragment.js';
import pluginEmbed from './pluginEmbed.js';
import pluginLatex from './pluginLatex.js';
import pluginFontSize from './pluginFontSize.js';
import pluginFontFamily from './pluginFontFamily.js';
import pluginImageWidth from './pluginImageWidth.js';
import pluginMermaid from './pluginMermaid.js';
import pluginColumns from './pluginColumns.js';

const md = new MarkdownIt({
  html: false,       // Disable raw HTML for security (XSS prevention)
  linkify: true,      // Auto-link URLs
  typographer: true,  // Smart quotes
  breaks: true,       // Newlines become <br>
});

md.use(pluginColor);
md.use(pluginGradient);
md.use(pluginAnimation);
md.use(pluginFragment);
md.use(pluginEmbed);
md.use(pluginLatex);
md.use(pluginFontSize);
md.use(pluginFontFamily);
md.use(pluginImageWidth);
md.use(pluginMermaid);
md.use(pluginColumns);

export default md;
