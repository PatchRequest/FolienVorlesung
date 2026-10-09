import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import useAutoFit from '../lib/useAutoFit';
import useMermaid from '../lib/useMermaid';
import 'katex/dist/katex.min.css';

function NotFound() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#282a36',
      color: '#f8f8f2',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      gap: '1.5rem',
    }}>
      <div style={{ fontSize: '4rem', color: '#bd93f9' }}>404</div>
      <div style={{ fontSize: '1.5rem', color: '#f8f8f2' }}>Presentation not found</div>
      <div style={{ fontSize: '1rem', color: '#6272a4' }}>
        This presentation does not exist or is not publicly available.
      </div>
      <Link
        to="/public"
        style={{
          marginTop: '1rem',
          padding: '0.6rem 1.4rem',
          background: '#44475a',
          color: '#8be9fd',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '1rem',
          border: '1px solid #6272a4',
        }}
      >
        Back to overview
      </Link>
    </div>
  );
}

export default function PublicViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const [current, setCurrent] = useState(0);
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/api/public/presentations/${slug}`)
      .then(p => {
        const parsed = parsePresentation(p.content);
        setSlides(parsed.slides);
        setSettings(parsed.settings);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  const getFragments = useCallback((slideIndex) => {
    if (!slides[slideIndex]) return 0;
    const matches = slides[slideIndex].html.match(/data-fragment="(\d+)"/g);
    if (!matches) return 0;
    return Math.max(...matches.map(m => parseInt(m.match(/\d+/)[0])));
  }, [slides]);

  const goNext = useCallback(() => {
    const maxFrag = getFragments(current);
    if (fragmentIndex < maxFrag) {
      setFragmentIndex(f => f + 1);
    } else if (current < slides.length - 1) {
      setCurrent(c => c + 1);
      setFragmentIndex(0);
    }
  }, [current, fragmentIndex, slides.length, getFragments]);

  const goPrev = useCallback(() => {
    if (fragmentIndex > 0) {
      setFragmentIndex(f => f - 1);
    } else if (current > 0) {
      setCurrent(c => c - 1);
      setFragmentIndex(getFragments(current - 1));
    }
  }, [current, fragmentIndex, getFragments]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') navigate('/public');
      if (e.key === 'f') {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, navigate]);

  const getSlideHtml = (slide) => {
    if (!slide) return '';
    let html = slide.html;
    html = html.replace(/class="fragment"(\s+)data-fragment="(\d+)"/g, (match, space, num) => {
      const n = parseInt(num);
      if (n <= fragmentIndex) return `class="fragment visible"${space}data-fragment="${num}"`;
      return match;
    });
    return html;
  };

  const slide = slides[current];
  const rawHtml = getSlideHtml(slide);
  const slideHtml = useMermaid(rawHtml);
  const { ref: fitRef, fitStyle } = useAutoFit([slideHtml, settings.style]);

  if (notFound) return <NotFound />;
  if (!slide) return <div style={{ background: '#282a36', width: '100vw', height: '100vh' }} />;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: settings.style === 'dark' ? '#1a1a1a'
          : settings.style === 'dracula' ? '#282a36'
          : 'white',
        cursor: 'none',
        position: 'relative',
      }}
      onClick={goNext}
      onContextMenu={(e) => { e.preventDefault(); goPrev(); }}
    >
      {/* Non-intrusive back link in top-left corner */}
      <Link
        to="/public"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '0.75rem',
          left: '0.75rem',
          zIndex: 100,
          color: '#6272a4',
          textDecoration: 'none',
          fontSize: '0.75rem',
          fontFamily: 'sans-serif',
          opacity: 0.5,
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          cursor: 'default',
          userSelect: 'none',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.cursor = 'pointer'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.cursor = 'default'; }}
      >
        back
      </Link>

      <div style={{
        width: 960,
        height: 540,
        transform: `scale(${Math.min(window.innerWidth / 960, window.innerHeight / 540)})`,
        transformOrigin: 'center center',
        position: 'relative',
      }}>
        <div
          ref={fitRef}
          className={`slide slide-style-${settings.style || 'dracula'}`}
          style={fitStyle}
          dangerouslySetInnerHTML={{ __html: slideHtml }}
        />
        {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
          <div className="slide-footer">
            <span>{settings.footer || ''}</span>
            <span>{current + 1} / {slides.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
