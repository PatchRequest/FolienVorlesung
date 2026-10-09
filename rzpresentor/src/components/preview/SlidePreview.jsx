import { useRef, useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import useMermaid from '../../lib/useMermaid';

export default function SlidePreview({ html: rawHtml, settings, index, total, scale = 1 }) {
  const styleClass = `slide slide-style-${settings.style || 'modern'}`;
  const contentRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);
  const html = useMermaid(rawHtml);

  // Auto-shrink text when content overflows the slide
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Reset scale to measure true content height
    el.style.transform = 'none';
    const available = el.clientHeight;
    const needed = el.scrollHeight;

    if (needed > available && available > 0) {
      // Leave a small margin (0.95) so content doesn't sit flush against the edge
      const ratio = Math.max((available / needed) * 0.95, 0.4);
      setFitScale(ratio);
    } else {
      setFitScale(1);
    }
  }, [html, settings.style]);

  return (
    <div style={{
      width: 960, height: 540,
      transform: `scale(${scale})`, transformOrigin: 'top left',
      boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div
        ref={contentRef}
        className={styleClass}
        dangerouslySetInnerHTML={{ __html: html }}
        style={fitScale < 1 ? {
          transformOrigin: 'top left',
          transform: `scale(${fitScale})`,
          width: `${100 / fitScale}%`,
          height: `${100 / fitScale}%`,
        } : undefined}
      />
      {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
        <div className="slide-footer">
          <span>{settings.footer || ''}</span>
          <span>{index + 1} / {total}</span>
        </div>
      )}
    </div>
  );
}
