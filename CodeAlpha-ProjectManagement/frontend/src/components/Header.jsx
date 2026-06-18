import React, { useState } from 'react';
import { Search, Bell, Grid, LogOut, ChevronDown, User, Settings, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const query = searchParams.get('search') || '';

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  const notifications = [
    { id: 1, text: 'Sarah Jones completed task "Implement user auth"', time: '10m ago', unread: true },
    { id: 2, text: 'Mike R. commented on "Write unit tests"', time: '2h ago', unread: true },
    { id: 3, text: 'John Smith updated status to In Progress', time: '1d ago', unread: false }
  ];

  return (
    <header className="h-20 border-b border-[#1B253B] bg-[#0D131F] flex items-center justify-between px-8 sticky top-0 z-30 select-none">
      {/* Global Search Bar connected to URL query params */}
      <div className="relative w-96 max-w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Global Search..."
          className="w-full bg-[#141A29] border border-[#1B253B] rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-all duration-200"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Notifications Bell with Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-[#141A29] hover:text-white transition-colors"
          >
            <Bell size={18} className={showNotifications ? 'text-teal-400' : 'text-slate-400'} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0D131F] shadow-sm">
              3
            </span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#1B253B] flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">3 New</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-800/40 transition-colors border-b border-[#1B253B]/50 last:border-0 cursor-pointer ${
                        notif.unread ? 'bg-teal-500/5' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 leading-normal">{notif.text}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dashboard shortcut link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border border-transparent hover:border-[#1B253B]"
        >
          <Grid size={16} className="text-teal-400" />
          <span>Dashboard</span>
        </button>

        {/* User profile dropdown info */}
        <div className="flex items-center gap-4 pl-4 border-l border-[#1B253B] relative">
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Team Member</span>
            </div>
            <ChevronDown size={14} className={`text-slate-500 group-hover:text-white transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </div>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-3 top-12 w-48 bg-[#141A29] border border-[#1B253B] rounded-xl shadow-2xl z-20 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <div className="border-t border-[#1B253B]/50 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
