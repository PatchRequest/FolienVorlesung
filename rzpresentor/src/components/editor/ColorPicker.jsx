import { useState } from 'react';
import AngleDial from './AngleDial';

const PRESETS = [
  { label: 'Dracula Purple', value: '#bd93f9' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Gray', value: '#F4F1F2' },
  { label: 'HS Blue', value: '#6EB2F7' },
  { label: 'HS Orange', value: '#FFA64B' },
  { label: 'HS Pink', value: '#FF7AD7' },
  { label: 'Red', value: '#DC3545' },
  { label: 'Dark Green', value: '#1a5e00' },
  { label: 'Navy', value: '#1a1a6e' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Teal', value: '#14B8A6' },
];

function Swatch({ color, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(color)}
      title={color}
      style={{
        width: 22, height: 22, borderRadius: 3,
        background: color,
        border: selected ? '2px solid var(--color-text)' : '1px solid var(--color-border)',
        cursor: 'pointer', padding: 0,
        boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : 'none',
      }}
    />
  );
}

export default function ColorPicker({ mode = 'color', onApply }) {
  const [color1, setColor1] = useState('#bd93f9');
  const [color2, setColor2] = useState('#1a1a1a');
  const [angle, setAngle] = useState(90);

  const handleApply = () => {
    if (mode === 'color') {
      onApply(`{color:${color1}}`, '{/color}');
    } else {
      onApply(`{gradient:${color1},${color2},${angle}deg}`, '{/gradient}');
    }
  };

  return (
    <div>
      {/* Color 1 */}
      <div style={{ marginBottom: '0.4rem' }}>
        {mode === 'gradient' && (
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', marginBottom: '0.2rem', fontWeight: 600 }}>Start</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <input
            type="color"
            value={color1}
            onChange={e => setColor1(e.target.value)}
            style={{ width: 32, height: 24, padding: 0, border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer' }}
          />
          <input
            type="text"
            value={color1}
            onChange={e => setColor1(e.target.value)}
            style={{ width: 72, fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.2rem 0.35rem' }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {PRESETS.map(p => (
            <Swatch key={p.value} color={p.value} selected={color1 === p.value} onClick={setColor1} />
          ))}
        </div>
      </div>

      {/* Color 2 (gradient only) */}
      {mode === 'gradient' && (
        <div style={{ marginBottom: '0.4rem', paddingTop: '0.35rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', marginBottom: '0.2rem', fontWeight: 600 }}>End</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <input
              type="color"
              value={color2}
              onChange={e => setColor2(e.target.value)}
              style={{ width: 32, height: 24, padding: 0, border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer' }}
            />
            <input
              type="text"
              value={color2}
              onChange={e => setColor2(e.target.value)}
              style={{ width: 72, fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.2rem 0.35rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {PRESETS.map(p => (
              <Swatch key={p.value} color={p.value} selected={color2 === p.value} onClick={setColor2} />
            ))}
          </div>
        </div>
      )}

      {/* Angle dial (gradient only) */}
      {mode === 'gradient' && (
        <div style={{ paddingTop: '0.35rem', marginBottom: '0.4rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', marginBottom: '0.2rem', fontWeight: 600 }}>Angle</div>
          <AngleDial angle={angle} onChange={setAngle} />
        </div>
      )}

      {/* Preview */}
      <div style={{
        marginBottom: '0.35rem', padding: '0.35rem', borderRadius: 3,
        background: '#f9f9f9', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
      }}>
        {mode === 'color' ? (
          <span style={{ color: color1 }}>Preview text</span>
        ) : (
          <span style={{
            background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Preview text</span>
        )}
      </div>

      <button className="btn-primary" onClick={handleApply} style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem' }}>
        Apply
      </button>
    </div>
  );
}
