import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckSquare, Calendar, Clock, AlertCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import { TaskListSkeleton } from '../components/SkeletonLoader';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchAllTasks = async () => {
    try {
      const projectsResponse = await api.get('/projects');
      if (projectsResponse.data.success) {
        const allTasks = [];
        for (const project of projectsResponse.data.projects) {
          try {
            const tasksResponse = await api.get(`/tasks/project/${project._id}`);
            if (tasksResponse.data.success) {
              allTasks.push(...tasksResponse.data.tasks.map(task => ({
                ...task,
                projectName: project.title,
                projectId: project._id
              })));
            }
          } catch (err) {
            // skip
          }
        }
        setTasks(allTasks);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Low': return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'In Progress': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'To Do': return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter === 'all' || task.status === filter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="bg-[#0D131F] min-h-screen p-6 md:p-8 space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1B253B]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">All Tasks</h1>
          <p className="text-slate-400 mt-1">View and manage all your tasks across projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="all">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task, idx) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl hover:border-teal-500/30 hover:shadow-glow transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <CheckSquare size={24} className={task.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-bold ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      {new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
                        <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full">
                          <AlertCircle size={12} />
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Project:</span>
                      <span className="text-sm text-slate-300 font-medium">{task.projectName}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Users size={12} />
                          {task.assignedTo.length} {task.assignedTo.length === 1 ? 'assignee' : 'assignees'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-12 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto mb-6">
            <svg className="w-full h-full text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 13h6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
          <p className="text-slate-400">
            {tasks.length === 0 ? 'Create your first task to get started' : 'No tasks match your current filters'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Tasks;