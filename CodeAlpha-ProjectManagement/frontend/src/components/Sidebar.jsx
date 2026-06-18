import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects-list', label: 'Projects', icon: Folder, dummy: true },
    { path: '/tasks-list', label: 'Tasks', icon: CheckSquare, dummy: true },
  ];

  const teams = [
    { name: 'Team: A', initial: 'A', color: 'from-purple-500 to-indigo-600' },
    { name: 'Team: B', initial: 'B', color: 'from-amber-500 to-orange-600' },
    { name: 'Team: C', initial: 'C', color: 'from-emerald-500 to-teal-600' }
  ];

  return (
    <div
      className={`h-screen sticky top-0 left-0 bg-[#0B0F19] border-r border-[#1B253B] flex flex-col justify-between transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-[#1B253B]">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-3 group px-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F19]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight leading-none">Project</span>
                <span className="text-xs font-bold text-teal-400 mt-0.5 leading-none">Manager</span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link to="/" className="mx-auto">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-[#1B253B] bg-[#141A29] text-slate-400 hover:text-white hover:bg-[#1f293e] transition-colors absolute right-[-14px] top-7 z-55 shadow-md"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Teams List (Circles like mockup) */}
        <div className="px-4 py-6 border-b border-[#1B253B] space-y-4">
          <div className="flex flex-col gap-3">
            {teams.map((team, idx) => (
              <div
                key={idx}
                onClick={() => toast.success(`Switched workspace to ${team.name}`)}
                className="flex items-center gap-3 group relative cursor-pointer"
                title={team.name}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${team.color} flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {team.initial}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">{team.name}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Favorites Section */}
        <div className="px-4 py-4 border-b border-[#1B253B]">
          <div
            onClick={() => toast.success('Added current project to favorites!')}
            className="flex items-center gap-3 cursor-pointer text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#141A29]">
              <Star size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-medium">Favorites</span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-6 space-y-1">
          {navItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;

            // Handle dummy links to avoid broken router navigation
            const handleClick = (e) => {
              if (item.dummy) {
                e.preventDefault();
                toast.info(`${item.label} list view is under development.`);
              }
            };

            return (
              <Link
                key={idx}
                to={item.path}
                onClick={handleClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.05)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <IconComponent size={20} className={isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#1B253B]">
        <div className="flex flex-col gap-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-900/50 rounded-xl transition-all group"
          >
            <Settings size={20} className="text-slate-400 group-hover:text-white" />
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group text-left w-full"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-400" />
            {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
