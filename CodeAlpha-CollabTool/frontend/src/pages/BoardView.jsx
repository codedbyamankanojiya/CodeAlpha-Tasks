import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext } from '@hello-pangea/dnd';
import {
  ArrowLeft, Plus, Loader2, Search, Filter, X, AlertTriangle,
  Bell, Activity, Layers, PlusCircle, Move, Edit3, Trash2, UserPlus, PieChart, Video
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Column from '../components/Column';
import ActiveUsersBar from '../components/ActiveUsersBar';
import { boardsAPI, listsAPI, cardsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import VideoConference from '../components/VideoConference';
import Whiteboard from '../components/Whiteboard';
import SecureFileSharing from '../components/SecureFileSharing';

const LABEL_OPTIONS = ['bug', 'feature', 'design', 'backend', 'frontend', 'urgent', 'review'];

const BoardView = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, on, off, isConnected } = useSocket();
  const { toast } = useToast();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);

  const [cardSearch, setCardSearch] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);

  const [listToDelete, setListToDelete] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [stats, setStats] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const boardJoinedRef = useRef(false);

  // Tabbed workspace & video call panel states
  const [activeTab, setActiveTab] = useState('kanban'); // kanban, whiteboard, files
  const [showVideoCall, setShowVideoCall] = useState(false);

  const pushActivity = useCallback((data) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setActivities(prev => [{ id: Math.random().toString(36), ...data, time }, ...prev].slice(0, 40));
    setUnreadCount(c => (showActivity ? 0 : c + 1));
  }, [showActivity]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await boardsAPI.getStats(boardId);
      setStats(res.data.stats);
    } catch (err) {
      console.error('[BoardView] fetch stats error:', err);
    }
  }, [boardId]);

  const fetchBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await boardsAPI.getById(boardId);
      const { board: b } = res.data;
      setBoard(b);
      setLists(b.lists || []);
      setActivities([{
        id: 'init', type: 'init', username: 'System',
        message: `Board "${b.title}" loaded.`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board.');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);
  
  useEffect(() => {
    if (boardId) fetchStats();
  }, [boardId, lists, fetchStats]);
  useEffect(() => { if (showActivity) setUnreadCount(0); }, [showActivity]);

  useEffect(() => {
    if (!isConnected || !boardId || !user || boardJoinedRef.current) return;
    emit('join-board', { boardId, user });
    boardJoinedRef.current = true;
    return () => { emit('leave-board', { boardId }); boardJoinedRef.current = false; };
  }, [isConnected, boardId, user, emit]);

  useEffect(() => {
    const handleActiveUsers = ({ users }) => setActiveUsers(users);
    const handleCardMoved = ({ cardId, sourceListId, targetListId, sourceIndex, targetIndex }) => {
      setLists(prev => {
        const next = prev.map(l => ({ ...l, cards: [...l.cards] }));
        const src = next.find(l => l._id === sourceListId);
        const tgt = next.find(l => l._id === targetListId);
        if (!src || !tgt) return prev;
        const [card] = src.cards.splice(src.cards.findIndex(c => c._id === cardId), 1);
        if (!card) return prev;
        card.listId = targetListId;
        tgt.cards.splice(targetIndex, 0, card);
        pushActivity({ type: 'move', username: 'Collaborator', cardTitle: card.title, listTitle: tgt.title });
        return next;
      });
    };
    const handleCardAdded = ({ card }) => {
      setLists(prev => prev.map(l => {
        if (l._id === card.listId) {
          pushActivity({ type: 'add', username: 'Collaborator', cardTitle: card.title, listTitle: l.title });
          return { ...l, cards: [...l.cards, card] };
        }
        return l;
      }));
    };
    const handleCardUpdated = ({ card }) => {
      setLists(prev => prev.map(l => {
        if (l._id === card.listId) {
          pushActivity({ type: 'update', username: 'Collaborator', cardTitle: card.title });
          return { ...l, cards: l.cards.map(c => c._id === card._id ? card : c) };
        }
        return l;
      }));
    };
    const handleCardDeleted = ({ cardId, listId }) => {
      setLists(prev => prev.map(l => {
        if (l._id === listId) {
          const card = l.cards.find(c => c._id === cardId);
          if (card) pushActivity({ type: 'delete', username: 'Collaborator', cardTitle: card.title, listTitle: l.title });
          return { ...l, cards: l.cards.filter(c => c._id !== cardId) };
        }
        return l;
      }));
    };
    const handleListAdded = ({ list }) => {
      setLists(prev => [...prev, { ...list, cards: [] }]);
      pushActivity({ type: 'create-list', username: 'Collaborator', listTitle: list.title });
    };
    const handleListDeleted = ({ listId }) => {
      setLists(prev => {
        const l = prev.find(x => x._id === listId);
        if (l) pushActivity({ type: 'delete-list', username: 'Collaborator', listTitle: l.title });
        return prev.filter(x => x._id !== listId);
      });
    };
    const handleListUpdated = ({ list }) => {
      setLists(prev => prev.map(l => l._id === list._id ? { ...l, title: list.title } : l));
      pushActivity({ type: 'update-list', username: 'Collaborator', listTitle: list.title });
    };
    const handleUserTyping = ({ userId, name, isTyping }) => {
      setActiveUsers(prev => prev.map(u => u.userId === userId ? { ...u, isTyping } : u));
    };

    on('active-users-update', handleActiveUsers);
    on('card-moved-update', handleCardMoved);
    on('card-added', handleCardAdded);
    on('card-updated', handleCardUpdated);
    on('card-deleted', handleCardDeleted);
    on('list-added', handleListAdded);
    on('list-deleted', handleListDeleted);
    on('list-updated', handleListUpdated);
    on('user-typing-update', handleUserTyping);

    return () => {
      off('active-users-update', handleActiveUsers);
      off('card-moved-update', handleCardMoved);
      off('card-added', handleCardAdded);
      off('card-updated', handleCardUpdated);
      off('card-deleted', handleCardDeleted);
      off('list-added', handleListAdded);
      off('list-deleted', handleListDeleted);
      off('list-updated', handleListUpdated);
      off('user-typing-update', handleUserTyping);
    };
  }, [on, off, pushActivity]);

  const getFilteredCards = useCallback((cards = []) => {
    return cards.filter(card => {
      const matchSearch = cardSearch
        ? card.title.toLowerCase().includes(cardSearch.toLowerCase()) ||
          (card.description || '').toLowerCase().includes(cardSearch.toLowerCase())
        : true;
      const matchLabels = selectedLabels.length > 0
        ? selectedLabels.some(l => card.labels?.includes(l))
        : true;
      return matchSearch && matchLabels;
    });
  }, [cardSearch, selectedLabels]);

  const toggleLabel = (label) => setSelectedLabels(prev =>
    prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
  );

  const isFiltering = cardSearch || selectedLabels.length > 0;

  const onDragStart = () => setIsDragging(true);

  const onDragEnd = useCallback(async (result) => {
    setIsDragging(false);
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcListId = source.droppableId;
    const tgtListId = destination.droppableId;

    let resolvedSrcIdx = source.index;
    let resolvedTgtIdx = destination.index;

    const srcList = lists.find(l => l._id === srcListId);
    const tgtList = lists.find(l => l._id === tgtListId);

    if (srcList && tgtList) {
      const filteredSrc = getFilteredCards(srcList.cards);
      const filteredTgt = getFilteredCards(tgtList.cards);
      const movedCard = filteredSrc[source.index];
      if (movedCard) {
        resolvedSrcIdx = srcList.cards.findIndex(c => c._id === movedCard._id);
        if (destination.index < filteredTgt.length) {
          resolvedTgtIdx = tgtList.cards.findIndex(c => c._id === filteredTgt[destination.index]._id);
        } else {
          resolvedTgtIdx = tgtList.cards.length;
        }
        pushActivity({ type: 'move', username: user.name, cardTitle: movedCard.title, listTitle: tgtList.title });
      }
    }

    setLists(prev => {
      const next = prev.map(l => ({ ...l, cards: [...l.cards] }));
      const s = next.find(l => l._id === srcListId);
      const t = next.find(l => l._id === tgtListId);
      if (!s || !t) return prev;
      const [card] = s.cards.splice(resolvedSrcIdx, 1);
      if (!card) return prev;
      card.listId = tgtListId;
      t.cards.splice(resolvedTgtIdx, 0, card);
      return next;
    });

    emit('move-card', { cardId: draggableId, sourceListId: srcListId, targetListId: tgtListId, sourceIndex: resolvedSrcIdx, targetIndex: resolvedTgtIdx, boardId });

    try {
      await cardsAPI.move(draggableId, { sourceListId: srcListId, targetListId: tgtListId, sourceIndex: resolvedSrcIdx, targetIndex: resolvedTgtIdx });
    } catch (err) {
      console.error('[BoardView] Move error:', err);
      fetchBoard();
    }
  }, [boardId, emit, fetchBoard, getFilteredCards, lists, pushActivity, user.name]);

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setIsAddingList(true);
    try {
      const res = await listsAPI.create({ title: newListTitle.trim(), boardId });
      const newList = { ...res.data.list, cards: [] };
      setLists(prev => [...prev, newList]);
      emit('add-list', { list: res.data.list, boardId });
      pushActivity({ type: 'create-list', username: user.name, listTitle: newListTitle.trim() });
      setNewListTitle('');
      setAddingList(false);
    } catch (err) {
      console.error('[BoardView] Add list error:', err);
    } finally {
      setIsAddingList(false);
    }
  };

  const handleUpdateList = useCallback(async (listId, updates) => {
    try {
      const res = await listsAPI.update(listId, updates);
      setLists(prev => prev.map(l => l._id === listId ? { ...l, ...res.data.list } : l));
      emit('update-list', { list: res.data.list, boardId });
      pushActivity({ type: 'update-list', username: user.name, listTitle: res.data.list.title });
    } catch (err) {
      console.error('[BoardView] Update list error:', err);
    }
  }, [boardId, emit, pushActivity, user.name]);

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await listsAPI.delete(listToDelete._id);
      setLists(prev => prev.filter(l => l._id !== listToDelete._id));
      emit('delete-list', { listId: listToDelete._id, boardId });
      pushActivity({ type: 'delete-list', username: user.name, listTitle: listToDelete.title });
      setListToDelete(null);
    } catch (err) {
      console.error('[BoardView] Delete list error:', err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError('');
    try {
      const res = await boardsAPI.invite(boardId, inviteEmail.trim());
      setBoard(prev => ({ ...prev, members: [...(prev.members || []), res.data.member] }));
      toast.success('Member invited', `${inviteEmail} has been added to the board.`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to invite member.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAddCard = useCallback(async (listId, title) => {
    try {
      const res = await cardsAPI.create({ title, listId, boardId });
      const card = res.data.card;
      setLists(prev => prev.map(l => {
        if (l._id === listId) {
          pushActivity({ type: 'add', username: user.name, cardTitle: title, listTitle: l.title });
          return { ...l, cards: [...l.cards, card] };
        }
        return l;
      }));
      emit('add-card', { card, boardId });
    } catch (err) {
      console.error('[BoardView] Add card error:', err);
    }
  }, [boardId, emit, pushActivity, user.name]);

  const handleDeleteCard = useCallback(async (cardId, listId) => {
    try {
      await cardsAPI.delete(cardId);
      setLists(prev => prev.map(l => {
        if (l._id === listId) {
          const card = l.cards.find(c => c._id === cardId);
          if (card) pushActivity({ type: 'delete', username: user.name, cardTitle: card.title, listTitle: l.title });
          return { ...l, cards: l.cards.filter(c => c._id !== cardId) };
        }
        return l;
      }));
      emit('delete-card', { cardId, listId, boardId });
    } catch (err) {
      console.error('[BoardView] Delete card error:', err);
    }
  }, [boardId, emit, pushActivity, user.name]);

  const handleUpdateCard = useCallback(async (cardId, listId, updates) => {
    try {
      const res = await cardsAPI.update(cardId, updates);
      const updated = res.data.card;
      setLists(prev => prev.map(l => {
        if (l._id === listId) {
          pushActivity({ type: 'update', username: user.name, cardTitle: updated.title });
          return { ...l, cards: l.cards.map(c => c._id === cardId ? updated : c) };
        }
        return l;
      }));
      emit('update-card', { card: updated, boardId });
    } catch (err) {
      console.error('[BoardView] Update card error:', err);
    }
  }, [boardId, emit, pushActivity, user.name]);

  const renderActivityIcon = (type) => {
    const icons = {
      add: <PlusCircle size={12} style={{ color: '#6b8f71' }} />,
      move: <Move size={12} style={{ color: '#2dd4bf' }} />,
      update: <Edit3 size={12} style={{ color: '#daa520' }} />,
      delete: <Trash2 size={12} style={{ color: '#c44536' }} />,
      'delete-list': <Trash2 size={12} style={{ color: '#c44536' }} />,
      'create-list': <Layers size={12} style={{ color: '#9775d4' }} />,
      'update-list': <Edit3 size={12} style={{ color: '#daa520' }} />,
    };
    return icons[type] || <Activity size={12} style={{ color: '#6e6a65' }} />;
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={32} style={{ color: '#2dd4bf', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 12, color: '#6e6a65', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Loading workspace…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{
            background: '#212125', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '28px 32px', textAlign: 'center', maxWidth: 340,
          }}>
            <p style={{ color: '#e8725e', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <ArrowLeft size={14} /> Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Board Sub-Header ──────────────────────────────────── */}
      <div style={{
        paddingTop: 56, position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(20,20,22,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Top row: title, controls */}
        <div style={{
          maxWidth: 'none', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              id="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="btn-icon"
              aria-label="Back to dashboard"
              style={{ flexShrink: 0 }}
            >
              <ArrowLeft size={15} />
            </button>
            <div style={{
              width: 3, height: 24, borderRadius: 99, flexShrink: 0,
              background: board?.coverColor || '#2dd4bf',
            }} />
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                fontSize: 14, fontWeight: 800, color: '#f5f0eb',
                letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-heading)',
              }}>
                {board?.title}
              </h1>
              {stats && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 10, color: '#a8a29e', fontWeight: 600,
                    cursor: 'default',
                  }}
                  title={`${stats.completedCards} of ${stats.totalCards} cards completed`}
                >
                  <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="6" cy="6" r="4.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                      <circle
                        cx="6" cy="6" r="4.5" fill="none"
                        stroke="#6b8f71"
                        strokeWidth="1.5"
                        strokeDasharray={`${2 * Math.PI * 4.5}`}
                        strokeDashoffset={`${2 * Math.PI * 4.5 * (1 - stats.completionPercentage / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span>{stats.completionPercentage}% done</span>
                </div>
              )}
            </div>
            {board?.description && (
              <p style={{ fontSize: 11, color: '#6e6a65', marginTop: 1 }}>{board.description}</p>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Connection badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, fontSize: 11,
              fontWeight: 600, fontFamily: 'var(--font-mono)',
              background: isConnected ? 'rgba(107,143,113,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isConnected ? 'rgba(107,143,113,0.18)' : 'rgba(255,255,255,0.07)'}`,
              color: isConnected ? '#8fb896' : '#6e6a65',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? '#6b8f71' : '#6e6a65',
                boxShadow: isConnected ? '0 0 0 3px rgba(107,143,113,0.2)' : 'none',
              }} />
              {isConnected ? 'Live' : 'Offline'}
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, height: 26 }}
            >
              <UserPlus size={12} style={{ color: '#2dd4bf' }} />
              Invite
            </button>

            <button
              onClick={() => setShowVideoCall(!showVideoCall)}
              className="btn btn-ghost"
              style={{
                padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, height: 26,
                borderColor: showVideoCall ? 'rgba(45,212,191,0.40)' : 'transparent',
                background: showVideoCall ? 'rgba(45,212,191,0.10)' : 'transparent',
                color: showVideoCall ? '#2dd4bf' : '#6e6a65',
              }}
            >
              <Video size={12} style={{ color: '#2dd4bf' }} />
              {showVideoCall ? 'Hide Call' : 'Video Call'}
            </button>

            <ActiveUsersBar users={activeUsers} />

            {/* Activity toggle */}
            <button
              onClick={() => setShowActivity(v => !v)}
              style={{
                position: 'relative', padding: '7px', borderRadius: 8,
                border: `1px solid ${showActivity ? 'rgba(45,212,191,0.40)' : 'rgba(255,255,255,0.08)'}`,
                background: showActivity ? 'rgba(45,212,191,0.10)' : 'transparent',
                color: showActivity ? '#2dd4bf' : '#6e6a65',
                cursor: 'pointer', display: 'flex', transition: 'all 0.15s',
              }}
              title="Activity log"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#c44536', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter row & workspace tabs */}
        <div style={{
          padding: '8px 24px 10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 8, gap: 2 }}>
            {[
              { id: 'kanban', label: 'Kanban Board' },
              { id: 'whiteboard', label: 'Whiteboard' },
              { id: 'files', label: 'Secure Files' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: activeTab === tab.id ? '#ede9e3' : '#6e6a65',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search / filter (only on Kanban tab) */}
          {activeTab === 'kanban' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{
                  position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  value={cardSearch}
                  onChange={e => setCardSearch(e.target.value)}
                  placeholder="Search cards…"
                  className="input input-sm"
                  style={{ paddingLeft: 30, width: 200 }}
                />
                {cardSearch && (
                  <button
                    onClick={() => setCardSearch('')}
                    style={{
                      position: 'absolute', right: 8, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#6e6a65', display: 'flex',
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Label filter pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#6e6a65', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <Filter size={11} /> Filter:
                </span>
                {LABEL_OPTIONS.map(lbl => {
                  const active = selectedLabels.includes(lbl);
                  return (
                    <button
                      key={lbl}
                      onClick={() => toggleLabel(lbl)}
                      className={`badge badge-${lbl}`}
                      style={{
                        cursor: 'pointer', border: 'none',
                        opacity: active ? 1 : 0.35,
                        outline: active ? '1px solid rgba(255,255,255,0.25)' : 'none',
                        outlineOffset: 1,
                        transform: active ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.15s', padding: '3px 7px',
                      }}
                    >
                      {lbl}
                    </button>
                  );
                })}
                {isFiltering && (
                  <button
                    onClick={() => { setCardSearch(''); setSelectedLabels([]); }}
                    style={{
                      fontSize: 11, fontWeight: 600, color: '#e8725e',
                      padding: '3px 8px', borderRadius: 4, border: 'none',
                      background: 'rgba(196,69,54,0.08)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <X size={10} /> Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Workspace Area ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Side: Active Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'kanban' && (
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div
                className="no-scrollbar"
                style={{
                  flex: 1, display: 'flex', gap: 16, padding: '20px 24px',
                  overflowX: 'auto', overflowY: 'hidden',
                  alignItems: 'flex-start',
                }}
              >
                <AnimatePresence>
                  {lists.map((list, idx) => {
                    const displayCards = getFilteredCards(list.cards);
                    return (
                      <motion.div
                        key={list._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.96 }}
                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                        layout
                      >
                        <Column
                          list={{ ...list, cards: displayCards }}
                          index={idx}
                          isDragging={isDragging}
                          onAddCard={handleAddCard}
                          onDeleteCard={handleDeleteCard}
                          onUpdateCard={handleUpdateCard}
                          onUpdateList={handleUpdateList}
                          onDeleteList={() => setListToDelete(list)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add column */}
                <div style={{ flexShrink: 0, width: 280 }}>
                  {addingList ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: '#212125', border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 12, padding: '14px',
                      }}
                    >
                      <form onSubmit={handleAddList} id="add-list-form">
                        <input
                          type="text"
                          value={newListTitle}
                          onChange={e => setNewListTitle(e.target.value)}
                          placeholder="Column name…"
                          className="input"
                          style={{ marginBottom: 10, fontSize: 13 }}
                          autoFocus
                          id="new-list-title-input"
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            id="confirm-add-list-btn"
                            type="submit"
                            disabled={isAddingList}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '8px', fontSize: 12 }}
                          >
                            {isAddingList ? <div className="spinner" style={{ width: 13, height: 13 }} /> : 'Add column'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingList(false); setNewListTitle(''); }}
                            className="btn btn-ghost"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <button
                      id="add-column-btn"
                      onClick={() => setAddingList(true)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '1.5px dashed rgba(255,255,255,0.08)',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, fontSize: 13, fontWeight: 500, color: '#6e6a65',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#2dd4bf';
                        e.currentTarget.style.borderColor = 'rgba(45,212,191,0.30)';
                        e.currentTarget.style.background = 'rgba(45,212,191,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#6e6a65';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Plus size={16} style={{ color: '#2dd4bf' }} />
                      Add column
                    </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          )}

          {activeTab === 'whiteboard' && (
            <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
              <Whiteboard boardId={boardId} />
            </div>
          )}

          {activeTab === 'files' && (
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
              <SecureFileSharing boardId={boardId} encryptionKey={board?.encryptionKey} />
            </div>
          )}
        </div>

        {/* Right Side: Persistent Video Conference Panel */}
        <AnimatePresence>
          {showVideoCall && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ flexShrink: 0, zIndex: 10 }}
            >
              <VideoConference boardId={boardId} onClose={() => setShowVideoCall(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Activity Sidebar ──────────────────────────────── */}
        <AnimatePresence>
          {showActivity && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                width: 300, flexShrink: 0, background: '#141416',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', zIndex: 20,
              }}
            >
              <div style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#ede9e3',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <Activity size={13} style={{ color: '#2dd4bf' }} />
                  Activity
                </span>
                <button
                  onClick={() => setShowActivity(false)}
                  className="btn-icon"
                  style={{ padding: 5 }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
                {activities.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '40px 16px', opacity: 0.4,
                    fontSize: 11, color: '#6e6a65', fontFamily: 'var(--font-mono)',
                  }}>
                    No activity yet
                  </div>
                ) : activities.map(act => (
                  <div key={act.id} style={{
                    display: 'flex', gap: 10, padding: '10px 4px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      {renderActivityIcon(act.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                        color: '#6e6a65', marginBottom: 3,
                      }}>
                        <span>{act.username}</span>
                        <span>{act.time}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#a8a29e', lineHeight: 1.5 }}>
                        {act.type === 'move' && <>Moved <b style={{ color: '#2dd4bf' }}>"{act.cardTitle}"</b> to <b style={{ color: '#ede9e3' }}>"{act.listTitle}"</b></>}
                        {act.type === 'add' && <>Added <b style={{ color: '#6b8f71' }}>"{act.cardTitle}"</b> to <b style={{ color: '#ede9e3' }}>"{act.listTitle}"</b></>}
                        {act.type === 'update' && <>Updated <b style={{ color: '#daa520' }}>"{act.cardTitle}"</b></>}
                        {act.type === 'delete' && <>Removed <b style={{ color: '#c44536' }}>"{act.cardTitle}"</b></>}
                        {act.type === 'create-list' && <>Created column <b style={{ color: '#9775d4' }}>"{act.listTitle}"</b></>}
                        {act.type === 'delete-list' && <>Deleted column <b style={{ color: '#c44536' }}>"{act.listTitle}"</b></>}
                        {act.type === 'update-list' && <>Renamed column to <b style={{ color: '#daa520' }}>"{act.listTitle}"</b></>}
                        {act.type === 'init' && <span style={{ color: '#6e6a65', fontStyle: 'italic' }}>{act.message}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── DELETE COLUMN MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {listToDelete && (
          <div className="modal-overlay" onClick={() => setListToDelete(null)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 380, padding: '32px', textAlign: 'center' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
                background: 'rgba(196,69,54,0.10)', border: '1px solid rgba(196,69,54,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={22} style={{ color: '#c44536' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f5f0eb', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Delete column?</h3>
              <p style={{ fontSize: 13, color: '#6e6a65', lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete the column <strong style={{ color: '#ede9e3' }}>"{listToDelete.title}"</strong> and all{' '}
                <strong style={{ color: '#ede9e3' }}>{listToDelete.cards?.length || 0}</strong> cards inside it.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setListToDelete(null)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-column-btn"
                  onClick={handleDeleteList}
                  style={{
                    flex: 1, padding: '9px 18px', borderRadius: 8, border: 'none',
                    background: '#c44536', color: '#fff', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#a53828'}
                  onMouseLeave={e => e.currentTarget.style.background = '#c44536'}
                >
                  Delete column
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INVITE MEMBER MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 400, padding: 0 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f5f0eb', fontFamily: 'var(--font-heading)' }}>Invite collaborator</h2>
                <button onClick={() => setShowInviteModal(false)} className="btn-icon"><X size={16} /></button>
              </div>

              <div style={{ padding: 24 }}>
                {inviteError && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(196,69,54,0.08)', border: '1px solid rgba(196,69,54,0.20)', color: '#e8725e', fontSize: 13 }}>
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInvite}>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label" htmlFor="invite-email">Email address</label>
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="input"
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <motion.button type="submit" disabled={isInviting} className="btn btn-primary" style={{ flex: 1 }}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      {isInviting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : 'Add member'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BoardView;
