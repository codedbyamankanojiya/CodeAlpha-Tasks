import { motion, AnimatePresence } from 'framer-motion';
import { Users, Edit3 } from 'lucide-react';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const COLORS = ['#2dd4bf', '#9775d4', '#5ba4cf', '#6b8f71', '#daa520', '#e07a5f', '#c44536', '#b07d62'];

const getColor = (id = '') => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
};

const ActiveUsersBar = ({ users = [] }) => {
  const MAX = 5;
  const visible = users.slice(0, MAX);
  const overflow = users.length - MAX;

  if (users.length === 0) return null;

  return (
    <div id="active-users-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {/* Avatar stack */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AnimatePresence>
          {visible.map((user, i) => (
            <motion.div
              key={user.socketId || user.userId}
              initial={{ scale: 0, opacity: 0, x: -8 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              style={{ position: 'relative', zIndex: MAX - i, marginLeft: i === 0 ? 0 : -8 }}
            >
              <div
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: getColor(user.userId),
                  border: '2px solid #1a1a1e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#0f1f1d',
                  fontFamily: 'var(--font-mono)', flexShrink: 0, cursor: 'default',
                }}
                title={user.name}
              >
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : getInitials(user.name)
                }
              </div>
              
              {/* Online pulse or Typing indicator */}
              {user.isTyping ? (
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#daa520', border: '1.5px solid #1a1a1e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 6px rgba(218,165,32,0.6)',
                }}
                  title={`${user.name} is editing...`}
                >
                  <Edit3 size={7} color="#0f1f1d" strokeWidth={3} />
                </div>
              ) : (
                <div style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#6b8f71', border: '1.5px solid #1a1a1e',
                  boxShadow: '0 0 5px rgba(107,143,113,0.5)',
                }} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
 
        {overflow > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(151,117,212,0.20)',
              border: '2px solid #1a1a1e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#b8a0e0',
              marginLeft: -8, zIndex: 0,
            }}
          >
            +{overflow}
          </motion.div>
        )}
      </div>

      {/* Count label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6e6a65', fontWeight: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={11} />
          <span>{users.length}</span>
        </div>
        
        {/* Typing label text */}
        {users.some(u => u.isTyping) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: '#daa520', fontSize: 10, fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}>
            <span>·</span>
            <span style={{ opacity: 0.8 }}>
              {users.filter(u => u.isTyping).map(u => u.name.split(' ')[0]).join(', ')} is editing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveUsersBar;
