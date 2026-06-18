import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Folder, Calendar, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import { ProjectListSkeleton } from '../components/SkeletonLoader';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    try {
      const response = await api.post('/projects', formData);
      if (response.data.success) {
        setProjects([response.data.project, ...projects]);
        setShowModal(false);
        setFormData({ title: '', description: '' });
        toast.success('Project created!');
      }
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  return (
    <div className="bg-[#0D131F] min-h-screen p-6 md:p-8 space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1B253B]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">All Projects</h1>
          <p className="text-slate-400 mt-1">View and manage all your projects in one place.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-glow hover:shadow-lg"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {loading ? (
        <ProjectListSkeleton />
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-6 shadow-xl hover:border-teal-500/30 hover:shadow-glow transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <Folder size={24} className="text-teal-400" />
                </div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                {project.title}
              </h3>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{(project.teamMembers?.length || 0) + 1} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl p-12 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto mb-6">
            <svg className="w-full h-full text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6">Create your first project to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 mx-auto transition-all shadow-glow hover:shadow-lg"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
            <div className="bg-[#141A29] border border-[#1B253B] rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[#1B253B]">
                <h2 className="text-xl font-semibold text-white">Create New Project</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    placeholder="Enter project title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none"
                    placeholder="Describe your project (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;