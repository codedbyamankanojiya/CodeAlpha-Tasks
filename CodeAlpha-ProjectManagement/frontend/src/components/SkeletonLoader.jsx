import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className = '' }) => {
  return (
    <motion.div
      className={`bg-slate-800 rounded animate-pulse ${className}`}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};

export const ProjectListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card border-slate-800">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="w-3/4 h-5 rounded" />
              <Skeleton className="w-full h-4 rounded" />
              <div className="flex gap-6">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TaskListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card border-slate-800">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-2/3 h-5 rounded" />
              <div className="flex gap-3">
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card border-slate-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="w-24 h-4 rounded" />
                <Skeleton className="w-16 h-8 rounded" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="card border-slate-800">
            <Skeleton className="w-40 h-6 rounded mb-4" />
            <Skeleton className="w-full h-48 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;