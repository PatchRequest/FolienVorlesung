import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { parsePresentation } from '../lib/slideParser';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import SettingsPanel from '../components/editor/SettingsPanel';
import ViewToggle from '../components/editor/ViewToggle';
import SlidePreview from '../components/preview/SlidePreview';
import SlideList from '../components/preview/SlideList';

function PreviewArea({ slides, settings, currentSlide }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const pad = 32; // 1rem padding on each side
      const s = Math.min((width - pad) / 960, (height - pad) / 540, 1);
      setScale(Math.max(s, 0.1));
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '1rem', overflow: 'hidden', position: 'relative' }}>
      {slides[currentSlide] && (
        <div style={{ width: Math.round(960 * scale), height: Math.round(540 * scale), flexShrink: 0 }}>
          <SlidePreview
            html={slides[currentSlide].html}
            settings={settings}
            index={currentSlide}
            total={slides.length}
            scale={scale}
          />
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef(null);
  const sharingTimer = useRef(null);
  const editorViewRef = useRef(null);
  const channelRef = useRef(null);

  // BroadcastChannel for pop-out preview sync
  useEffect(() => {
    const channel = new BroadcastChannel(`rzpresenter-${id}`);
    channelRef.current = channel;

    channel.onmessage = (e) => {
      // If preview tab requests content, send it
      if (e.data.type === 'request-content') {
        channel.postMessage({ type: 'content-update', content });
      }
    };

    return () => channel.close();
  }, [id, content]);

  // Broadcast content changes to preview tab
  useEffect(() => {
    if (channelRef.current && content) {
      channelRef.current.postMessage({ type: 'content-update', content });
    }
  }, [content]);

  // Broadcast slide changes to preview tab
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'slide-change', index: currentSlide });
    }
  }, [currentSlide]);

  useEffect(() => {
    api.get(`/api/presentations/${id}`).then(p => {
      setTitle(p.title);
      setContent(p.content || '---settings---\nstyle: modern\nanimation: fade\ntransition: slide\nfooter: \npageNumbers: true\nlogo: true\n---/settings---\n\n# Welcome\n\nEdit your presentation here\n\n===\n\n# Slide 2\n\nAdd more content...');
      setSlug(p.slug || '');
      setIsPublic(!!p.public);
    }).catch(() => navigate('/'));
  }, [id]);

  const save = useCallback(async (newContent, newTitle) => {
    setSaving(true);
    try {
      await api.put(`/api/presentations/${id}`, { title: newTitle || title, content: newContent ?? content });
    } finally {
      setSaving(false);
    }
  }, [id, title, content]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newContent), 1500);
  }, [save]);

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(content, newTitle), 1500);
  };

  const saveSharing = useCallback(async (newSlug, newIsPublic) => {
    setSaving(true);
    try {
      await api.put(`/api/presentations/${id}`, { slug: newSlug, public: newIsPublic });
    } finally {
      setSaving(false);
    }
  }, [id]);

  const handleSlugChange = (newSlug) => {
    setSlug(newSlug);
    clearTimeout(sharingTimer.current);
    sharingTimer.current = setTimeout(() => saveSharing(newSlug, isPublic), 1500);
  };

  const handlePublicChange = (newIsPublic) => {
    setIsPublic(newIsPublic);
    clearTimeout(sharingTimer.current);
    sharingTimer.current = setTimeout(() => saveSharing(slug, newIsPublic), 1500);
  };

  const handleInsert = (before, after) => {
    const view = editorViewRef.current;
    if (view) {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const text = selected || 'text';
      const insert = before + text + after;
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + before.length, head: from + before.length + text.length },
      });
      view.focus();
    } else {
      setContent(prev => prev + before + 'text' + after);
    }
  };

  const openPreviewTab = () => {
    window.open(`/preview/${id}`, `preview-${id}`, 'noopener');
  };

  const { settings, slides } = parsePresentation(content);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem',
        borderBottom: '1px solid var(--color-border)', background: 'white',
      }}>
        <Link to="/" style={{ color: 'var(--color-text)', fontWeight: 800, textDecoration: 'none' }}>
          <span style={{ color: 'var(--color-primary)' }}>RZ</span>P
        </Link>
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          style={{ border: 'none', fontWeight: 600, fontSize: '1rem', flex: 1, outline: 'none' }}
        />
        <ViewToggle mode={viewMode} onChange={setViewMode} />
        <button className="btn-secondary" onClick={openPreviewTab} title="Open preview in new tab"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
          Pop Out
        </button>
        <button className="btn-secondary" onClick={() => setShowSettings(!showSettings)}
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
          Settings
        </button>
        <span style={{ fontSize: '0.7rem', color: saving ? 'var(--color-warning)' : 'var(--color-primary)' }}>
          {saving ? 'Saving...' : 'Saved'}
        </span>
        <button className="btn-primary" onClick={() => navigate(`/presenter/${id}?slide=${currentSlide}`)}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Present</button>
        <button className="btn-secondary" onClick={() => navigate(`/presenter/${id}`)}
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>From Start</button>
      </div>

      {showSettings && (
        <SettingsPanel
          content={content}
          onUpdateContent={setContent}
          slug={slug}
          isPublic={isPublic}
          onSlugChange={handleSlugChange}
          onPublicChange={handlePublicChange}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: viewMode === 'split' ? '1px solid var(--color-border)' : 'none' }}>
            <EditorToolbar onInsert={handleInsert} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MarkdownEditor value={content} onChange={handleContentChange} editorRef={editorViewRef} />
            </div>
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <PreviewArea slides={slides} settings={settings} currentSlide={currentSlide} />
            <div style={{ width: 150, borderLeft: '1px solid var(--color-border)' }}>
              <SlideList slides={slides} settings={settings} currentIndex={currentSlide} onSelect={setCurrentSlide} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
