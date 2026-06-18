import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderPlus, Compass, CheckCircle2, Clock, Star, Activity, UserCheck, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import { ProjectListSkeleton } from '../components/SkeletonLoader';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    case 'Low':
      return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data.success) {
        const fetchedProjects = response.data.projects;
        // For each project, fetch its tasks to calculate stats
        const projectsWithStats = await Promise.all(
          fetchedProjects.map(async (project) => {
            try {
              const tasksRes = await api.get(`/tasks/project/${project._id}`);
              if (tasksRes.data.success) {
                const tasks = tasksRes.data.tasks;
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.status === 'Completed').length;
                const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                
                // Get highest priority task
                let highestPriority = 'Low';
                if (tasks.some(t => t.priority === 'High')) highestPriority = 'High';
                else if (tasks.some(t => t.priority === 'Medium')) highestPriority = 'Medium';
                
                // Get nearest due date
                let nearestDueDate = null;
                const pendingTasks = tasks.filter(t => t.status !== 'Completed');
                if (pendingTasks.length > 0) {
                  const dates = pendingTasks.map(t => new Date(t.dueDate));
                  nearestDueDate = new Date(Math.min(...dates));
                } else if (tasks.length > 0) {
                  const dates = tasks.map(t => new Date(t.dueDate));
                  nearestDueDate = new Date(Math.min(...dates));
                }
                
                return {
                  ...project,
                  totalTasks,
                  completedTasks,
                  progressPercentage,
                  highestPriority,
                  nearestDueDate: nearestDueDate ? nearestDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date',
                  tasks
                };
              }
            } catch (err) {
              console.error(`Error fetching tasks for project ${project._id}:`, err);
            }
            return {
              ...project,
              totalTasks: 0,
              completedTasks: 0,
              progressPercentage: 0,
              highestPriority: 'Low',
              nearestDueDate: 'No due date',
              tasks: []
            };
          })
        );
        setProjects(projectsWithStats);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post('/projects', formData);
      if (response.data.success) {
        const newProj = {
          ...response.data.project,
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          highestPriority: 'Low',
          nearestDueDate: 'No due date',
          tasks: []
        };
        setProjects([newProj, ...projects]);
        setShowModal(false);
        setFormData({ title: '', description: '' });
        toast.success('Project created successfully!');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute Project Health metrics
  const projectHealthData = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let highPriorityTasks = 0;
    let overdueTasks = 0;

    projects.forEach(p => {
      if (p.tasks) {
        p.tasks.forEach(t => {
          totalTasks++;
          if (t.status === 'Completed') completedTasks++;
          if (t.priority === 'High') highPriorityTasks++;
          
          const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
          if (isOverdue) overdueTasks++;
        });
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 80;
    const timeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 90;
    const qualityRate = totalTasks > 0 ? Math.round(((totalTasks - highPriorityTasks) / totalTasks) * 100) : 85;
    const budgetRate = 80;
    const scopeRate = completionRate;

    return [
      { subject: 'Budget', A: budgetRate, B: 75, fullMark: 100 },
      { subject: 'Time', A: timeRate, B: 80, fullMark: 100 },
      { subject: 'Scope', A: scopeRate, B: 85, fullMark: 100 },
      { subject: 'Quality', A: qualityRate, B: 70, fullMark: 100 },
      { subject: 'metrics', A: completionRate, B: 65, fullMark: 100 },
    ];
  }, [projects]);

  // Aggregate Recent Activity
  const recentActivities = useMemo(() => {
    const allTasks = [];
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          allTasks.push({
            ...task,
            projectName: project.title
          });
        });
      }
    });

    allTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return allTasks.slice(0, 5).map((task, idx) => {
      const timeAgo = formatTimeAgo(new Date(task.updatedAt));
      const assigneeName = task.assignedTo && task.assignedTo.length > 0
        ? task.assignedTo[0].name
        : 'Team member';
      
      let actionText = 'updated';
      if (task.status === 'Completed') actionText = 'completed';
      else if (task.status === 'In Progress') actionText = 'started';
      
      return {
        id: task._id || idx,
        user: assigneeName,
        action: `${actionText} task "${task.title}"`,
        project: task.projectName,
        time: timeAgo,
        initial: assigneeName.charAt(0)
      };
    });
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [projects, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D131F]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0D131F] min-h-screen px-8 py-8 space-y-10">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 text-sm">Here is a visual overview of your workspace activities.</p>
        </div>
      </div>

      {/* Grid: Project Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Health Card */}
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Project Health</h2>
              <span className="cursor-pointer text-slate-500 hover:text-white" title="Consolidated health metrics of active projects">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
              <span className="text-lg">•••</span>
            </button>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={projectHealthData}>
                <PolarGrid stroke="#1B253B" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                <Radar name="Current Health" dataKey="A" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.3} />
                <Radar name="Target Average" dataKey="B" stroke="#A855F7" fill="#A855F7" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <button className="text-slate-500 hover:text-white transition-colors">
              <span className="text-lg">•••</span>
            </button>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto pr-1 max-h-64">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between border-b border-[#1B253B]/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 text-sm font-semibold flex-shrink-0">
                      {act.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {act.user}{' '}
                        <span className="font-normal text-slate-400">{act.action}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{act.project}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{act.time}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
                <Activity size={32} className="text-slate-600 mb-2 animate-pulse" />
                <span>No recent activity logged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row of Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Projects */}
        <div className="bg-[#141A29]/60 border border-[#1B253B] hover:border-teal-500/30 rounded-2xl p-6 shadow-md transition-all duration-300 group flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Projects</p>
            <p className="text-4xl font-extrabold text-teal-400 transition-colors">{projects.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <FolderPlus className="text-teal-400" size={24} />
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#141A29]/60 border border-[#1B253B] hover:border-emerald-500/30 rounded-2xl p-6 shadow-md transition-all duration-300 group flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Projects</p>
            <p className="text-4xl font-extrabold text-emerald-400 transition-colors">
              {projects.filter(p => p.totalTasks > 0 && p.progressPercentage < 100).length || projects.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <UserCheck className="text-emerald-400" size={24} />
          </div>
        </div>

        {/* Your Projects */}
        <div className="bg-[#141A29]/60 border border-[#1B253B] hover:border-teal-500/30 rounded-2xl p-6 shadow-md transition-all duration-300 group flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Projects</p>
            <p className="text-4xl font-extrabold text-teal-400 transition-colors">
              {projects.filter(p => p.owner?._id === user?._id).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Compass className="text-teal-400" size={24} />
          </div>
        </div>
      </div>

      {/* Active Projects Section Table */}
      <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#1B253B] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Projects</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0d9488] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)] active:scale-95"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <ProjectListSkeleton />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B253B] text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B253B]/50">
                {filteredProjects.map((proj) => (
                  <tr
                    key={proj._id}
                    onClick={() => navigate(`/project/${proj._id}`)}
                    className="hover:bg-[#1f293e]/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4.5">
                      <div className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                        {proj.title}
                      </div>
                      {proj.description && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-sm">
                          {proj.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-400 rounded-full transition-all duration-300"
                            style={{ width: `${proj.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                          {proj.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">
                      {proj.nearestDueDate}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold leading-none ${getPriorityBadgeClass(proj.highestPriority)}`}>
                        {proj.highestPriority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Activity size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No projects found. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1B253B]">
                <h2 className="text-xl font-bold text-white">Create New Project</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-200"
                    placeholder="Enter project title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-200 resize-none"
                    placeholder="Describe your project (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-3 rounded-xl transition-all"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;