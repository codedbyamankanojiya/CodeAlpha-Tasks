import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, LogOut, ChevronDown, Keyboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [open, setOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isBoardPage = location.pathname.startsWith('/board/');

  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* Scroll progress indicator */}
      {scrollProgress > 0 && (
        <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      )}

      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: '0 24px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link
          to="/dashboard"
          id="navbar-logo"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', userSelect: 'none',
          }}
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(45,212,191,0.2)',
              flexShrink: 0,
            }}
          >
            <Layers size={15} color="#0f1f1d" />
          </motion.div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#ede9e3', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            Collab<span style={{ color: '#2dd4bf' }}>Tool</span>
          </span>
        </Link>

        {/* Center: breadcrumb on board pages */}
        {isBoardPage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#6e6a65', fontWeight: 500,
          }}>
            <Link to="/dashboard" style={{ color: '#6e6a65', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ede9e3'}
              onMouseLeave={e => e.currentTarget.style.color = '#6e6a65'}
            >
              Dashboard
            </Link>
            <span style={{ color: '#45413d' }}>/</span>
            <span style={{ color: '#a8a29e' }}>Room</span>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Keyboard shortcut hint */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, color: '#45413d', fontWeight: 500,
              cursor: 'default',
            }}
            title="Press Shift+? for shortcuts"
          >
            <Keyboard size={11} />
            <span className="kbd" style={{ fontSize: 9, padding: '1px 4px' }}>?</span>
          </div>

          {/* Connection status */}
          <motion.div
            animate={{
              borderColor: isConnected ? 'rgba(107,143,113,0.20)' : 'rgba(255,255,255,0.07)',
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 6,
              background: isConnected ? 'rgba(107,143,113,0.06)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              color: isConnected ? '#8fb896' : '#6e6a65',
            }}
          >
            <div className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`}
              style={{ width: 6, height: 6 }}
            />
            {isConnected ? 'Live' : 'Offline'}
          </motion.div>

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={ref}>
            <motion.button
              id="user-menu-btn"
              onClick={() => setOpen(p => !p)}
              aria-expanded={open}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', borderRadius: 8,
                background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: `1px solid ${open ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: user?.avatar ? 'none' : 'linear-gradient(135deg, #2dd4bf, #e07a5f)',
                border: user?.avatar ? '1px solid rgba(255,255,255,0.1)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#0f1f1d',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
                overflow: 'hidden',
              }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ede9e3', lineHeight: 1 }}>
                  {user?.name}
                </span>
              </div>
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={13} style={{ color: '#6e6a65', flexShrink: 0 }} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 220, zIndex: 100,
                    background: '#212125',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* User info */}
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#ede9e3', marginBottom: 2, fontFamily: 'var(--font-heading)' }}>
                      {user?.name}
                    </p>
                    <p style={{
                      fontSize: 11, color: '#6e6a65',
                      fontFamily: 'var(--font-mono)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: 10, padding: '9px 12px', borderRadius: 8,
                        textDecoration: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 500, color: '#ede9e3',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <User size={14} style={{ color: '#2dd4bf' }} />
                      <span>My Profile</span>
                    </Link>

                    <button
                      id="logout-menu-item"
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: 10, padding: '9px 12px', borderRadius: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 500, color: '#e8725e',
                        transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,69,54,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
