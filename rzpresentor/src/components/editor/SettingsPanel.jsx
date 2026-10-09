import { useState, useEffect } from 'react';

const SETTINGS_TEMPLATE = `---settings---
style: {style}
animation: {animation}
transition: {transition}
footer: {footer}
pageNumbers: {pageNumbers}
logo: {logo}
---/settings---`;

export default function SettingsPanel({ content, onUpdateContent, slug, isPublic, onSlugChange, onPublicChange }) {
  const [settings, setSettings] = useState({
    style: 'dracula', animation: 'fade', transition: 'slide',
    footer: '', pageNumbers: 'true', logo: 'true',
  });

  useEffect(() => {
    const match = content.match(/^---settings---\n([\s\S]*?)\n---\/settings---/);
    if (match) {
      const parsed = {};
      match[1].split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) parsed[key.trim()] = rest.join(':').trim();
      });
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  }, [content]);

  const apply = (newSettings) => {
    const block = SETTINGS_TEMPLATE
      .replace('{style}', newSettings.style)
      .replace('{animation}', newSettings.animation)
      .replace('{transition}', newSettings.transition)
      .replace('{footer}', newSettings.footer)
      .replace('{pageNumbers}', newSettings.pageNumbers)
      .replace('{logo}', newSettings.logo);

    const existing = content.match(/^---settings---\n[\s\S]*?\n---\/settings---\n?/);
    const newContent = existing
      ? content.replace(existing[0], block + '\n')
      : block + '\n' + content;
    onUpdateContent(newContent);
    setSettings(newSettings);
  };

  const update = (key, value) => {
    apply({ ...settings, [key]: value });
  };

  const fieldStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600, width: 80 };

  return (
    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
      <div style={fieldStyle}>
        <span style={labelStyle}>Style</span>
        <select value={settings.style} onChange={e => update('style', e.target.value)} style={{ width: 'auto' }}>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
          <option value="dark">Dark</option>
          <option value="dracula">Dracula</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Animation</span>
        <select value={settings.animation} onChange={e => update('animation', e.target.value)} style={{ width: 'auto' }}>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="none">None</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Transition</span>
        <select value={settings.transition} onChange={e => update('transition', e.target.value)} style={{ width: 'auto' }}>
          <option value="slide">Slide</option>
          <option value="fade">Fade</option>
          <option value="zoom">Zoom</option>
          <option value="none">None</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Footer</span>
        <input value={settings.footer} onChange={e => update('footer', e.target.value)} placeholder="Footer text" style={{ width: 'auto', flex: 1 }} />
      </div>
      <div style={fieldStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input type="checkbox" checked={settings.pageNumbers === 'true'} onChange={e => update('pageNumbers', String(e.target.checked))} />
          <span style={{ fontSize: '0.8rem' }}>Page numbers</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '1rem' }}>
          <input type="checkbox" checked={settings.logo === 'true'} onChange={e => update('logo', String(e.target.checked))} />
          <span style={{ fontSize: '0.8rem' }}>Show logo</span>
        </label>
      </div>

      {/* Sharing section — DB metadata, not part of markdown settings block */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #888)', display: 'block', marginBottom: '0.5rem' }}>Sharing</span>
        <div style={fieldStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={!!isPublic} onChange={e => onPublicChange && onPublicChange(e.target.checked)} />
            <span style={{ fontSize: '0.8rem' }}>Public (visible on /public)</span>
          </label>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Slug</span>
          <input
            type="text"
            value={slug || ''}
            onChange={e => onSlugChange && onSlugChange(e.target.value)}
            placeholder="e.g. offensive-security"
            pattern="[a-z0-9-]+"
            style={{ width: 'auto', flex: 1 }}
          />
        </div>
        {slug && (
          <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #888)' }}>
            Link: /view/{slug}
          </small>
        )}
      </div>
    </div>
  );
}
