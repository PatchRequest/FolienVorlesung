export default function ViewToggle({ mode, onChange }) {
  const modes = [
    { key: 'editor', label: 'Editor' },
    { key: 'preview', label: 'Preview' },
    { key: 'split', label: 'Side by Side' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2px', background: 'var(--color-bg-secondary)', padding: '2px', borderRadius: 'var(--radius)' }}>
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius)',
            background: mode === m.key ? 'var(--color-primary)' : 'transparent',
            color: mode === m.key ? 'white' : 'var(--color-text)',
            border: 'none', cursor: 'pointer', fontWeight: mode === m.key ? 600 : 400,
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
