import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Layers, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const getStrength = (pwd) => {
  if (!pwd) return null;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const levels = [
    { label: 'Weak', color: '#c44536' },
    { label: 'Fair', color: '#daa520' },
    { label: 'Good', color: '#5ba4cf' },
    { label: 'Strong', color: '#6b8f71' },
  ];
  return { score: s, ...levels[Math.min(s - 1, 3)] };
};

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
};

const REQUIREMENTS = [
  { test: pwd => pwd.length >= 6, label: 'At least 6 characters' },
  { test: pwd => /[A-Z]/.test(pwd), label: 'One uppercase letter' },
  { test: pwd => /[0-9]/.test(pwd), label: 'One number' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = getStrength(formData.password);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Mismatch', 'Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return toast.error('Too short', 'Password must be at least 6 characters.');
    }
    setIsLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password });
      toast.success('Account created!', 'Welcome to CollabTool.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registration failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      {/* ── Left: Brand Panel ────────────────────────────── */}
      <div className="auth-brand-panel dot-grid">
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}
        >
          {/* Brand */}
          <motion.div variants={stagger.item} style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #e07a5f, #c44536)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(224,122,95,0.25)',
              }}>
                <Layers size={22} color="#fff" />
              </div>
              <span style={{
                fontSize: 20, fontWeight: 800, color: '#ede9e3',
                letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)',
              }}>
                Collab<span style={{ color: '#2dd4bf' }}>Tool</span>
              </span>
            </div>
          </motion.div>

          <motion.div variants={stagger.item} style={{ marginBottom: 12 }}>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: '#f5f0eb',
              letterSpacing: '-0.04em', lineHeight: 1.15,
              fontFamily: 'var(--font-heading)',
            }}>
              Start building
              <br />
              something <span style={{ color: '#e07a5f' }}>great</span>
            </h1>
          </motion.div>

          <motion.p variants={stagger.item} style={{
            fontSize: 15, color: '#a8a29e', lineHeight: 1.7,
            marginBottom: 40, maxWidth: 360,
          }}>
            Create your workspace in seconds. Invite your team, set up boards, and start collaborating right away.
          </motion.p>

          {/* Steps */}
          {[
            { step: '01', text: 'Create your account with name and email' },
            { step: '02', text: 'Set up your first board from a template' },
            { step: '03', text: 'Invite teammates and start collaborating' },
          ].map(({ step, text }) => (
            <motion.div key={step} variants={stagger.item} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#6e6a65',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
                {step}
              </div>
              <p style={{ fontSize: 13, color: '#a8a29e', lineHeight: 1.5 }}>
                {text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: Form Panel ────────────────────────────── */}
      <div className="auth-form-panel">
        <motion.div
          variants={stagger.container} initial="initial" animate="animate"
          style={{ width: '100%', maxWidth: 400 }}
        >
          <motion.div variants={stagger.item} style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: '#f5f0eb',
              letterSpacing: '-0.03em', marginBottom: 8,
              fontFamily: 'var(--font-heading)',
            }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: '#6e6a65' }}>Join your team on CollabTool</p>
          </motion.div>

          <motion.div variants={stagger.item} className="auth-card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} id="register-form">
              {/* Name */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="register-name">Full name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
                  <input id="register-name" type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Your full name" className="input" style={{ paddingLeft: 38 }}
                    required minLength={2} autoComplete="name" autoFocus />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="register-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
                  <input id="register-email" type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="you@company.com" className="input" style={{ paddingLeft: 38 }}
                    required autoComplete="email" />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="register-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
                  <input
                    id="register-password" type={showPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    placeholder="Min. 6 characters" className="input"
                    style={{ paddingLeft: 38, paddingRight: 42 }}
                    required autoComplete="new-password"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#6e6a65',
                      display: 'flex', padding: 2, transition: 'color 0.15s',
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {strength && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: 8 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            style={{
                              flex: 1, height: 3, borderRadius: 99, transformOrigin: 'left',
                              background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.07)',
                              transition: 'background 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: strength.color,
                        fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right',
                      }}>
                        {strength.label}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {REQUIREMENTS.map(({ test, label }) => {
                        const pass = test(formData.password);
                        return (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: pass ? '#6b8f71' : '#45413d', transition: 'color 0.2s' }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                              border: `1.5px solid ${pass ? '#6b8f71' : 'rgba(255,255,255,0.1)'}`,
                              background: pass ? 'rgba(107,143,113,0.15)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}>
                              {pass && <Check size={9} strokeWidth={3} />}
                            </div>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm */}
              <motion.div variants={stagger.item} className="form-group" style={{ marginBottom: 24 }}>
                <label className="label" htmlFor="register-confirm">Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d', pointerEvents: 'none' }} />
                  <input
                    id="register-confirm" type={showPassword ? 'text' : 'password'}
                    name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" className="input" style={{ paddingLeft: 38 }}
                    required autoComplete="new-password"
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 11, color: '#e8725e', marginTop: 6 }}>
                    Passwords don't match
                  </motion.p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.div variants={stagger.item}>
                <motion.button
                  type="submit" id="register-submit-btn" disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 18px', fontSize: 14, marginBottom: 20 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <><div className="spinner" style={{ width: 15, height: 15 }} /><span>Creating account…</span></>
                  ) : (
                    <><span>Create account</span><ArrowRight size={16} /></>
                  )}
                </motion.button>
              </motion.div>

              <motion.div variants={stagger.item} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: '#45413d', fontSize: 12, marginBottom: 20,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span>Have an account?</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </motion.div>

              <motion.div variants={stagger.item}>
                <Link
                  to="/login"
                  style={{
                    display: 'block', textAlign: 'center', padding: '10px 18px',
                    borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
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
                  Sign in instead
                </Link>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
