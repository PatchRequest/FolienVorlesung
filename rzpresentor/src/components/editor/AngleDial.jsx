import { useRef, useState, useCallback } from 'react';

const SIZE = 64;
const CENTER = SIZE / 2;
const RADIUS = 24;

export default function AngleDial({ angle, onChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const angleToXY = (deg) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      x: CENTER + RADIUS * Math.cos(rad),
      y: CENTER + RADIUS * Math.sin(rad),
    };
  };

  const eventToAngle = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - CENTER;
    const y = e.clientY - rect.top - CENTER;
    let deg = Math.round(Math.atan2(y, x) * (180 / Math.PI) + 90);
    if (deg < 0) deg += 360;
    // Snap to 15-degree increments when close
    const snapped = Math.round(deg / 15) * 15;
    if (Math.abs(deg - snapped) < 4) deg = snapped;
    return deg % 360;
  }, []);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    onChange(eventToAngle(e));
    svgRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    onChange(eventToAngle(e));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handle = angleToXY(angle);

  // Tick marks at 0, 90, 180, 270
  const ticks = [0, 90, 180, 270].map(deg => {
    const outer = angleToXY(deg);
    const rad = (deg - 90) * (Math.PI / 180);
    const inner = {
      x: CENTER + (RADIUS - 5) * Math.cos(rad),
      y: CENTER + (RADIUS - 5) * Math.sin(rad),
    };
    return { deg, outer, inner };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        style={{ cursor: 'pointer', flexShrink: 0 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track circle */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#ddd" strokeWidth={2} />

        {/* Tick marks */}
        {ticks.map(t => (
          <line key={t.deg}
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            stroke="#bbb" strokeWidth={1.5}
          />
        ))}

        {/* Direction line from center to handle */}
        <line x1={CENTER} y1={CENTER} x2={handle.x} y2={handle.y}
          stroke="var(--color-primary, #bd93f9)" strokeWidth={2} />

        {/* Center dot */}
        <circle cx={CENTER} cy={CENTER} r={3} fill="#999" />

        {/* Handle */}
        <circle cx={handle.x} cy={handle.y} r={6}
          fill="var(--color-primary, #bd93f9)" stroke="white" strokeWidth={2}
          style={{ filter: dragging ? 'drop-shadow(0 0 3px rgba(0,0,0,0.3))' : 'none' }}
        />
      </svg>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textAlign: 'center', minWidth: 32 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>{angle}°</div>
      </div>
    </div>
  );
}
