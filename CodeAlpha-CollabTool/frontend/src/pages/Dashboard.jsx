import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Users, Calendar, X, Palette, Search,
  Grid, List, FolderOpen, ChevronRight, Layers, Layout,
  ArrowUpDown, AlertTriangle, LayoutGrid, TrendingUp, Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { boardsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const COLORS = [
  '#2dd4bf', '#14b8a6', '#9775d4', '#5ba4cf',
  '#6b8f71', '#daa520', '#e07a5f', '#c44536',
  '#b07d62', '#7c9a92',
];

const PRESETS = [
  { name: 'Sprint Board', title: 'Engineering Sprint', description: 'Kanban for dev, QA, and CI/CD cycles.', coverColor: '#2dd4bf' },
  { name: 'Design Tracker', title: 'Design System', description: 'Assets, tokens, and research reviews.', coverColor: '#9775d4' },
  { name: 'Weekly Goals', title: 'Weekly Goals', description: 'Personal deliverables and action items.', coverColor: '#6b8f71' },
];

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const relativeTime = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};

/* ── 3D Tilt hook ────────────────────────────────────────── */
const useTilt = (ref) => {
  const [style, setStyle] = useState({});

  const onMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px) scale(1.01)`,
      transition: 'transform 0.1s ease-out',
    });
  }, [ref]);

  const onLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(600px) rotateY(0) rotateX(0) translateY(0) scale(1)',
      transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, []);

  return { style, onMove, onLeave };
};

/* ── Board Tile Component ────────────────────────────────── */
const BoardTile = ({ board, user, onDelete, onClick }) => {
  const ref = useRef(null);
  const { style, onMove, onLeave } = useTilt(ref);
  const isOwner = board.owner?._id === user?._id;

  return (
    <motion.div
      ref={ref}
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="board-tile"
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div style={{ height: 3, background: board.coverColor, flexShrink: 0 }} />
      <div style={{ padding: '18px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.04)', color: '#6e6a65',
            border: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.04em',
          }}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
          {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(board._id); }}
              className="delete-btn"
              style={{
                padding: 5, borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: '#6e6a65', transition: 'all 0.15s', opacity: 0,
              }}
              aria-label="Delete board"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#ede9e3',
          letterSpacing: '-0.01em', marginBottom: 6, lineHeight: 1.3, flex: 1,
          fontFamily: 'var(--font-heading)',
        }}>
          {board.title}
        </h3>
        <p style={{
          fontSize: 12, color: '#6e6a65', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {board.description || 'No description provided.'}
        </p>
      </div>
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6e6a65', fontSize: 11 }}>
          <Users size={11} />
          <span>{1 + (board.members?.length || 0)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6e6a65', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <span>{relativeTime(board.updatedAt || board.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterTab, setFilterTab] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '', coverColor: '#2dd4bf' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await boardsAPI.getAll();
      setBoards(res.data.boards || []);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      toast.error('Failed to load', 'Could not fetch your boards.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  // Keyboard shortcut: Ctrl+N = new board
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowModal(true);
      }
      if (e.key === 'Escape') {
        setShowModal(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBoard.title.trim()) return setCreateError('Title is required.');
    setIsCreating(true);
    setCreateError('');
    try {
      const res = await boardsAPI.create(newBoard);
      setBoards(prev => [res.data.board, ...prev]);
      setShowModal(false);
      setNewBoard({ title: '', description: '', coverColor: '#2dd4bf' });
      toast.success('Board created', `"${res.data.board.title}" is ready.`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create board.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await boardsAPI.delete(deleteTarget);
      setBoards(prev => prev.filter(b => b._id !== deleteTarget));
      toast.info('Board deleted', 'Board and its contents removed.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Delete failed', 'Could not delete the board.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = boards.filter(b => {
    if (filterTab === 'owned' && b.owner?._id !== user?._id) return false;
    if (filterTab === 'shared' && b.owner?._id === user?._id) return false;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  const ownedCount = boards.filter(b => b.owner?._id === user?._id).length;
  const sharedCount = boards.length - ownedCount;

  const NAV_TABS = [
    { id: 'all', label: 'All Rooms', icon: LayoutGrid, count: boards.length, accent: '#2dd4bf' },
    { id: 'owned', label: 'Created by me', icon: Layout, count: ownedCount, accent: '#6b8f71' },
    { id: 'shared', label: 'Shared with me', icon: Users, count: sharedCount, accent: '#9775d4' },
  ];

  return (
    <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ paddingTop: 56, flex: 1, display: 'flex', maxWidth: 1440, width: '100%', margin: '0 auto' }}>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className="sidebar" style={{
          width: 240, flexShrink: 0, padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: 'rgba(45,212,191,0.05)',
            border: '1px solid rgba(45,212,191,0.12)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6e6a65', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
              Workspace
            </p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#ede9e3', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>
              {user?.name?.split(' ')[0]}'s Studio
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <div className="status-dot status-dot-online" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, color: '#8fb896', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Live sync</span>
            </div>
          </div>

          <nav>
            <p className="section-label" style={{ marginBottom: 8, paddingLeft: 4 }}>Views</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`sidebar-item ${filterTab === tab.id ? 'active' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <tab.icon size={14} style={{ color: filterTab === tab.id ? tab.accent : '#45413d', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    padding: '1px 6px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.04)', color: '#6e6a65',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          <div>
            <p className="section-label" style={{ marginBottom: 8, paddingLeft: 4 }}>Templates</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setNewBoard({ title: p.title, description: p.description, coverColor: p.coverColor }); setShowModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 8, background: 'none',
                    border: '1px solid transparent', cursor: 'pointer', width: '100%',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.coverColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#a8a29e' }}>{p.name}</span>
                  </div>
                  <ChevronRight size={12} style={{ color: '#45413d' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Shortcut hint */}
          <div style={{
            marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#45413d' }}>
              <span>New room</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <span className="kbd">Ctrl</span>
                <span className="kbd">N</span>
              </div>
            </div>
            <p style={{ fontSize: 10, color: '#45413d', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              CollabTool v1.0
            </p>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────── */}
        <main style={{ flex: 1, padding: '32px 32px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f5f0eb', letterSpacing: '-0.03em', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
                Studio Workspace
              </h1>
              <p style={{ fontSize: 13, color: '#6e6a65' }}>
                Manage your collaboration rooms and work in real-time
              </p>
            </div>
            <motion.button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} /> New Room
            </motion.button>
          </div>

          {/* Stats bar */}
          {!isLoading && boards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}
            >
              {[
                { icon: Layers, label: 'Total Rooms', value: boards.length, color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)' },
                { icon: TrendingUp, label: 'Active', value: ownedCount, color: '#6b8f71', bg: 'rgba(107,143,113,0.10)' },
                { icon: Users, label: 'Shared', value: sharedCount, color: '#9775d4', bg: 'rgba(151,117,212,0.10)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                    <s.icon size={16} />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…" className="input input-sm" style={{ paddingLeft: 34 }} />
            </div>

            <div style={{ position: 'relative' }}>
              <ArrowUpDown size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input input-sm" style={{ paddingLeft: 30, paddingRight: 12, appearance: 'none', cursor: 'pointer', minWidth: 140 }}>
                <option value="recent">Last activity</option>
                <option value="name">Name A–Z</option>
                <option value="created">Date created</option>
              </select>
            </div>

            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3, gap: 2,
            }}>
              {[{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} aria-label={`${mode} view`}
                  style={{
                    padding: '5px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: viewMode === mode ? '#ede9e3' : '#6e6a65',
                    transition: 'all 0.15s', display: 'flex',
                  }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>

            {search && (
              <button onClick={() => setSearch('')} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6,
                background: 'rgba(196,69,54,0.08)', border: '1px solid rgba(196,69,54,0.15)',
                color: '#e8725e', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#6e6a65', marginBottom: 16, fontWeight: 500 }}>
            {sorted.length} {sorted.length === 1 ? 'room' : 'rooms'}
            {filterTab !== 'all' && ` · ${filterTab === 'owned' ? 'Created by me' : 'Shared with me'}`}
          </p>

          {/* Content */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderOpen size={28} style={{ color: '#45413d' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#a8a29e', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
                {search ? `No rooms match "${search}"` : 'No rooms yet'}
              </h3>
              <p style={{ fontSize: 13, color: '#6e6a65', maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
                {search ? 'Try a different search term.' : 'Create your first room to start collaborating with your team.'}
              </p>
              {!search && (
                <motion.button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '9px 18px' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Sparkles size={15} /> Create first room
                </motion.button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}
            >
              {sorted.map(board => (
                <BoardTile
                  key={board._id}
                  board={board}
                  user={user}
                  onDelete={setDeleteTarget}
                  onClick={() => navigate(`/board/${board._id}`)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#212125', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {sorted.map((board, idx) => {
                const isOwner = board.owner?._id === user?._id;
                return (
                  <div key={board._id} onClick={() => navigate(`/board/${board._id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '14px 20px',
                      borderBottom: idx < sorted.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s', gap: 14,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: board.coverColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#ede9e3', marginBottom: 2, fontFamily: 'var(--font-heading)' }}>{board.title}</p>
                      <p style={{ fontSize: 12, color: '#6e6a65', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {board.description || 'No description'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#6e6a65', fontFamily: 'var(--font-mono)' }}>{isOwner ? 'Owner' : 'Member'}</span>
                      <span style={{ fontSize: 11, color: '#6e6a65', fontFamily: 'var(--font-mono)' }}>{relativeTime(board.updatedAt || board.createdAt)}</span>
                      {isOwner && (
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(board._id); }}
                          style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6e6a65', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#e8725e'; e.currentTarget.style.background = 'rgba(196,69,54,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6e6a65'; e.currentTarget.style.background = 'transparent'; }}
                          aria-label="Delete board">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>

      {/* ── CREATE BOARD MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ede9e3', fontFamily: 'var(--font-heading)' }}>Create new room</h2>
                <button onClick={() => setShowModal(false)} className="btn-icon"><X size={16} /></button>
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <p className="section-label" style={{ marginBottom: 8 }}>Start from a template</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {PRESETS.map((p, i) => (
                      <button key={i} type="button"
                        onClick={() => setNewBoard({ title: p.title, description: p.description, coverColor: p.coverColor })}
                        style={{
                          padding: '10px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
                          background: 'rgba(255,255,255,0.02)', cursor: 'pointer', position: 'relative',
                          overflow: 'hidden', transition: 'all 0.15s', textAlign: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = p.coverColor + '55'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.coverColor }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#a8a29e' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {createError && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(196,69,54,0.08)', border: '1px solid rgba(196,69,54,0.20)', color: '#e8725e', fontSize: 13 }}>
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="label" htmlFor="board-title">Room title <span style={{ color: '#e8725e' }}>*</span></label>
                    <input id="board-title" type="text" value={newBoard.title} onChange={e => setNewBoard(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Project War Room" className="input" required autoFocus />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label className="label" htmlFor="board-description">Description</label>
                    <textarea id="board-description" value={newBoard.description} onChange={e => setNewBoard(p => ({ ...p, description: e.target.value }))}
                      placeholder="What is this room for?" rows={2} className="input" style={{ resize: 'none', lineHeight: 1.5 }} />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Palette size={12} /> Accent color
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {COLORS.map(color => (
                        <motion.button key={color} type="button"
                          onClick={() => setNewBoard(p => ({ ...p, coverColor: color }))}
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          style={{
                            width: 28, height: 28, borderRadius: 7, background: color,
                            border: `2px solid ${newBoard.coverColor === color ? '#f5f0eb' : 'transparent'}`,
                            cursor: 'pointer', transition: 'border 0.15s',
                            boxShadow: newBoard.coverColor === color ? `0 0 10px ${color}66` : 'none',
                          }} aria-label={color} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <motion.button type="submit" disabled={isCreating} className="btn btn-primary" style={{ flex: 1 }}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      {isCreating ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : 'Create room'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ─────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <motion.div className="modal"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()} style={{ maxWidth: 380, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px', background: 'rgba(196,69,54,0.10)', border: '1px solid rgba(196,69,54,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} style={{ color: '#c44536' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ede9e3', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Delete room?</h3>
              <p style={{ fontSize: 13, color: '#6e6a65', lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete the collaboration room along with all its lists and cards.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleDelete} disabled={isDeleting}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 8, border: 'none',
                    background: '#c44536', color: '#fff', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#a53828'}
                  onMouseLeave={e => e.currentTarget.style.background = '#c44536'}>
                  {isDeleting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Deleting…</> : 'Delete room'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`.board-tile:hover .delete-btn { opacity: 1 !important; color: #e8725e !important; }`}</style>
    </div>
  );
};

export default Dashboard;
