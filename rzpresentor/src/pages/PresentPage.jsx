import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import useAutoFit from '../lib/useAutoFit';
import useMermaid from '../lib/useMermaid';
import 'katex/dist/katex.min.css';

export default function PresentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const startSlide = parseInt(searchParams.get('slide') || '0', 10);
  const [current, setCurrent] = useState(startSlide);
  const [fragmentIndex, setFragmentIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/presentations/${id}`).then(p => {
      const parsed = parsePresentation(p.content);
      setSlides(parsed.slides);
      setSettings(parsed.settings);
    }).catch(() => navigate('/'));
  }, [id]);

  // Keep session alive during presentation
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/api/auth/me').catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
      if (e.key === 'Escape') navigate('/');
      if (e.key === 'f') {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Apply fragment visibility
  const getSlideHtml = (slide) => {
    if (!slide) return '';
    let html = slide.html;
    // Make fragments visible up to current fragmentIndex
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

  if (!slide) return <div style={{ background: 'black', width: '100vw', height: '100vh' }} />;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: settings.style === 'dark' ? '#1a1a1a' : 'white',
      cursor: 'none',
    }}
      onClick={goNext}
      onContextMenu={(e) => { e.preventDefault(); goPrev(); }}
    >
      <div style={{
        width: 960, height: 540,
        transform: `scale(${Math.min(window.innerWidth / 960, window.innerHeight / 540)})`,
        transformOrigin: 'center center',
        position: 'relative',
      }}>
        <div
          ref={fitRef}
          className={`slide slide-style-${settings.style || 'modern'}`}
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
