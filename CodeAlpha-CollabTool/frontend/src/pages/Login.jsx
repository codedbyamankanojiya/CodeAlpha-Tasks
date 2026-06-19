import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Layers, Zap, Shield, Users, Kanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Stagger Children ──────────────────────────────────────── */
const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
};

const FEATURES = [
  {
    icon: Zap,
    label: 'Real-time collaboration',
    desc: 'Every change syncs instantly across your team. No refresh needed.',
    color: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.10)',
  },
  {
    icon: Shield,
    label: 'Secure by default',
    desc: 'Your boards and data are protected with modern authentication.',
    color: '#6b8f71',
    bg: 'rgba(107, 143, 113, 0.10)',
  },
  {
    icon: Users,
    label: 'Built for teams',
    desc: 'Invite members, assign tasks, and track progress together.',
    color: '#e07a5f',
    bg: 'rgba(224, 122, 95, 0.10)',
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData);
      toast.success('Welcome back!', 'Signed in successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Sign in failed', err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      {/* ── Left: Brand Editorial Panel ──────────────────── */}
      <div className="auth-brand-panel dot-grid">
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}
        >
          {/* Brand mark */}
          <motion.div variants={stagger.item} style={{ marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(45,212,191,0.25)',
              }}>
                <Layers size={22} color="#0f1f1d" />
              </div>
              <span style={{
                fontSize: 20, fontWeight: 800, color: '#ede9e3',
                letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)',
              }}>
                Collab<span style={{ color: '#2dd4bf' }}>Tool</span>
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={stagger.item} style={{ marginBottom: 12 }}>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: '#f5f0eb',
              letterSpacing: '-0.04em', lineHeight: 1.15,
              fontFamily: 'var(--font-heading)',
            }}>
              Where teams bring
              <br />
              ideas to <span style={{ color: '#2dd4bf' }}>life</span>
            </h1>
          </motion.div>

          <motion.p variants={stagger.item} style={{
            fontSize: 15, color: '#a8a29e', lineHeight: 1.7,
            marginBottom: 40, maxWidth: 360,
          }}>
            A focused workspace for teams who value clarity. Organize, collaborate, and ship — all in real-time.
          </motion.p>

          {/* Feature list */}
          {FEATURES.map(({ icon: Icon, label, desc, color, bg }) => (
            <motion.div key={label} variants={stagger.item} className="auth-feature">
              <div className="auth-feature-icon" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: '#ede9e3',
                  marginBottom: 3, fontFamily: 'var(--font-heading)',
                }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, color: '#6e6a65', lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: Form Panel ────────────────────────────── */}
      <div className="auth-form-panel">
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* Header */}
          <motion.div variants={stagger.item} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: '#f5f0eb',
              letterSpacing: '-0.03em', marginBottom: 8,
              fontFamily: 'var(--font-heading)',
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#6e6a65' }}>
              Sign in to your workspace
            </p>
          </motion.div>

          {/* Card */}
          <motion.div variants={stagger.item} className="auth-card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} id="login-form">
              {/* Email */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 18 }}>
                <label className="label" htmlFor="login-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none',
                  }} />
                  <input
                    id="login-email" type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="you@company.com"
                    className="input" style={{ paddingLeft: 38 }}
                    required autoComplete="email" autoFocus
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 24 }}>
                <label className="label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none',
                  }} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••••"
                    className="input" style={{ paddingLeft: 38, paddingRight: 42 }}
                    required autoComplete="current-password"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#6e6a65',
                      display: 'flex', padding: 2, transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ede9e3'}
                    onMouseLeave={e => e.currentTarget.style.color = '#6e6a65'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={stagger.item}>
                <motion.button
                  type="submit" id="login-submit-btn" disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 18px', fontSize: 14, marginBottom: 20 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <><div className="spinner" style={{ width: 15, height: 15 }} /><span>Signing in…</span></>
                  ) : (
                    <><span>Sign in</span><ArrowRight size={16} /></>
                  )}
                </motion.button>
              </motion.div>

              {/* Hint */}
              <motion.p variants={stagger.item} style={{
                textAlign: 'center', fontSize: 11, color: '#45413d',
                marginBottom: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
              }}>
                Press <span className="kbd">Enter</span> to sign in
              </motion.p>

              {/* Divider */}
              <motion.div variants={stagger.item} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: '#45413d', fontSize: 12, marginBottom: 20,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span>New to CollabTool?</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </motion.div>

              <motion.div variants={stagger.item}>
                <Link
                  to="/register"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '10px 18px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a8a29e', fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(45,212,191,0.30)';
                    e.currentTarget.style.color = '#ede9e3';
                    e.currentTarget.style.background = 'rgba(45,212,191,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = '#a8a29e';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Create an account
                </Link>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
