import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { whiteboardAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Square, Circle, RotateCcw, Palette, Paintbrush,
  Eraser, Download, Save, Loader2, RefreshCw
} from 'lucide-react';

const COLORS = [
  '#f5f0eb', '#2dd4bf', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'
];

const Whiteboard = ({ boardId }) => {
  const { on, off, emit } = useSocket();
  const { toast } = useToast();

  const [color, setColor] = useState('#f5f0eb'); // default primary light
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hasChangesRef = useRef(false);

  // Initialize Canvas dimensions
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions relative to its parent container size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height || 500;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Load initial drawings from Database
    loadFromDatabase();
  }, [boardId]);

  // Handle window resizing
  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  // Load from DB
  const loadFromDatabase = async () => {
    try {
      setLoading(true);
      const res = await whiteboardAPI.get(boardId);
      if (res.data.whiteboard?.canvasData) {
        drawImageOnCanvas(res.data.whiteboard.canvasData);
      }
      // Trigger a request for the most live state from other active clients
      emit('whiteboard-request-state', { boardId });
    } catch (err) {
      console.error('[Whiteboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const drawImageOnCanvas = (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      if (contextRef.current && canvasRef.current) {
        contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  };

  // Socket syncing listeners
  useEffect(() => {
    const handleDraw = ({ x0, y0, x1, y1, brushColor, brushWidth }) => {
      const context = contextRef.current;
      if (!context) return;

      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = brushColor;
      context.lineWidth = brushWidth;
      context.stroke();
      context.closePath();
    };

    const handleClear = () => {
      clearLocalCanvas();
    };

    const handleRequestState = ({ requesterId }) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL();
        emit('whiteboard-send-state', { requesterId, canvasData: dataUrl });
      }
    };

    const handleSendState = ({ canvasData }) => {
      if (canvasData) {
        drawImageOnCanvas(canvasData);
      }
    };

    on('whiteboard-draw', handleDraw);
    on('whiteboard-clear', handleClear);
    on('whiteboard-request-state', handleRequestState);
    on('whiteboard-send-state', handleSendState);

    return () => {
      off('whiteboard-draw', handleDraw);
      off('whiteboard-clear', handleClear);
      off('whiteboard-request-state', handleRequestState);
      off('whiteboard-send-state', handleSendState);
    };
  }, [on, off, emit]);

  // Periodic Auto-save to Mongo
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasChangesRef.current) {
        saveToDatabase(true);
      }
    }, 10000); // Check and auto-save every 10 seconds

    return () => clearInterval(interval);
  }, [boardId]);

  const saveToDatabase = async (isAuto = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isAuto) setSaving(true);
    try {
      const dataUrl = canvas.toDataURL();
      await whiteboardAPI.save(boardId, dataUrl);
      hasChangesRef.current = false;
      if (!isAuto) toast.success('Saved to room', 'Whiteboard drawing successfully saved.');
    } catch (err) {
      console.error('[Whiteboard] Auto-save error:', err);
      if (!isAuto) toast.error('Save failed', 'Could not save whiteboard drawing.');
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  // Drawing event handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const brushColor = isEraser ? '#141416' : color; // match drawing container background
    const brushWidth = lineWidth;

    context.beginPath();
    context.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    context.lineTo(x, y);
    context.strokeStyle = brushColor;
    context.lineWidth = brushWidth;
    context.stroke();
    context.closePath();

    // Broadcast stroke to other room members
    emit('whiteboard-draw', {
      boardId,
      drawData: {
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: x,
        y1: y,
        brushColor,
        brushWidth,
      },
    });

    lastPosRef.current = { x, y };
    hasChangesRef.current = true;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      hasChangesRef.current = true;
    }
  };

  // Clear Whiteboard for everyone
  const clearWhiteboard = () => {
    clearLocalCanvas();
    emit('whiteboard-clear', { boardId });
    toast.info('Whiteboard cleared', 'Canvas cleared for everyone.');
  };

  // Download whiteboard drawing
  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `whiteboard-${boardId}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Downloaded', 'Whiteboard saved as PNG.');
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#141416', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.01)',
        flexWrap: 'wrap', gap: 12
      }}>
        {/* Brush colors and options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Colors */}
          <div style={{ display: 'flex', gap: 6 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                style={{
                  width: 22, height: 22, borderRadius: '50%', background: c,
                  border: color === c && !isEraser ? '2px solid #ede9e3' : '2px solid transparent',
                  cursor: 'pointer', outlineOffset: 1, scale: color === c && !isEraser ? 1.08 : 1,
                  boxShadow: color === c && !isEraser ? `0 0 8px ${c}88` : 'none', transition: 'all 0.15s'
                }}
                aria-label={`Brush color ${c}`}
              />
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Draw / Erase toggles */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 8, gap: 2 }}>
            <button
              onClick={() => setIsEraser(false)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: !isEraser ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: !isEraser ? '#ede9e3' : '#6e6a65', display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, fontWeight: 600
              }}
            >
              <Paintbrush size={13} style={{ color: !isEraser ? '#2dd4bf' : '#6e6a65' }} /> Draw
            </button>
            <button
              onClick={() => setIsEraser(true)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: isEraser ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isEraser ? '#ede9e3' : '#6e6a65', display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, fontWeight: 600
              }}
            >
              <Eraser size={13} style={{ color: isEraser ? '#2dd4bf' : '#6e6a65' }} /> Erase
            </button>
          </div>

          {/* Thickness range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#6e6a65', fontWeight: 600 }}>Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{ width: 80, accentColor: '#2dd4bf', cursor: 'pointer', height: 4 }}
            />
            <span style={{ fontSize: 11, color: '#a8a29e', fontFamily: 'var(--font-mono)', minWidth: 16 }}>{lineWidth}px</span>
          </div>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={clearWhiteboard}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, height: 26 }}
            title="Clear canvas for everyone"
          >
            <RotateCcw size={12} style={{ color: '#ef4444' }} /> Clear
          </button>
          <button
            onClick={downloadWhiteboard}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, height: 26 }}
            title="Download canvas as image"
          >
            <Download size={12} style={{ color: '#2dd4bf' }} /> Export
          </button>
          <button
            onClick={() => saveToDatabase(false)}
            disabled={saving}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, height: 26 }}
            title="Save drawings to cloud storage"
          >
            {saving ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={12} style={{ color: '#10b981' }} />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Canvas Drawing Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: '#141416', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10
          }}>
            <RefreshCw size={24} style={{ color: '#2dd4bf', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#6e6a65', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Loading canvas...
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ display: 'block', cursor: isEraser ? 'cell' : 'crosshair' }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
