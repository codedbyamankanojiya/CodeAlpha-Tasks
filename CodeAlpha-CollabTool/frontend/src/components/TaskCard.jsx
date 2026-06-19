import { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, X, Check, Calendar, Tag, FileText,
  CheckSquare, Palette, Clock, CheckCircle2, Edit3
} from 'lucide-react';

const LABEL_OPTIONS = ['bug', 'feature', 'design', 'backend', 'frontend', 'urgent', 'review'];
const COVER_COLORS = ['', '#2dd4bf', '#9775d4', '#5ba4cf', '#6b8f71', '#daa520', '#e07a5f', '#c44536'];

const getRelativeDueDate = (dueDate) => {
  if (!dueDate) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === -1) return 'Overdue yesterday';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
};

const getLeftBorder = (labels = []) => {
  if (labels.includes('urgent')) return '3px solid #c44536';
  if (labels.includes('bug')) return '3px solid #e8725e';
  if (labels.includes('review')) return '3px solid #9775d4';
  return '3px solid transparent';
};


const TaskCard = ({ card, index, listId, onDelete, onUpdate }) => {
  const { boardId } = useParams();
  const { emit } = useSocket();
  const { user } = useAuth();

  const [showDrawer, setShowDrawer] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editDesc, setEditDesc] = useState(card.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (!card.description) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowTooltip(false);
  };

  // Parse markdown checkboxes
  const checklistItems = useMemo(() => {
    const lines = (card.description || '').split('\n');
    return lines.reduce((acc, line, i) => {
      const match = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)$/);
      if (match) acc.push({ lineIndex: i, checked: match[1].toLowerCase() === 'x', text: match[2].trim(), raw: line });
      return acc;
    }, []);
  }, [card.description]);

  const checkStats = useMemo(() => {
    const total = checklistItems.length;
    const done = checklistItems.filter(i => i.checked).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [checklistItems]);

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || editTitle.trim() === card.title) {
      setIsEditingTitle(false);
      setEditTitle(card.title);
      return;
    }
    setIsSaving(true);
    await onUpdate(card._id, listId, { title: editTitle.trim() });
    setIsSaving(false);
    setIsEditingTitle(false);
  };

  const handleSaveDesc = async () => {
    if (editDesc.trim() === (card.description || '')) { setIsEditingDesc(false); return; }
    setIsSaving(true);
    await onUpdate(card._id, listId, { description: editDesc.trim() });
    setIsSaving(false);
    setIsEditingDesc(false);
  };

  const handleToggleChecklist = async (lineIndex, isChecked) => {
    const lines = (card.description || '').split('\n');
    lines[lineIndex] = lines[lineIndex].replace(/\[[ xX]\]/, isChecked ? '[ ]' : '[x]');
    const newDesc = lines.join('\n');
    setEditDesc(newDesc);
    await onUpdate(card._id, listId, { description: newDesc });
  };

  const toggleLabel = async (label) => {
    const current = card.labels || [];
    const next = current.includes(label) ? current.filter(l => l !== label) : [...current, label];
    await onUpdate(card._id, listId, { labels: next });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this card permanently?')) return;
    onDelete(card._id, listId);
    setShowDrawer(false);
  };

  const openDrawer = () => {
    setEditTitle(card.title);
    setEditDesc(card.description || '');
    setShowDrawer(true);
  };

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
        >
          {/* ── CARD ──────────────────────────────────────────── */}
          <div
            onClick={openDrawer}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={snapshot.isDragging ? 'task-card-dragging' : 'task-card'}
            style={{
              padding: '12px 14px',
              cursor: 'pointer',
              overflow: 'visible',
              position: 'relative',
              userSelect: 'none',
              borderLeft: getLeftBorder(card.labels),
            }}
          >
            {/* Tooltip Preview */}
            <AnimatePresence>
              {showTooltip && card.description && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="tooltip"
                  style={{
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    width: 240,
                    whiteSpace: 'normal',
                    lineBreak: 'anywhere',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', fontSize: 11, lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cover color accent */}
            {card.coverColor && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 2, background: card.coverColor,
              }} />
            )}

            <div style={{ paddingTop: card.coverColor ? 4 : 0 }}>
              {/* Labels */}
              {card.labels?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {card.labels.map(lbl => (
                    <span key={lbl} className={`badge badge-${lbl}`}>{lbl}</span>
                  ))}
                </div>
              )}

              {/* Title */}
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#ede9e3',
                lineHeight: 1.45, marginBottom: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {card.title}
              </p>

              {/* Checklist progress */}
              {checkStats.total > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 4, fontSize: 10, color: '#6e6a65', fontFamily: 'var(--font-mono)', fontWeight: 600,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckSquare size={10} /> Tasks
                    </span>
                    <span>{checkStats.done}/{checkStats.total}</span>
                  </div>
                  <div style={{
                    height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: checkStats.pct === 100 ? '#6b8f71' : '#2dd4bf',
                      width: `${checkStats.pct}%`, transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Footer meta */}
              {(card.dueDate || card.description) && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 10, paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {card.dueDate ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                      color: isOverdue ? '#e8725e' : '#6e6a65',
                    }}
                      title={new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    >
                      <Clock size={10} />
                      {getRelativeDueDate(card.dueDate)}
                    </div>
                  ) : <div />}
                  {card.description && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#6e6a65', fontSize: 10 }}>
                      <FileText size={10} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── DRAWER ────────────────────────────────────────── */}
          <AnimatePresence>
            {showDrawer && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', justifyContent: 'flex-end' }}>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                  onClick={() => { setShowDrawer(false); setIsEditingTitle(false); setIsEditingDesc(false); }}
                />

                {/* Drawer panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="drawer"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Cover stripe */}
                  {card.coverColor && (
                    <div style={{ height: 3, background: card.coverColor, flexShrink: 0 }} />
                  )}

                  {/* Drawer header */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                  }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      {isEditingTitle ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onFocus={() => emit('user-typing', { boardId, userId: user?._id, name: user?.name, isTyping: true })}
                            onBlur={() => {
                              handleSaveTitle();
                              emit('user-typing', { boardId, userId: user?._id, name: user?.name, isTyping: false });
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveTitle();
                              if (e.key === 'Escape') { setIsEditingTitle(false); setEditTitle(card.title); }
                            }}
                            className="input"
                            style={{ fontSize: 14, fontWeight: 700, padding: '6px 10px', flex: 1 }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveTitle}
                            disabled={isSaving}
                            style={{
                              padding: '6px 10px', borderRadius: 7, border: 'none',
                              background: '#14b8a6', color: '#0f1f1d', cursor: 'pointer', display: 'flex',
                            }}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <h3
                          onClick={() => setIsEditingTitle(true)}
                          style={{
                            fontSize: 15, fontWeight: 700, color: '#f5f0eb',
                            letterSpacing: '-0.01em', lineHeight: 1.35,
                            cursor: 'text', display: 'flex', alignItems: 'center', gap: 6,
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {card.title}
                          <Edit3 size={12} style={{ color: '#45413d', flexShrink: 0, opacity: 0.6 }} />
                        </h3>
                      )}
                    </div>
                    <button
                      id={`close-card-modal-${card._id}`}
                      onClick={() => { setShowDrawer(false); setIsEditingTitle(false); setIsEditingDesc(false); }}
                      className="btn-icon"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Scrollable body */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                    {/* Description */}
                    <div style={{ marginBottom: 24 }}>
                      <p className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={11} style={{ color: '#2dd4bf' }} /> Description
                      </p>
                      {isEditingDesc ? (
                        <div>
                          <textarea
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            onFocus={() => emit('user-typing', { boardId, userId: user?._id, name: user?.name, isTyping: true })}
                            onBlur={() => {
                              handleSaveDesc();
                              emit('user-typing', { boardId, userId: user?._id, name: user?.name, isTyping: false });
                            }}
                            rows={5}
                            className="input"
                            style={{ resize: 'none', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}
                            placeholder="Add notes, checklist (- [ ] task), or details…"
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={handleSaveDesc}
                              disabled={isSaving}
                              className="btn btn-primary"
                              style={{ padding: '7px 16px', fontSize: 12 }}
                            >
                              {isSaving ? <div className="spinner" style={{ width: 13, height: 13 }} /> : 'Save'}
                            </button>
                            <button
                              onClick={() => { setIsEditingDesc(false); setEditDesc(card.description || ''); }}
                              className="btn btn-ghost"
                              style={{ padding: '7px 12px', fontSize: 12 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsEditingDesc(true)}
                          style={{
                            padding: '12px 14px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'text', minHeight: 72,
                            fontSize: 13, color: card.description ? '#ede9e3' : '#45413d',
                            lineHeight: 1.6, fontStyle: card.description ? 'normal' : 'italic',
                            transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(45,212,191,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                        >
                          {card.description
                            ? <pre style={{ fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', margin: 0 }}>{card.description}</pre>
                            : 'Click to add description…'}
                        </div>
                      )}
                    </div>

                    {/* Checklist */}
                    {checklistItems.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: 10,
                        }}>
                          <p className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={11} style={{ color: '#6b8f71' }} /> Checklist
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6e6a65', fontWeight: 600 }}>
                              {checkStats.done}/{checkStats.total}
                            </span>
                            {/* Circular progress */}
                            <svg width="22" height="22" viewBox="0 0 22 22" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                              <circle
                                cx="11" cy="11" r="9" fill="none"
                                stroke={checkStats.pct === 100 ? '#6b8f71' : '#2dd4bf'}
                                strokeWidth="2.5"
                                strokeDasharray={`${2 * Math.PI * 9}`}
                                strokeDashoffset={`${2 * Math.PI * 9 * (1 - checkStats.pct / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                              />
                            </svg>
                          </div>
                        </div>

                        <div style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8, padding: '8px 12px',
                          display: 'flex', flexDirection: 'column', gap: 2,
                        }}>
                          {checklistItems.map(item => (
                            <div
                              key={item.lineIndex}
                              onClick={() => handleToggleChecklist(item.lineIndex, item.checked)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '6px 4px', cursor: 'pointer', userSelect: 'none',
                              }}
                            >
                              <div style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: `1.5px solid ${item.checked ? '#14b8a6' : 'rgba(255,255,255,0.15)'}`,
                                background: item.checked ? '#14b8a6' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                              }}>
                                {item.checked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path
                                      d="M1.5 4L4 6.5L8.5 1.5"
                                      stroke="#0f1f1d"
                                      strokeWidth="2.0"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeDasharray="24"
                                      strokeDashoffset="24"
                                      style={{ animation: 'draw-check 0.25s ease forwards' }}
                                    />
                                  </svg>
                                )}
                              </div>
                              <span style={{
                                fontSize: 13, color: item.checked ? '#6e6a65' : '#ede9e3',
                                textDecoration: item.checked ? 'line-through' : 'none',
                                transition: 'all 0.15s',
                              }}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Labels */}
                    <div style={{ marginBottom: 24 }}>
                      <p className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={11} style={{ color: '#2dd4bf' }} /> Labels
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {LABEL_OPTIONS.map(lbl => {
                          const active = card.labels?.includes(lbl);
                          return (
                            <button
                              key={lbl}
                              onClick={() => toggleLabel(lbl)}
                              className={`badge badge-${lbl}`}
                              style={{
                                cursor: 'pointer', opacity: active ? 1 : 0.4,
                                transform: active ? 'scale(1.05)' : 'scale(1)',
                                outline: active ? `1px solid rgba(255,255,255,0.20)` : 'none',
                                outlineOffset: 1, transition: 'all 0.15s', border: 'none',
                                fontWeight: active ? 700 : 600,
                                padding: '3px 8px', fontSize: 10,
                              }}
                            >
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cover color */}
                    <div style={{ marginBottom: 24 }}>
                      <p className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Palette size={11} style={{ color: '#2dd4bf' }} /> Cover color
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {COVER_COLORS.map(color => (
                          <button
                            key={color || 'none'}
                            onClick={() => onUpdate(card._id, listId, { coverColor: color })}
                            style={{
                              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                              background: color || 'rgba(255,255,255,0.05)',
                              outline: card.coverColor === color ? '2px solid #f5f0eb' : '2px solid transparent',
                              outlineOffset: 2,
                              transform: card.coverColor === color ? 'scale(1.15)' : 'scale(1)',
                              transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {!color && <X size={12} style={{ color: '#6e6a65' }} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Due date */}
                    <div>
                      <p className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={11} style={{ color: '#2dd4bf' }} /> Due date
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="date"
                          value={card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : ''}
                          onChange={e => onUpdate(card._id, listId, { dueDate: e.target.value || null })}
                          className="input"
                          style={{ fontSize: 13, fontFamily: 'var(--font-mono)', flex: 1 }}
                        />
                        {card.dueDate && (
                          <button
                            onClick={() => onUpdate(card._id, listId, { dueDate: null })}
                            style={{
                              padding: '8px 12px', borderRadius: 8,
                              background: 'rgba(196,69,54,0.08)',
                              border: '1px solid rgba(196,69,54,0.15)',
                              color: '#e8725e', cursor: 'pointer', display: 'flex',
                            }}
                            title="Clear due date"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drawer footer */}
                  <div style={{
                    padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0, background: 'rgba(0,0,0,0.2)',
                  }}>
                    <button
                      onClick={handleDelete}
                      className="btn btn-danger"
                      style={{ width: '100%', justifyContent: 'center', padding: '9px' }}
                    >
                      <Trash2 size={14} /> Delete card
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
