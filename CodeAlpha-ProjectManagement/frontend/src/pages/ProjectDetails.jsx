import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import DashboardMetrics from '../components/DashboardMetrics';
import TaskModal from '../components/TaskModal';
import {
  Plus,
  ArrowLeft,
  List,
  BarChart3,
  Trash2,
  Search,
  Filter,
  Users,
  X,
  MessageSquare,
  CheckSquare,
  ArrowUpDown,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import { TaskListSkeleton } from '../components/SkeletonLoader';

const KANBAN_COLUMNS = [
  { id: 'To Do', title: 'Backlog', color: 'border-slate-800' },
  { id: 'In Progress', title: 'In Progress', color: 'border-amber-500/20' },
  { id: 'Review', title: 'Review', color: 'border-indigo-500/20' },
  { id: 'Completed', title: 'Done', color: 'border-emerald-500/20' }
];

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return {
        stripe: 'bg-red-500',
        badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
        label: 'High-priority'
      };
    case 'Medium':
      return {
        stripe: 'bg-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        label: 'Medium-priority'
      };
    case 'Low':
      return {
        stripe: 'bg-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        label: 'Low-priority'
      };
    default:
      return {
        stripe: 'bg-slate-500',
        badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
        label: 'Normal'
      };
  }
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [view, setView] = useState('board'); // 'board', 'tasks', 'analytics'
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const setSearchQuery = (val) => {
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, dashboardRes, usersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/projects/${id}/dashboard`),
        api.get('/auth/users'),
      ]);

      if (projectRes.data.success) setProject(projectRes.data.project);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (dashboardRes.data.success) setDashboard(dashboardRes.data.dashboard);
      if (usersRes.data.success) setAvailableUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      toast.error('Failed to load project');
      if (error.response?.status === 404 || error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (socket) {
      const handleTaskCreated = (data) => {
        if (data.projectId === id) {
          setTasks(prev => [data.task, ...prev]);
          fetchProjectData();
        }
      };
      const handleTaskUpdated = (data) => {
        if (data.projectId === id) {
          setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
          fetchProjectData();
        }
      };
      const handleTaskDeleted = (data) => {
        if (data.projectId === id) {
          setTasks(prev => prev.filter(t => t._id !== data.taskId));
          fetchProjectData();
        }
      };
      socket.on('taskCreated', handleTaskCreated);
      socket.on('taskUpdated', handleTaskUpdated);
      socket.on('taskDeleted', handleTaskDeleted);
      return () => {
        socket.off('taskCreated', handleTaskCreated);
        socket.off('taskUpdated', handleTaskUpdated);
        socket.off('taskDeleted', handleTaskDeleted);
      };
    }
  }, [socket, id]);

  const handleCreateTask = async (data) => {
    try {
      const response = await api.post('/tasks', data);
      if (response.data.success) {
        setTasks([response.data.task, ...tasks]);
        fetchProjectData();
        setShowTaskModal(false);
        toast.success('Task created successfully!');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (data) => {
    try {
      const response = await api.put(`/tasks/${editingTask._id}`, data);
      if (response.data.success) {
        setTasks(tasks.map(t => t._id === editingTask._id ? response.data.task : t));
        fetchProjectData();
        setShowTaskModal(false);
        setEditingTask(null);
        toast.success('Task updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(t => t._id !== taskId));
        fetchProjectData();
        toast.success('Task deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleUpdateMembers = async (memberIds) => {
    try {
      const response = await api.put(`/projects/${id}`, {
        ...project,
        teamMembers: memberIds,
      });
      if (response.data.success) {
        setProject(response.data.project);
        setShowMemberModal(false);
        toast.success('Team members updated!');
      }
    } catch (error) {
      console.error('Failed to update members:', error);
      toast.error('Failed to update team members');
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setHoveredColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    try {
      const response = await api.put(`/tasks/${taskId}`, { status: targetStatus });
      if (response.data.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? response.data.task : t));
        fetchProjectData();
        toast.success(`Task status updated to ${targetStatus}`);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update status');
    }
  };

  const groupedTasks = useMemo(() => {
    return {
      'To Do': filteredTasks.filter(t => t.status === 'To Do'),
      'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
      'Review': filteredTasks.filter(t => t.status === 'Review'),
      'Completed': filteredTasks.filter(t => t.status === 'Completed'),
    };
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0D131F]">
        <div className="w-8 h-8 rounded-full border-4 animate-spin border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#0D131F] min-h-screen px-8 py-8 space-y-8">
      {/* Back to Dashboard Link */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl border border-[#1B253B] bg-[#141A29] text-slate-400 hover:text-white hover:bg-[#1f293e] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Workspace</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#1B253B]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{project?.title}</h1>
          {project?.description && (
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Members button */}
          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-2 bg-[#141A29] hover:bg-[#1f293e] border border-[#1B253B] text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Users size={16} className="text-teal-400" />
            <span>Team</span>
            <span className="bg-slate-800 text-[10px] text-teal-400 font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {(project?.teamMembers?.length || 0) + 1}
            </span>
          </button>

          {/* Delete Project */}
          {project?.owner?._id === user?._id && (
            <button
              onClick={handleDeleteProject}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
              title="Delete Project"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* New Task button */}
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0d9488] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)]"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* View Tabs & Control Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-[#141A29] border border-[#1B253B] p-1.5 rounded-xl self-start">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              view === 'board'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List size={14} />
            Board
          </button>
          <button
            onClick={() => setView('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              view === 'tasks'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List size={14} />
            List View
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              view === 'analytics'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141A29] border border-[#1B253B] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/40 w-44 md:w-56 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#141A29] border border-[#1B253B] rounded-xl px-3 py-2 text-xs">
            <Filter size={14} className="text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Page Content */}
      {view === 'analytics' && dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardMetrics dashboard={dashboard} />
        </motion.div>
      )}

      {/* List Page Content */}
      {view === 'tasks' && (
        <div className="space-y-6">
          {filteredTasks.length > 0 ? (
            <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1B253B] text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                    <th className="px-6 py-4">Task Name</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Assignees</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B253B]/50">
                  {filteredTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-[#1f293e]/30 transition-colors">
                      <td className="px-6 py-4.5 font-medium text-white">{task.title}</td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority).badge}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-medium text-slate-400">{task.status}</span>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex -space-x-1.5">
                          {task.assignedTo?.map((u) => (
                            <div
                              key={u._id}
                              className="w-7 h-7 rounded-full bg-[#1B253B] border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                              title={u.name}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#141A29] border border-[#1B253B] rounded-2xl text-slate-500">
              No tasks found. Click "+ New Task" to create one.
            </div>
          )}
        </div>
      )}

      {/* Kanban Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = groupedTasks[col.id] || [];
            const isHovered = hoveredColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredColumn(col.id);
                }}
                onDragLeave={() => setHoveredColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-[#141A29] border ${
                  isHovered ? 'border-teal-500' : 'border-[#1B253B]'
                } rounded-2xl flex flex-col max-h-[70vh] transition-all duration-200 overflow-hidden shadow-lg`}
              >
                {/* Column Header */}
                <div className="px-5 py-4 border-b border-[#1B253B] flex items-center justify-between bg-slate-900/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">{col.title}</span>
                    <span className="bg-slate-800 text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards Stack */}
                <div className="p-4 overflow-y-auto space-y-4 min-h-[400px] flex-1 scrollbar-thin">
                  {colTasks.length > 0 ? (
                    colTasks.map((task) => {
                      const colors = getPriorityColor(task.priority);
                      // Generate persistent mock numbers for design fidelity
                      const stringHash = task.title.length;
                      const commentCount = (stringHash % 7) + 1;
                      const checklistCompleted = (stringHash % 3) + 1;
                      const checklistTotal = checklistCompleted + ((stringHash % 2) + 2);

                      return (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                          className="bg-[#1D2437] border border-[#232B3F] hover:border-teal-500/40 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing group relative overflow-hidden flex"
                        >
                          {/* Vertical Priority Indicator Stripe */}
                          <div className={`w-1 absolute left-0 top-0 bottom-0 ${colors.stripe}`} />

                          {/* Task Content */}
                          <div className="flex-1 pl-2.5 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              {/* Priority Badge */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${colors.badge}`}>
                                {colors.label}
                              </span>

                              {/* Task Hover Action Overlay */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="p-1 hover:text-teal-400 text-slate-400 transition-colors bg-slate-800 rounded-md"
                                  title="Edit"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="p-1 hover:text-red-400 text-slate-400 transition-colors bg-slate-800 rounded-md"
                                  title="Delete"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-sm text-slate-100 group-hover:text-white leading-snug">
                              {task.title}
                            </h3>

                            {/* Description */}
                            {task.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Card Footer Actions and Overlapping Avatars */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#232B3F]/80">
                              {/* Avatars */}
                              <div className="flex -space-x-1.5">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 3).map((u) => (
                                    <div
                                      key={u._id}
                                      className="w-6 h-6 rounded-full bg-[#1B253B] border-2 border-[#1D2437] flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                                      title={u.name}
                                    >
                                      {u.name.charAt(0).toUpperCase()}
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#1D2437] flex items-center justify-center text-[9px] text-slate-500 font-bold">
                                    ?
                                  </div>
                                )}
                                {task.assignedTo && task.assignedTo.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#1D2437] flex items-center justify-center text-[8px] font-bold text-white">
                                    +{task.assignedTo.length - 3}
                                  </div>
                                )}
                              </div>

                              {/* Card Icons */}
                              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-medium">
                                <span className="flex items-center gap-1 hover:text-slate-300">
                                  <MessageSquare size={12} />
                                  <span>{commentCount}</span>
                                </span>
                                <span className="flex items-center gap-1 hover:text-slate-300">
                                  <CheckSquare size={12} />
                                  <span>{checklistCompleted}/{checklistTotal}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#1B253B]/60 rounded-xl text-slate-600 text-xs">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation & Update Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
        projectId={id}
      />

      {/* Team Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-inner"
              onClick={() => setShowMemberModal(false)}
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#1B253B]">
                <h2 className="text-xl font-bold text-white">Manage Team</h2>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-3 max-h-96">
                {/* Owner */}
                <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/25">
                  <div className="flex gap-3 items-center">
                    <div className="flex justify-center items-center w-10 h-10 text-sm font-semibold text-white bg-gradient-to-br rounded-xl from-teal-500 to-cyan-600 shadow-md">
                      {project?.owner?.name?.charAt(0)?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{project?.owner?.name}</p>
                      <p className="text-[10px] text-slate-500">Project Owner</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                </div>

                {/* Other Members */}
                {availableUsers.filter(u => u._id !== project?.owner?._id).map((user) => {
                  const isMember = project?.teamMembers?.some(m => m._id === user._id) ||
                    project?.teamMembers?.includes(user._id);
                  return (
                    <label
                      key={user._id}
                      className="flex justify-between items-center p-4 rounded-xl transition-colors cursor-pointer bg-slate-900/40 border border-slate-800 hover:bg-slate-800/50"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex justify-center items-center w-10 h-10 text-sm font-semibold text-white bg-gradient-to-br rounded-xl from-slate-600 to-slate-700 shadow-inner">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isMember}
                        onChange={(e) => {
                          const currentMembers = project?.teamMembers?.map(m => m._id || m) || [];
                          let newMembers;
                          if (e.target.checked) {
                            newMembers = [...currentMembers, user._id];
                          } else {
                            newMembers = currentMembers.filter(id => id !== user._id);
                          }
                          handleUpdateMembers(newMembers);
                        }}
                        className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500/50 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
              <div className="p-6 border-t border-[#1B253B]">
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;