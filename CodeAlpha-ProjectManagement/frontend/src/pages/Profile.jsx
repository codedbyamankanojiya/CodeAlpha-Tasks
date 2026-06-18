import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Activity,
  FolderOpen,
  CheckSquare,
  Upload,
  Trash2,
  Phone,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    bio: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalProjects: 0, ownedProjects: 0, totalTasks: 0, completedTasks: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        phone: user.phone || '',
      });
      if (user.avatar) {
        setAvatarPreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002'}${user.avatar}`);
      }
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const projectsRes = await api.get('/projects');
      if (projectsRes.data.success) {
        const projects = projectsRes.data.projects;
        const owned = projects.filter(p => p.owner?._id === user?._id).length;

        let totalTasks = 0;
        let completedTasks = 0;
        for (const project of projects) {
          try {
            const tasksRes = await api.get(`/tasks/project/${project._id}`);
            if (tasksRes.data.success) {
              totalTasks += tasksRes.data.tasks.length;
              completedTasks += tasksRes.data.tasks.filter(t => t.status === 'Completed').length;
            }
          } catch (err) {
            // skip
          }
        }

        setStats({
          totalProjects: projects.length,
          ownedProjects: owned,
          totalTasks,
          completedTasks,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      const res = await api.put('/auth/me', formData);
      if (res.data.success) {
        updateUser(res.data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, WebP files are allowed');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success('Avatar updated!');
        setAvatarFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.newPass || !passwordData.confirm) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordData.newPass.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const res = await api.put('/auth/password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.newPass,
      });
      if (res.data.success) {
        toast.success('Password changed!');
        setShowPasswordSection(false);
        setPasswordData({ current: '', newPass: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    { label: 'Owned Projects', value: stats.ownedProjects, icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Completed Tasks', value: stats.completedTasks, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="bg-[#0D131F] min-h-screen p-6 md:p-8 space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1B253B]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Profile</h1>
          <p className="mt-1 text-slate-400">View and manage your personal account information.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-glow hover:shadow-lg"
          >
            <Edit3 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-4"
        >
          <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl overflow-hidden shadow-xl">
            <div className="relative h-32 bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-indigo-500/20">
              {!isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-3 bottom-3 p-2 rounded-lg border backdrop-blur-sm transition-all bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/50"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4">
                <div className="w-28 h-28 rounded-2xl border-4 border-[#141A29] bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-4xl font-bold text-white shadow-glow overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                {isEditing && (
                  <div className="flex absolute -right-2 -bottom-2 gap-2">
                    <label className="p-2 text-white bg-teal-500 rounded-lg transition-colors cursor-pointer hover:bg-teal-600">
                      <Upload size={16} />
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                      />
                    </label>
                    {avatarFile && (
                      <button
                        onClick={handleUploadAvatar}
                        disabled={uploading}
                        className="p-2 text-white bg-emerald-500 rounded-lg transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white">{user?.name || 'User'}</h2>
                <p className="text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>

              <div className="flex gap-2 items-center mb-4 text-sm text-slate-500">
                <Calendar size={14} />
                <span>Member since {memberSince}</span>
              </div>

              <div className="flex gap-2 items-center">
                <span className="px-3 py-1 text-xs font-bold tracking-wider text-teal-400 uppercase rounded-full border bg-teal-500/10 border-teal-500/20">
                  Team Member
                </span>
                <span className="flex gap-1 items-center px-3 py-1 text-xs font-bold tracking-wider text-emerald-400 uppercase rounded-full border bg-emerald-500/10 border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:col-span-8"
        >
          <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        displayName: user?.displayName || '',
                        bio: user?.bio || '',
                        phone: user?.phone || '',
                      });
                      if (user?.avatar) {
                        setAvatarPreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002'}${user.avatar}`);
                      } else {
                        setAvatarPreview(null);
                      }
                      setAvatarFile(null);
                    }}
                    className="flex gap-2 items-center px-4 py-2 font-medium rounded-xl transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-teal-500 rounded-xl transition-colors hover:bg-teal-600 shadow-glow"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex gap-3 items-center p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                  <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-teal-500/10 border-teal-500/20">
                    <User size={18} className="text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-teal-500/50"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-white">{formData.name || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 items-center p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                  <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-cyan-500/10 border-cyan-500/20">
                    <User size={18} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="Enter display name"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-white">{formData.displayName || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 items-center p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                  <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-indigo-500/10 border-indigo-500/20">
                    <Mail size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Email Address</label>
                    <p className="text-sm font-semibold text-white">{user?.email || 'Not set'}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full uppercase">
                    Verified
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 items-center p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                  <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-purple-500/10 border-purple-500/20">
                    <Phone size={18} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500/50"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-white">{formData.phone || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                  <div className="flex gap-3 items-center mb-3">
                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-amber-500/10 border-amber-500/20">
                      <FileText size={18} className="text-amber-400" />
                    </div>
                    <label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Bio</label>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="px-3 py-2 w-full text-white rounded-lg border resize-none bg-slate-800 border-slate-700 focus:outline-none focus:border-amber-500/50"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={300}
                    />
                  ) : (
                    <p className="text-sm text-slate-300">{formData.bio || 'No bio yet'}</p>
                  )}
                  {isEditing && (
                    <div className="mt-2 text-xs text-slate-500">{formData.bio?.length || 0}/300</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Security</h3>
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {!showPasswordSection ? (
              <div className="flex gap-3 items-center p-4 rounded-xl border bg-slate-900/50 border-slate-800/50">
                <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-xl border bg-amber-500/10 border-amber-500/20">
                  <Lock size={18} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Password</p>
                  <p className="text-sm font-semibold tracking-widest text-white">••••••••</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-400">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="px-4 py-3 pr-12 w-full text-white rounded-xl border transition-all bg-slate-900 border-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 transition-colors -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordData.newPass}
                      onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                      className="px-4 py-3 pr-12 w-full text-white rounded-xl border transition-all bg-slate-900 border-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 transition-colors -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-400">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="px-4 py-3 pr-12 w-full text-white rounded-xl border transition-all bg-slate-900 border-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 transition-colors -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="px-4 py-3 w-full font-semibold text-white bg-teal-500 rounded-xl transition-all hover:bg-teal-600 shadow-glow"
                >
                  Update Password
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-[#141A29]/60 border ${stat.border} rounded-2xl p-6 shadow-md transition-all duration-300 group hover:shadow-glow`}
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">{stat.label}</p>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Profile;

function Camera(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}