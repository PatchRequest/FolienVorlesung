import { useRef, useState, useEffect, useCallback } from 'react';

export default function AnnotationCanvas({ width, height }) {
  const canvasRef = useRef(null);
  const strokeCanvasRef = useRef(null); // offscreen canvas for current stroke
  const [tool, setTool] = useState('none');
  const [drawing, setDrawing] = useState(false);
  const [laserPos, setLaserPos] = useState(null);
  // Store completed strokes as image snapshots
  const committedRef = useRef(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  // Lazy-init offscreen canvases
  const ensureOffscreen = () => {
    if (!strokeCanvasRef.current) {
      strokeCanvasRef.current = document.createElement('canvas');
      strokeCanvasRef.current.width = width;
      strokeCanvasRef.current.height = height;
    }
    if (!committedRef.current) {
      committedRef.current = document.createElement('canvas');
      committedRef.current.width = width;
      committedRef.current.height = height;
    }
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Redraw main canvas from committed + current stroke
  const compositeToMain = (strokeAlpha) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    // Draw committed strokes at full opacity (already baked in)
    if (committedRef.current) {
      ctx.drawImage(committedRef.current, 0, 0);
    }
    // Draw current in-progress stroke at desired alpha
    if (strokeCanvasRef.current && strokeAlpha > 0) {
      ctx.globalAlpha = strokeAlpha;
      ctx.drawImage(strokeCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;
    }
  };

  const startDraw = useCallback((e) => {
    if (tool === 'none') return;
    const { x, y } = getCanvasCoords(e);

    if (tool === 'laser') {
      setLaserPos({ x, y });
      return;
    }

    ensureOffscreen();
    setDrawing(true);

    if (tool === 'marker') {
      // Clear the stroke canvas for a fresh stroke
      const sCtx = strokeCanvasRef.current.getContext('2d');
      sCtx.clearRect(0, 0, width, height);
      sCtx.beginPath();
      sCtx.moveTo(x, y);
      sCtx.strokeStyle = 'rgb(255, 255, 120)';
      sCtx.lineWidth = 22;
      sCtx.lineCap = 'round';
      sCtx.lineJoin = 'round';
      sCtx.globalCompositeOperation = 'source-over';
    } else if (tool === 'eraser') {
      // Eraser works directly on committed canvas
      const cCtx = committedRef.current.getContext('2d');
      cCtx.globalCompositeOperation = 'destination-out';
      cCtx.lineWidth = 30;
      cCtx.lineCap = 'round';
      cCtx.lineJoin = 'round';
      cCtx.beginPath();
      cCtx.moveTo(x, y);
    }
  }, [tool, width, height]);

  const draw = useCallback((e) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === 'laser') {
      setLaserPos({ x, y });
      return;
    }

    if (!drawing) return;

    if (tool === 'marker') {
      const sCtx = strokeCanvasRef.current.getContext('2d');
      sCtx.lineTo(x, y);
      sCtx.stroke();
      compositeToMain(0.35);
    } else if (tool === 'eraser') {
      const cCtx = committedRef.current.getContext('2d');
      cCtx.lineTo(x, y);
      cCtx.stroke();
      compositeToMain(0);
    }
  }, [drawing, tool, width, height]);

  const stopDraw = useCallback(() => {
    if (tool === 'laser') setLaserPos(null);

    if (drawing) {
      if (tool === 'marker' && strokeCanvasRef.current && committedRef.current) {
        // Commit the stroke: draw it onto committed canvas at desired alpha
        const cCtx = committedRef.current.getContext('2d');
        cCtx.globalCompositeOperation = 'source-over';
        cCtx.globalAlpha = 0.35;
        cCtx.drawImage(strokeCanvasRef.current, 0, 0);
        cCtx.globalAlpha = 1;
      }
      if (tool === 'eraser' && committedRef.current) {
        const cCtx = committedRef.current.getContext('2d');
        cCtx.globalCompositeOperation = 'source-over';
      }
      compositeToMain(0);
    }
    setDrawing(false);
  }, [tool, drawing, width, height]);

  const clearAll = () => {
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, width, height);
    if (committedRef.current) {
      committedRef.current.getContext('2d').clearRect(0, 0, width, height);
    }
    if (strokeCanvasRef.current) {
      strokeCanvasRef.current.getContext('2d').clearRect(0, 0, width, height);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'm') setTool(t => t === 'marker' ? 'none' : 'marker');
      if (e.key === 'l') setTool(t => t === 'laser' ? 'none' : 'laser');
      if (e.key === 'e') setTool(t => t === 'eraser' ? 'none' : 'eraser');
      if (e.key === 'c') clearAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toolStyle = (t) => ({
    padding: '0.25rem 0.5rem', fontSize: '0.75rem',
    background: tool === t ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
    color: tool === t ? 'white' : 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    cursor: 'pointer',
  });

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute', top: 0, left: 0,
          width, height,
          zIndex: 10,
          cursor: tool === 'none' ? 'default' : 'crosshair',
          pointerEvents: tool === 'none' ? 'none' : 'auto',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
      {laserPos && (
        <div style={{
          position: 'absolute', left: laserPos.x - 8, top: laserPos.y - 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'red', opacity: 0.8, pointerEvents: 'none',
          zIndex: 11,
          boxShadow: '0 0 10px 5px rgba(255,0,0,0.3)',
        }} />
      )}
      <div style={{
        position: 'absolute', bottom: -36, left: 0, display: 'flex', gap: '4px', zIndex: 10,
      }}>
        <button style={toolStyle('marker')} onClick={() => setTool(t => t === 'marker' ? 'none' : 'marker')}>Marker (M)</button>
        <button style={toolStyle('laser')} onClick={() => setTool(t => t === 'laser' ? 'none' : 'laser')}>Laser (L)</button>
        <button style={toolStyle('eraser')} onClick={() => setTool(t => t === 'eraser' ? 'none' : 'eraser')}>Eraser (E)</button>
        <button style={{ ...toolStyle('none'), background: 'var(--color-bg-secondary)' }} onClick={clearAll}>Clear (C)</button>
      </div>
    </>
  );
}
