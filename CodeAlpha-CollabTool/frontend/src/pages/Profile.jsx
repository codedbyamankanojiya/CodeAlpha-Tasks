import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Key, Camera, Loader2,
  ShieldCheck, Eye, EyeOff, Save, CheckCircle2, AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const fileInputRef = useRef(null);

  // Convert uploaded image to base64 Data URL
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please upload an image file.');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Image too large', 'Avatar picture must be under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
    };
    reader.onerror = () => {
      toast.error('Read error', 'Failed to read the image.');
    };
    reader.readAsDataURL(file);
  };

  // Submit profile updates
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    if (!email.trim()) return setError('Email is required.');

    if (password) {
      if (password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
      if (password !== confirmPassword) {
        return setError('Passwords do not match.');
      }
    }

    setError('');
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        avatar,
      };

      if (password) {
        payload.password = password;
      }

      const res = await authAPI.updateProfile(payload);
      
      // Update global context
      updateUser(res.data.user);
      
      // Clear password inputs
      setPassword('');
      setConfirmPassword('');
      
      toast.success('Profile updated', 'Your personal details have been saved.');
    } catch (err) {
      console.error('[Profile] Save error:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{
        paddingTop: 80, flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', maxWidth: 640, width: '100%', margin: '0 auto',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 40
      }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: '#1c1c1f', border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16, width: '100%', overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-icon"
              aria-label="Back to dashboard"
              style={{ flexShrink: 0 }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f5f0eb', fontFamily: 'var(--font-heading)' }}>
                Account Profile
              </h2>
              <p style={{ fontSize: 11, color: '#6e6a65', marginTop: 2 }}>
                Update your account details and password
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: 24 }}>
            {error && (
              <div style={{
                marginBottom: 20, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.20)',
                color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Avatar Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 10 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'relative', width: 90, height: 90, borderRadius: 24,
                  cursor: 'pointer', overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  background: avatar ? 'none' : 'linear-gradient(135deg, #2dd4bf, #e07a5f)',
                  border: avatar ? '2px solid rgba(255,255,255,0.08)' : 'none'
                }}
                className="avatar-container"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {avatar ? (
                  <img src={avatar} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#0f1f1d', fontFamily: 'var(--font-mono)' }}>
                    {getInitials(name)}
                  </span>
                )}

                {/* Overlay on hover */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s', color: '#fff'
                }} className="avatar-overlay">
                  <Camera size={20} style={{ color: '#2dd4bf' }} />
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, color: '#2dd4bf'
                  }}
                >
                  Upload profile picture
                </button>
                <p style={{ fontSize: 10, color: '#6e6a65', marginTop: 4 }}>
                  JPG, PNG or WEBP. Max 1.5MB.
                </p>
              </div>
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
              {/* Full Name */}
              <div>
                <label className="label" htmlFor="profile-name">
                  Full name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d' }} />
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input"
                    style={{ paddingLeft: 38 }}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="label" htmlFor="profile-email">
                  Email address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d' }} />
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="input"
                    style={{ paddingLeft: 38 }}
                    required
                  />
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.05)', margin: '10px 0' }} />

              {/* Change Password section */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#ede9e3', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
                  Change password
                </h3>
                <p style={{ fontSize: 10, color: '#6e6a65', marginBottom: 14 }}>
                  Leave blank if you do not wish to update your password
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* New Password */}
                  <div>
                    <label className="label" htmlFor="profile-pwd">New password</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d' }} />
                      <input
                        id="profile-pwd"
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input"
                        style={{ paddingLeft: 38, paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#6e6a65', display: 'flex'
                        }}
                      >
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="label" htmlFor="profile-confirm-pwd">Confirm new password</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#45413d' }} />
                      <input
                        id="profile-confirm-pwd"
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input"
                        style={{ paddingLeft: 38, paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#6e6a65', display: 'flex'
                        }}
                      >
                        {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Styled Hover effect for avatar */}
      <style>{`
        .avatar-container:hover .avatar-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default Profile;
