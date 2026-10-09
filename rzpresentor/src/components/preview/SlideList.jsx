import SlidePreview from './SlidePreview';

const THUMB_SCALE = 0.14;
const THUMB_H = Math.round(540 * THUMB_SCALE);

export default function SlideList({ slides, settings, currentIndex, onSelect }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      padding: '0.5rem', overflowY: 'auto', overflowX: 'hidden', height: '100%',
    }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          style={{
            cursor: 'pointer',
            border: i === currentIndex ? '2px solid var(--color-primary)' : '2px solid #ccc',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            height: THUMB_H,
            flexShrink: 0,
          }}
        >
          <SlidePreview html={slide.html} settings={settings} index={i} total={slides.length} scale={THUMB_SCALE} />
        </div>
      ))}
    </div>
  );
}
