import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, UserPlus, MoreHorizontal, ChevronDown, Check, Shield, Globe, Lock, Bell, Palette, Database, Zap, GitBranch, MessageCircle, Mail, Slack } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isPublic, setIsPublic] = useState(false);

  // General settings state
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [workspaceDesc, setWorkspaceDesc] = useState('A collaborative workspace for project management.');
  const [timezone, setTimezone] = useState('UTC+5:30');
  const [language, setLanguage] = useState('English');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Notification settings
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifTaskAssign, setNotifTaskAssign] = useState(true);
  const [notifProjectUpdate, setNotifProjectUpdate] = useState(true);
  const [notifComment, setNotifComment] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      if (response.data.success) {
        const mapped = response.data.users.map((u, idx) => {
          let role = 'Member';
          if (idx === 0) role = 'Admin';
          else if (idx === 3) role = 'Viewer';

          let lastActive = 'Active now';
          if (idx === 1) lastActive = '2 hours ago';
          else if (idx === 2) lastActive = '1 day ago';
          else if (idx === 3) lastActive = '3 hours ago';
          else if (idx > 3) lastActive = `${idx} days ago`;

          return {
            ...u,
            role,
            lastActive
          };
        });
        setUsers(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role updated to ${newRole}`);
  };

  const handleInvite = () => {
    toast.success('Invitation link copied to clipboard!');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'integrations', label: 'Integrations' }
  ];

  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${enabled ? 'bg-teal-500' : 'bg-slate-700'}`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );

  const renderGeneralTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Workspace Settings */}
      <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Globe size={18} className="text-teal-400" />
          Workspace Settings
        </h3>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Workspace Name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
            <textarea
              value={workspaceDesc}
              onChange={(e) => setWorkspaceDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
              >
                <option value="UTC-8">UTC-8 (PST)</option>
                <option value="UTC-5">UTC-5 (EST)</option>
                <option value="UTC+0">UTC+0 (GMT)</option>
                <option value="UTC+1">UTC+1 (CET)</option>
                <option value="UTC+5:30">UTC+5:30 (IST)</option>
                <option value="UTC+8">UTC+8 (CST)</option>
                <option value="UTC+9">UTC+9 (JST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => toast.success('Workspace settings saved!')}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Bell size={18} className="text-amber-400" />
          Notification Preferences
        </h3>
        <div className="space-y-1 divide-y divide-[#1B253B]/50">
          <ToggleSwitch enabled={notifEmail} onToggle={() => { setNotifEmail(!notifEmail); toast.success(`Email notifications ${!notifEmail ? 'enabled' : 'disabled'}`); }} label="Email Notifications" />
          <ToggleSwitch enabled={notifPush} onToggle={() => { setNotifPush(!notifPush); toast.success(`Push notifications ${!notifPush ? 'enabled' : 'disabled'}`); }} label="Push Notifications" />
          <ToggleSwitch enabled={notifTaskAssign} onToggle={() => { setNotifTaskAssign(!notifTaskAssign); toast.success(`Task assignment alerts ${!notifTaskAssign ? 'enabled' : 'disabled'}`); }} label="Task Assignment Alerts" />
          <ToggleSwitch enabled={notifProjectUpdate} onToggle={() => { setNotifProjectUpdate(!notifProjectUpdate); toast.success(`Project update alerts ${!notifProjectUpdate ? 'enabled' : 'disabled'}`); }} label="Project Update Alerts" />
          <ToggleSwitch enabled={notifComment} onToggle={() => { setNotifComment(!notifComment); toast.success(`Comment notifications ${!notifComment ? 'enabled' : 'disabled'}`); }} label="Comment Notifications" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#141A29] border border-red-500/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-slate-400 mb-4">These actions are irreversible. Please proceed with caution.</p>
        <div className="flex gap-3">
          <button
            onClick={() => toast.error('This action is disabled for demo purposes.')}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            Delete Workspace
          </button>
          <button
            onClick={() => toast.error('This action is disabled for demo purposes.')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            Export All Data
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderPermissionsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Role Permissions */}
      <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#1B253B] bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-purple-400" />
            Role Permissions Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure what each role can do within the workspace.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1B253B] text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                <th className="px-6 py-4">Permission</th>
                <th className="px-6 py-4 text-center">Admin</th>
                <th className="px-6 py-4 text-center">Member</th>
                <th className="px-6 py-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B253B]/50">
              {[
                { permission: 'Create Projects', admin: true, member: true, viewer: false },
                { permission: 'Delete Projects', admin: true, member: false, viewer: false },
                { permission: 'Create Tasks', admin: true, member: true, viewer: false },
                { permission: 'Edit Tasks', admin: true, member: true, viewer: false },
                { permission: 'Delete Tasks', admin: true, member: false, viewer: false },
                { permission: 'Manage Members', admin: true, member: false, viewer: false },
                { permission: 'View Analytics', admin: true, member: true, viewer: true },
                { permission: 'Export Data', admin: true, member: true, viewer: false },
                { permission: 'Change Settings', admin: true, member: false, viewer: false },
              ].map((row) => (
                <tr key={row.permission} className="hover:bg-[#1f293e]/30 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-white">{row.permission}</td>
                  <td className="px-6 py-3.5 text-center">
                    <div className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center ${row.admin ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                      {row.admin && <Check size={12} />}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center ${row.member ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                      {row.member && <Check size={12} />}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center ${row.viewer ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                      {row.viewer && <Check size={12} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock size={18} className="text-amber-400" />
          Access Control
        </h3>
        <div className="space-y-1 divide-y divide-[#1B253B]/50">
          <ToggleSwitch enabled={true} onToggle={() => toast.success('Setting toggled')} label="Require admin approval for new members" />
          <ToggleSwitch enabled={false} onToggle={() => toast.success('Setting toggled')} label="Allow members to invite others" />
          <ToggleSwitch enabled={true} onToggle={() => toast.success('Setting toggled')} label="Two-factor authentication required" />
          <ToggleSwitch enabled={false} onToggle={() => toast.success('Setting toggled')} label="IP whitelist enforcement" />
        </div>
      </div>
    </motion.div>
  );

  const renderIntegrationsTab = () => {
    const integrations = [
      { name: 'GitHub', desc: 'Connect repositories and track commits', icon: GitBranch, color: 'text-white', bg: 'bg-slate-800', connected: false },
      { name: 'Slack', desc: 'Send notifications to Slack channels', icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', connected: true },
      { name: 'Email (SMTP)', desc: 'Configure email notifications via SMTP', icon: Mail, color: 'text-teal-400', bg: 'bg-teal-500/10', connected: true },
      { name: 'Jira', desc: 'Sync tasks and issues with Jira boards', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', connected: false },
      { name: 'Google Drive', desc: 'Attach files from Google Drive', icon: Database, color: 'text-amber-400', bg: 'bg-amber-500/10', connected: false },
      { name: 'Figma', desc: 'Embed design files and prototypes', icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/10', connected: false },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            Connected Services
          </h3>
          <p className="text-xs text-slate-400 mb-6">Manage third-party integrations with your workspace.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((int) => {
              const IconComp = int.icon;
              return (
                <div key={int.name} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${int.bg} border border-slate-700/50 flex items-center justify-center flex-shrink-0`}>
                      <IconComp size={18} className={int.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{int.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{int.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(int.connected ? `${int.name} disconnected` : `${int.name} connected!`)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      int.connected
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/20'
                    }`}
                  >
                    {int.connected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">Webhooks</h3>
          <p className="text-xs text-slate-400 mb-4">Set up custom webhook endpoints to receive real-time events.</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="https://your-server.com/webhook"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
            <button
              onClick={() => toast.success('Webhook endpoint saved!')}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              Add Webhook
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-[#0D131F] min-h-screen px-8 py-8 space-y-8 select-none">
      {/* Title Header with Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#1B253B]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team & Project Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your workspace members, privileges, and tools integrations.</p>
        </div>

        <div className="flex items-center gap-6 bg-[#141A29] border border-[#1B253B] px-5 py-3 rounded-2xl shadow-sm">
          {/* Public / Private toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Public/Private</span>
            <button
              onClick={() => {
                setIsPublic(!isPublic);
                toast.success(`Workspace is now ${!isPublic ? 'Public' : 'Private'}`);
              }}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${isPublic ? 'bg-teal-500' : 'bg-slate-700'
                }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <button
            onClick={handleInvite}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
          >
            <UserPlus size={14} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Tabs list matching mockup style */}
      <div className="flex gap-6 border-b border-[#1B253B] pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm font-semibold tracking-wide pb-4 relative transition-colors ${activeTab === tab.id ? 'text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && renderGeneralTab()}

      {activeTab === 'permissions' && renderPermissionsTab()}

      {activeTab === 'integrations' && renderIntegrationsTab()}

      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
              <Filter size={14} className="text-slate-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading members...</div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1B253B] text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Last Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B253B]/50">
                    {filteredUsers.map((teamUser) => (
                      <tr key={teamUser._id} className="hover:bg-[#1f293e]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                              {teamUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{teamUser.name}</div>
                              <div className="text-xs text-slate-500">{teamUser.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block text-left">
                            <select
                              value={teamUser.role}
                              onChange={(e) => handleRoleChange(teamUser._id, e.target.value)}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer appearance-none pr-8 relative"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Member">Member</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                            <ChevronDown size={12} className="text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                          {teamUser.lastActive}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toast.success('Actions popover triggered')}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No members match search criteria.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
