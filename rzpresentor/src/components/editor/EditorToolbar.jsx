import { useState, useRef, useEffect } from 'react';
import ColorPicker from './ColorPicker';

const btnStyle = { padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 0 };
const sepStyle = { width: 1, height: 20, background: 'var(--color-border)', margin: '0 2px', flexShrink: 0 };

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72', '96'];

const FONT_FAMILIES = [
  'Nunito Sans',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
];

function Separator() {
  return <div style={sepStyle} />;
}

function ToolbarDropdown({ label, children, open, onToggle, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn-secondary"
        style={{
          ...btnStyle,
          display: 'flex', alignItems: 'center', gap: '3px',
          background: open ? 'var(--color-border)' : undefined,
        }}
        onClick={onToggle}
      >
        {label}
        <span style={{ fontSize: '0.6rem', lineHeight: 1 }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          background: 'white', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          padding: '0.35rem', minWidth: 140, marginTop: 2,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'none',
        border: 'none', borderRadius: 3, cursor: 'pointer',
        fontFamily: 'var(--font-family)',
      }}
      onMouseEnter={e => e.target.style.background = 'var(--color-bg-secondary)'}
      onMouseLeave={e => e.target.style.background = 'none'}
    >
      {label}
    </button>
  );
}

function FontSizeControl({ onInsert }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const apply = (size) => {
    onInsert(`{size:${size}px}`, '{/size}');
    setValue(size);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = value.trim();
      if (v) apply(v);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Size"
        title="Font size (px)"
        style={{
          width: 44, padding: '0.15rem 0.25rem', fontSize: '0.75rem',
          textAlign: 'center', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: 'white', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            maxHeight: 180, overflowY: 'auto', width: 60,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {FONT_SIZES.map(s => (
            <div
              key={s}
              onClick={() => apply(s)}
              style={{
                padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
                background: value === s ? 'var(--color-primary-light)' : 'transparent',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--color-bg-secondary)'}
              onMouseLeave={e => e.target.style.background = value === s ? 'var(--color-primary-light)' : 'transparent'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

function FontFamilyControl({ onInsert }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const apply = (family) => {
    onInsert(`{font:${family}}`, '{/font}');
    setValue(family);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = value.trim();
      if (v) apply(v);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Font"
        title="Font family"
        style={{
          width: 110, padding: '0.15rem 0.25rem', fontSize: '0.75rem',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: 'white', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            maxHeight: 200, overflowY: 'auto', width: 170,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {FONT_FAMILIES.map(f => (
            <div
              key={f}
              onClick={() => apply(f)}
              style={{
                padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
                fontFamily: f,
                background: value === f ? 'var(--color-primary-light)' : 'transparent',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--color-bg-secondary)'}
              onMouseLeave={e => e.target.style.background = value === f ? 'var(--color-primary-light)' : 'transparent'}
            >
              {f}
            </div>
          ))}
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function EditorToolbar({ onInsert }) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'headings' | 'color' | 'motion' | 'insert' | 'math'
  const [colorPicker, setColorPicker] = useState(null);

  const toggle = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
    if (name !== 'color') setColorPicker(null);
  };
  const close = () => { setOpenDropdown(null); setColorPicker(null); };

  const insertAndClose = (before, after) => {
    onInsert(before, after);
    close();
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '0.4rem 0.5rem',
      borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
      alignItems: 'center',
    }}>
      {/* === Direct: Font controls === */}
      <FontFamilyControl onInsert={onInsert} />
      <FontSizeControl onInsert={onInsert} />

      <Separator />

      {/* === Direct: Text formatting === */}
      <button title="Bold" className="btn-secondary" style={{ ...btnStyle, fontWeight: 700 }}
        onClick={() => onInsert('**', '**')}>B</button>
      <button title="Italic" className="btn-secondary" style={{ ...btnStyle, fontStyle: 'italic' }}
        onClick={() => onInsert('*', '*')}>I</button>

      <Separator />

      {/* === Dropdown: Headings === */}
      <ToolbarDropdown
        label="Heading"
        open={openDropdown === 'headings'}
        onToggle={() => toggle('headings')}
        onClose={close}
      >
        <DropdownItem label="H1 - Title" onClick={() => insertAndClose('# ', '')} />
        <DropdownItem label="H2 - Section" onClick={() => insertAndClose('## ', '')} />
        <DropdownItem label="H3 - Subsection" onClick={() => insertAndClose('### ', '')} />
      </ToolbarDropdown>

      {/* === Dropdown: Color & style === */}
      <ToolbarDropdown
        label="Color"
        open={openDropdown === 'color'}
        onToggle={() => { toggle('color'); setColorPicker(null); }}
        onClose={() => { if (!colorPicker) close(); }}
      >
        <div style={{ padding: '0.15rem 0' }}>
          <button
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'none',
              border: 'none', borderRadius: 3, cursor: 'pointer',
              fontFamily: 'var(--font-family)',
            }}
            onMouseEnter={e => e.target.style.background = 'var(--color-bg-secondary)'}
            onMouseLeave={e => e.target.style.background = 'none'}
            onClick={() => setColorPicker(colorPicker === 'color' ? null : 'color')}
          >
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#bd93f9', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />
            Text Color
          </button>
          <button
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'none',
              border: 'none', borderRadius: 3, cursor: 'pointer',
              fontFamily: 'var(--font-family)',
            }}
            onMouseEnter={e => e.target.style.background = 'var(--color-bg-secondary)'}
            onMouseLeave={e => e.target.style.background = 'none'}
            onClick={() => setColorPicker(colorPicker === 'gradient' ? null : 'gradient')}
          >
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'linear-gradient(90deg, #bd93f9, #8be9fd)', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />
            Gradient
          </button>
        </div>
        {colorPicker && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.35rem', marginTop: '0.25rem' }}>
            <ColorPicker
              mode={colorPicker}
              onApply={(before, after) => { onInsert(before, after); close(); }}
              onClose={() => setColorPicker(null)}
            />
          </div>
        )}
      </ToolbarDropdown>

      {/* === Dropdown: Motion === */}
      <ToolbarDropdown
        label="Motion"
        open={openDropdown === 'motion'}
        onToggle={() => toggle('motion')}
        onClose={close}
      >
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', padding: '0.15rem 0.5rem', fontWeight: 600 }}>Animations</div>
        <DropdownItem label="Fade In" onClick={() => insertAndClose('{anim:fadeIn}', '{/anim}')} />
        <DropdownItem label="Fade In Up" onClick={() => insertAndClose('{anim:fadeInUp}', '{/anim}')} />
        <DropdownItem label="Fade In Down" onClick={() => insertAndClose('{anim:fadeInDown}', '{/anim}')} />
        <DropdownItem label="Fade In Left" onClick={() => insertAndClose('{anim:fadeInLeft}', '{/anim}')} />
        <DropdownItem label="Fade In Right" onClick={() => insertAndClose('{anim:fadeInRight}', '{/anim}')} />
        <DropdownItem label="Bounce In" onClick={() => insertAndClose('{anim:bounceIn}', '{/anim}')} />
        <DropdownItem label="Zoom In" onClick={() => insertAndClose('{anim:zoomIn}', '{/anim}')} />
        <DropdownItem label="Typewriter" onClick={() => insertAndClose('{anim:typewriter}', '{/anim}')} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', padding: '0.15rem 0.5rem', fontWeight: 600 }}>Reveal</div>
        <DropdownItem label="Fragment (step 1)" onClick={() => insertAndClose('{fragment:1}', '{/fragment}')} />
        <DropdownItem label="Fragment (step 2)" onClick={() => insertAndClose('{fragment:2}', '{/fragment}')} />
        <DropdownItem label="Fragment (step 3)" onClick={() => insertAndClose('{fragment:3}', '{/fragment}')} />
      </ToolbarDropdown>

      {/* === Dropdown: Insert === */}
      <ToolbarDropdown
        label="Insert"
        open={openDropdown === 'insert'}
        onToggle={() => toggle('insert')}
        onClose={close}
      >
        <DropdownItem label="Bullet List" onClick={() => insertAndClose('- ', '')} />
        <DropdownItem label="Link" onClick={() => insertAndClose('[text](', ')')} />
        <DropdownItem label="Image" onClick={() => insertAndClose('![alt](', ')')} />
        <DropdownItem label="YouTube Video" onClick={() => insertAndClose('@[youtube](https://www.youtube.com/watch?v=', ')')} />
        <DropdownItem label="Code Block" onClick={() => insertAndClose('\n```\n', '\n```\n')} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
        <DropdownItem label="Inline LaTeX  $...$" onClick={() => insertAndClose('$', '$')} />
        <DropdownItem label="Block LaTeX  $$...$$" onClick={() => insertAndClose('\n$$\n', '\n$$\n')} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0.25rem 0' }} />
        <DropdownItem label="Page Break  ===" onClick={() => insertAndClose('\n===\n', '')} />
      </ToolbarDropdown>
    </div>
  );
}
