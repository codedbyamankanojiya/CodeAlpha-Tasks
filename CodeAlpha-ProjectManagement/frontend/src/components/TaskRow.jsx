import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MoreVertical } from 'lucide-react';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'Medium':
      return 'bg-accent-500/10 text-accent-400 border-accent-500/30';
    case 'Low':
      return 'bg-primary-500/10 text-primary-400 border-primary-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-primary-500/10 text-primary-400 border-primary-500/30';
    case 'In Progress':
      return 'bg-accent-500/10 text-accent-400 border-accent-500/30';
    case 'To Do':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

const TaskRow = ({ task, onEdit }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`card border-slate-800 hover:border-slate-700 transition-all duration-200 group ${isOverdue ? 'border-red-500/30 bg-red-500/5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl ${task.status === 'Completed' ? 'bg-primary-500/10' : 'bg-slate-800'}`}>
            {task.status === 'Completed' ? (
              <CheckCircle2 className="text-primary-400" size={20} />
            ) : (
              <Clock className="text-slate-500" size={20} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h4 className={`font-medium truncate ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-white'}`}>
                {task.title}
              </h4>
              {isOverdue && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs animate-pulse">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Overdue</span>
                </div>
              )}
            </div>

            {task.description && (
              <p className="text-slate-500 text-sm mb-2 line-clamp-1">{task.description}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <Clock size={12} />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignedTo.slice(0, 3).map((user) => (
                <div
                  key={user._id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white border-2 border-slate-900"
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 border-2 border-slate-900">
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onEdit}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskRow;