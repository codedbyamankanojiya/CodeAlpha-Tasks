import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AssigneeDropdown from './AssigneeDropdown';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TaskModal = ({ isOpen, onClose, onSubmit, initialData = null, projectId }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isEditing, setIsEditing] = useState(!initialData);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: [],
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        priority: initialData.priority,
        status: initialData.status,
        dueDate: new Date(initialData.dueDate).toISOString().split('T')[0],
        assignedTo: initialData.assignedTo.map(u => u._id),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: [],
      });
    }
    setIsEditing(!initialData);
  }, [initialData, isOpen]);

  // Fetch comments if we have an existing task
  useEffect(() => {
    if (initialData && isOpen) {
      fetchComments();
    }
  }, [initialData, isOpen]);

  // Socket listeners for real-time comments
  useEffect(() => {
    if (socket && initialData) {
      const handleCommentCreated = (data) => {
        if (data.taskId === initialData._id) {
          setComments(prev => [...prev, data.comment]);
        }
      };

      const handleCommentUpdated = (data) => {
        if (data.taskId === initialData._id) {
          setComments(prev =>
            prev.map(c => c._id === data.comment._id ? data.comment : c)
          );
        }
      };

      const handleCommentDeleted = (data) => {
        if (data.taskId === initialData._id) {
          setComments(prev => prev.filter(c => c._id !== data.commentId));
        }
      };

      socket.on('commentCreated', handleCommentCreated);
      socket.on('commentUpdated', handleCommentUpdated);
      socket.on('commentDeleted', handleCommentDeleted);

      return () => {
        socket.off('commentCreated', handleCommentCreated);
        socket.off('commentUpdated', handleCommentUpdated);
        socket.off('commentDeleted', handleCommentDeleted);
      };
    }
  }, [socket, initialData]);

  // Scroll to bottom of comments when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/comments/task/${initialData._id}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, projectId });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post('/comments', {
        text: newComment,
        taskId: initialData._id,
      });
      if (res.data.success) {
        setNewComment('');
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, {
        text: editCommentText,
      });
      if (res.data.success) {
        setEditingCommentId(null);
        toast.success('Comment updated');
      }
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data.success) {
        toast.success('Comment deleted');
      }
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'Medium': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'Low': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      default: return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
      case 'In Progress': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
      case 'Review': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'Completed': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      default: return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#1B253B]">
                <h2 className="text-xl font-semibold text-white">
                  {initialData ? 'Task Details' : 'Create New Task'}
                </h2>
                <div className="flex items-center gap-3">
                  {initialData && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                      <label className="label">Task Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input-field"
                        placeholder="Enter task title"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input-field resize-none"
                        placeholder="Describe the task"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                          className="input-field"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="input-field"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="input-field"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Assignees</label>
                      <AssigneeDropdown
                        selectedUserIds={formData.assignedTo}
                        onChange={(userIds) => setFormData({ ...formData, assignedTo: userIds })}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (initialData) {
                            setIsEditing(false);
                          } else {
                            onClose();
                          }
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary flex-1"
                      >
                        {initialData ? 'Save Changes' : 'Create Task'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Task details */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white">{formData.title}</h3>
                      {formData.description && (
                        <p className="text-slate-300 leading-relaxed">{formData.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(formData.priority)}`}>
                          {formData.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.status)}`}>
                          {formData.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium border border-slate-500/30 bg-slate-500/10 text-slate-400">
                          Due: {new Date(formData.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Assignees */}
                    {initialData.assignedTo.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-2">Assignees</h4>
                        <div className="flex flex-wrap gap-2">
                          {initialData.assignedTo.map((u) => (
                            <div
                              key={u._id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50"
                            >
                              {u.avatar ? (
                                <img
                                  src={u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000${u.avatar}`}
                                  alt={u.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm text-slate-200">{u.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments section */}
                    <div className="pt-4 border-t border-[#1B253B]">
                      <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Comments ({comments.length})
                      </h4>
                      
                      {/* Comments list */}
                      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
                        {commentsLoading ? (
                          <div className="flex flex-col gap-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800/50 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
                                  <div className="h-6 w-full bg-slate-800/50 rounded animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                              {comment.userId.avatar ? (
                                <img
                                  src={comment.userId.avatar.startsWith('http') ? comment.userId.avatar : `http://localhost:5000${comment.userId.avatar}`}
                                  alt={comment.userId.name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                  {comment.userId.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-white">{comment.userId.name}</span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {editingCommentId === comment._id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      className="input-field resize-none text-sm"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveEditComment(comment._id)}
                                        className="btn-primary text-xs py-1.5 px-3"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="btn-secondary text-xs py-1.5 px-3"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{comment.text}</p>
                                    {comment.userId._id === user._id && (
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleEditComment(comment)}
                                          className="text-xs text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1"
                                        >
                                          <Edit2 size={12} />
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(comment._id)}
                                          className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                                        >
                                          <Trash2 size={12} />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            No comments yet. Be the first to comment!
                          </div>
                        )}
                        <div ref={commentsEndRef} />
                      </div>

                      {/* Add comment form */}
                      <form onSubmit={handleAddComment} className="flex gap-3">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="input-field resize-none flex-1"
                          rows={2}
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="btn-primary self-end px-4"
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;