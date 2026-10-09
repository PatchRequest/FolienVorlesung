export default function Logo({ size = 32 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        width: size, height: size, borderRadius: 6,
        background: '#bd93f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#282a36', fontWeight: 800, fontSize: size * 0.45, lineHeight: 1 }}>RZ</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontWeight: 800, fontSize: size * 0.5 }}>
          <span style={{ color: 'var(--color-primary)' }}>RZ</span>Presenter
        </span>
        <span style={{ fontSize: size * 0.28, color: 'var(--color-text-light)', fontWeight: 400 }}>
          Daniel Riebel — DHBW Mannheim
        </span>
      </div>
    </div>
  );
}
