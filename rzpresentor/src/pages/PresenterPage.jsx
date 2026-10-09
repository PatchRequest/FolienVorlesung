import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import Timer from '../components/presenter/Timer';
import AnnotationCanvas from '../components/presenter/AnnotationCanvas';
import useAutoFit from '../lib/useAutoFit';
import 'katex/dist/katex.min.css';

export default function PresenterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const startSlide = parseInt(searchParams.get('slide') || '0', 10);
  const [current, setCurrent] = useState(startSlide);
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

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
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'f') { e.preventDefault(); setFullscreen(f => !f); }
      if (e.key === 'Escape') { if (fullscreen) setFullscreen(false); else navigate(`/edit/${id}`); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, fullscreen, navigate, id]);

  const getSlideHtml = (slide, fragIdx) => {
    if (!slide) return '';
    return slide.html.replace(/class="fragment"(\s+)data-fragment="(\d+)"/g, (match, space, num) => {
      return parseInt(num) <= fragIdx ? `class="fragment visible"${space}data-fragment="${num}"` : match;
    });
  };

  const currentSlide = slides[current];
  const nextSlide = slides[current + 1];
  const currentHtml = getSlideHtml(currentSlide, fragmentIndex);
  const { ref: fitRef, fitStyle } = useAutoFit([currentHtml, settings.style]);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: fullscreen ? (settings.style === 'dark' ? '#1a1a1a' : 'white') : '#2a2a2a', color: 'white',
      display: 'grid', gridTemplateColumns: fullscreen ? '1fr' : '1fr 350px', gap: fullscreen ? 0 : '1rem', padding: fullscreen ? 0 : '1rem',
      overflow: 'hidden', cursor: fullscreen ? 'none' : 'default',
    }}
      onClick={fullscreen ? goNext : undefined}
      onContextMenu={fullscreen ? (e) => { e.preventDefault(); goPrev(); } : undefined}
    >
      {/* Current slide */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{
          width: 960, height: 540,
          transform: fullscreen
            ? `scale(${Math.min(window.innerWidth / 960, window.innerHeight / 540)})`
            : 'scale(0.85)',
          transformOrigin: 'center center',
          position: 'relative',
        }}>
          {currentSlide && (
            <div
              ref={fitRef}
              className={`slide slide-style-${settings.style || 'modern'}`}
              dangerouslySetInnerHTML={{ __html: currentHtml }}
              style={{ borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', ...fitStyle }}
            />
          )}
          <AnnotationCanvas width={960} height={540} />
          {(settings.pageNumbers === true || settings.pageNumbers === 'true') && (
            <div className="slide-footer">
              <span>{settings.footer || ''}</span>
              <span>{current + 1} / {slides.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel (hidden in fullscreen) */}
      <div style={{ display: fullscreen ? 'none' : 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Next slide preview */}
        <div>
          <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem' }}>Next Slide</div>
          <div style={{ background: '#333', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {nextSlide ? (
              <div style={{ width: 320, height: 180, position: 'relative' }}>
                <div
                  className={`slide slide-style-${settings.style || 'modern'}`}
                  dangerouslySetInnerHTML={{ __html: nextSlide.html }}
                  style={{ transform: 'scale(0.333)', transformOrigin: 'top left', width: 960, height: 540 }}
                />
              </div>
            ) : (
              <div style={{ width: 320, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                End of presentation
              </div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div style={{ background: '#333', borderRadius: 'var(--radius)', padding: '1rem' }}>
          <Timer />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={goPrev} style={{ flex: 1 }}>Previous</button>
          <button className="btn-primary" onClick={goNext} style={{ flex: 1 }}>Next</button>
        </div>
        <button className="btn-secondary" onClick={() => setFullscreen(true)} style={{ width: '100%' }}>
          Fullscreen (F)
        </button>

        {/* Slide info */}
        <div style={{ fontSize: '0.85rem', color: '#999' }}>
          Slide {current + 1} of {slides.length}
          {getFragments(current) > 0 && ` | Fragment ${fragmentIndex}/${getFragments(current)}`}
        </div>

        {/* Controls help */}
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 'auto' }}>
          <div>Arrow keys / Space: Navigate</div>
          <div>F: Fullscreen | Esc: Exit fullscreen or back to editor</div>
          <div>M: Marker | L: Laser | E: Eraser | C: Clear</div>
        </div>
      </div>
    </div>
  );
}
