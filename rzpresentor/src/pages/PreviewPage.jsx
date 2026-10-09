import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { parsePresentation } from '../lib/slideParser';
import useMermaid from '../lib/useMermaid';
import 'katex/dist/katex.min.css';

export default function PreviewPage() {
  const { id } = useParams();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const [current, setCurrent] = useState(0);

  // Listen for content updates from the editor tab
  useEffect(() => {
    const channel = new BroadcastChannel(`rzpresenter-${id}`);
    channel.onmessage = (e) => {
      if (e.data.type === 'content-update') {
        const parsed = parsePresentation(e.data.content);
        setSlides(parsed.slides);
        setSettings(parsed.settings);
      }
      if (e.data.type === 'slide-change') {
        setCurrent(e.data.index);
      }
    };
    // Request initial content from editor
    channel.postMessage({ type: 'request-content' });
    return () => channel.close();
  }, [id]);

  const goNext = useCallback(() => {
    setCurrent(c => Math.min(c + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent(c => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const slide = slides[current];
  const slideHtml = useMermaid(slide?.html);

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: settings.style === 'dark' ? '#1a1a1a' : '#f0f0f0',
    }}>
      {/* Slide area */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        {slide ? (
          <div style={{
            width: 960, height: 540,
            transform: `scale(${Math.min(window.innerWidth / 960, (window.innerHeight - 40) / 540)})`,
            transformOrigin: 'center center',
            position: 'relative',
          }}>
            <div
              className={`slide slide-style-${settings.style || 'modern'}`}
              style={{ borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              dangerouslySetInnerHTML={{ __html: slideHtml }}
            />
            {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
              <div className="slide-footer">
                <span>{settings.footer || ''}</span>
                <span>{current + 1} / {slides.length}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: '1.2rem' }}>
            Waiting for content from editor...
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', background: 'rgba(0,0,0,0.05)', fontSize: '0.8rem', color: '#666',
      }}>
        <button className="btn-secondary" onClick={goPrev} style={{ padding: '0.2rem 0.75rem', fontSize: '0.75rem' }}>Prev</button>
        <span>{slides.length > 0 ? `${current + 1} / ${slides.length}` : 'No slides'}</span>
        <button className="btn-secondary" onClick={goNext} style={{ padding: '0.2rem 0.75rem', fontSize: '0.75rem' }}>Next</button>
      </div>
    </div>
  );
}
