import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: "'Nunito Sans', monospace",
  },
  '.cm-content': { padding: '1rem' },
  '.cm-gutters': { background: '#F4F1F2', border: 'none' },
  '&.cm-focused': { outline: 'none' },
});

// Autocomplete for custom syntax
const customCompletions = (context) => {
  const before = context.matchBefore(/\{[a-z]*/);
  if (!before) return null;
  return {
    from: before.from,
    options: [
      { label: '{color:}', type: 'keyword', detail: 'Text color', apply: '{color:red}' },
      { label: '{gradient:}', type: 'keyword', detail: 'Gradient text', apply: '{gradient:green,blue}' },
      { label: '{anim:fadeIn}', type: 'keyword', detail: 'Fade in animation' },
      { label: '{anim:fadeInUp}', type: 'keyword', detail: 'Fade in from bottom' },
      { label: '{anim:bounceIn}', type: 'keyword', detail: 'Bounce animation' },
      { label: '{anim:typewriter}', type: 'keyword', detail: 'Typewriter effect' },
      { label: '{anim:zoomIn}', type: 'keyword', detail: 'Zoom in animation' },
      { label: '{fragment:1}', type: 'keyword', detail: 'Fragment reveal' },
      { label: '{size:}', type: 'keyword', detail: 'Font size', apply: '{size:24px}' },
      { label: '{font:}', type: 'keyword', detail: 'Font family', apply: '{font:Arial}' },
      { label: '{/color}', type: 'keyword', detail: 'Close color' },
      { label: '{/gradient}', type: 'keyword', detail: 'Close gradient' },
      { label: '{/anim}', type: 'keyword', detail: 'Close animation' },
      { label: '{/fragment}', type: 'keyword', detail: 'Close fragment' },
      { label: '{/size}', type: 'keyword', detail: 'Close size' },
      { label: '{/font}', type: 'keyword', detail: 'Close font' },
    ],
  };
};

export default function MarkdownEditor({ value, onChange, editorRef }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const listenerCompartment = useRef(new Compartment());

  // Keep ref in sync so the EditorView listener always calls the latest onChange
  useEffect(() => {
    onChangeRef.current = onChange;
    // Reconfigure the listener compartment with fresh closure
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: listenerCompartment.current.reconfigure(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          })
        ),
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        history(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        autocompletion({ override: [customCompletions] }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        theme,
        listenerCompartment.current.of(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          })
        ),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    if (editorRef) editorRef.current = view;

    return () => { view.destroy(); if (editorRef) editorRef.current = null; };
  }, []); // Only create once

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }} />;
}
