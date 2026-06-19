import { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MoreHorizontal, X, Minimize2, Maximize2 } from 'lucide-react';
import TaskCard from './TaskCard';

const AnimatedCounter = ({ value }) => {
  return (
    <motion.span
      key={value}
      initial={{ scale: 0.7, opacity: 0, y: -4 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      style={{
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
        padding: '1px 7px', borderRadius: 4, flexShrink: 0,
        background: 'rgba(255,255,255,0.04)', color: '#6e6a65',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'inline-block',
      }}
    >
      {value}
    </motion.span>
  );
};

const Column = ({ list, index, isDragging, onAddCard, onDeleteCard, onUpdateCard, onUpdateList, onDeleteList }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  useEffect(() => {
    setEditTitle(list.title);
  }, [list.title]);

  const handleRename = async () => {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      await onUpdateList(list._id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    setIsSubmitting(true);
    await onAddCard(list._id, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
    setIsSubmitting(false);
  };

  if (isCollapsed) {
    return (
      <motion.div
        layout
        initial={{ width: 280 }}
        animate={{ width: 48 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 180px)',
          background: '#212125',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          overflow: 'hidden',
          alignItems: 'center',
          padding: '12px 0',
          gap: 16,
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="btn-icon"
          aria-label="Expand column"
          style={{ padding: 6 }}
        >
          <Maximize2 size={13} />
        </button>

        <div style={{
          writingMode: 'vertical-rl',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: 10,
          fontWeight: 700,
          color: '#6e6a65',
          flex: 1,
          textAlign: 'center',
          transform: 'rotate(180deg)',
          userSelect: 'none',
          cursor: 'pointer',
        }}
          onClick={() => setIsCollapsed(false)}
        >
          {list.title}
        </div>

        <AnimatedCounter value={list.cards?.length || 0} />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ width: 48 }}
      animate={{ width: 280 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
        background: '#212125',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setIsEditingTitle(false); setEditTitle(list.title); }
              }}
              className="input"
              style={{ fontSize: 13, fontWeight: 700, padding: '4px 8px', height: 26, width: '100%' }}
              autoFocus
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, cursor: 'text' }}
              onClick={() => setIsEditingTitle(true)}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#ede9e3',
                letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-heading)',
              }}>
                {list.title}
              </span>
              <AnimatedCounter value={list.cards?.length || 0} />
            </div>
          )}
        </div>

        {/* Column actions menu & collapse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse column"
            className="btn-icon"
            style={{ padding: 5 }}
          >
            <Minimize2 size={13} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              id={`column-menu-${list._id}`}
              onClick={() => setShowMenu(p => !p)}
              aria-label="Column options"
              style={{
                padding: 5, borderRadius: 6, border: 'none', background: 'transparent',
                cursor: 'pointer', color: '#6e6a65', display: 'flex',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ede9e3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6e6a65'; }}
            >
              <MoreHorizontal size={15} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                      width: 160, zIndex: 50,
                      background: '#28282d', border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 10, padding: '6px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    }}
                  >
                    <button
                      id={`delete-list-${list._id}`}
                      onClick={() => { onDeleteList(); setShowMenu(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 7, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        fontSize: 12, fontWeight: 500, color: '#e8725e',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,69,54,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={13} />
                      Delete column
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cards droppable area */}
      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 80,
              background: snapshot.isDraggingOver ? 'rgba(45, 212, 191, 0.03)' : 'transparent',
              border: snapshot.isDraggingOver ? '1.5px dashed rgba(45, 212, 191, 0.30)' : '1.5px dashed transparent',
              boxShadow: snapshot.isDraggingOver ? 'inset 0 0 12px rgba(45, 212, 191, 0.06)' : 'none',
              borderRadius: 8,
              transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <AnimatePresence initial={false}>
              {(list.cards || []).map((card, idx) => (
                <TaskCard
                  key={card._id}
                  card={card}
                  index={idx}
                  listId={list._id}
                  onDelete={onDeleteCard}
                  onUpdate={onUpdateCard}
                />
              ))}
            </AnimatePresence>

            {provided.placeholder}

            {/* Empty state */}
            {!list.cards?.length && !snapshot.isDraggingOver && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 16px', opacity: 0.3, pointerEvents: 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1.5px dashed rgba(255,255,255,0.2)',
                  marginBottom: 8,
                }} />
                <p style={{ fontSize: 11, color: '#6e6a65', fontWeight: 500 }}>Drop cards here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add card footer */}
      <div style={{
        padding: '8px 10px', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <AnimatePresence mode="wait">
          {addingCard ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleAddCard}
              id={`add-card-form-${list._id}`}
            >
              <textarea
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(e); }
                  if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
                }}
                placeholder="Card title…"
                rows={2}
                className="input"
                style={{ fontSize: 13, resize: 'none', marginBottom: 8, lineHeight: 1.4 }}
                autoFocus
                id={`card-title-input-${list._id}`}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="submit"
                  id={`confirm-add-card-${list._id}`}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                >
                  {isSubmitting ? <div className="spinner" style={{ width: 13, height: 13 }} /> : 'Add card'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                  style={{
                    padding: '7px 10px', borderRadius: 7, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: '#6e6a65', display: 'flex',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ede9e3'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6e6a65'}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              id={`add-card-btn-${list._id}`}
              onClick={() => setAddingCard(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '7px 12px', borderRadius: 7,
                border: '1px dashed transparent', background: 'transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 500,
                color: '#6e6a65', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#2dd4bf';
                e.currentTarget.style.borderColor = 'rgba(45,212,191,0.25)';
                e.currentTarget.style.background = 'rgba(45,212,191,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6e6a65';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Plus size={13} style={{ color: '#2dd4bf' }} />
              Add card
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Column;
