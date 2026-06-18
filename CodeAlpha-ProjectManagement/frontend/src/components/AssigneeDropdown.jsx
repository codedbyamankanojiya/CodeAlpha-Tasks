import React, { useState, useEffect } from 'react';
import { ChevronDown, UserPlus } from 'lucide-react';
import api from '../services/api';

const AssigneeDropdown = ({ selectedUserIds, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users');
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const selectedUsers = users.filter(user => selectedUserIds.includes(user._id));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
      >
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 ? (
            <div className="flex -space-x-2">
              {selectedUsers.slice(0, 3).map((user) => (
                <div
                  key={user._id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold border-2 border-slate-900"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold border-2 border-slate-900">
                  +{selectedUsers.length - 3}
                </div>
              )}
            </div>
          ) : (
            <UserPlus size={18} className="text-slate-500" />
          )}
          <span className="text-slate-400">
            {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Select assignees'}
          </span>
        </div>
        <ChevronDown size={18} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No users available</div>
            ) : (
              users.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user._id)}
                    onChange={() => toggleUser(user._id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm">{user.name}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssigneeDropdown;