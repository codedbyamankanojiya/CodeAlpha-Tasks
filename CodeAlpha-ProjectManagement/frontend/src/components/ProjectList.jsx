import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, ArrowRight } from 'lucide-react';

const ProjectList = ({ projects }) => {
  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <motion.div
          key={project._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link
            to={`/project/${project._id}`}
            className="card border-slate-800 hover:border-primary-500/30 hover:shadow-glow group block transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 7a2 2 0 012 2v2M8 7a2 2 0 00-2 2v2M3 7v10M21 7v10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users size={14} />
                      <span className="text-xs">{project.teamMembers?.length + 1} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs">{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 group-hover:text-primary-400 transition-colors ml-4">
                <span className="text-sm font-medium hidden sm:block">View</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default ProjectList;