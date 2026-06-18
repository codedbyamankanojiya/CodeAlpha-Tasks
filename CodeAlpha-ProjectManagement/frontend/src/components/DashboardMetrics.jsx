import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const DashboardMetrics = ({ dashboard }) => {
  const progressData = [
    {
      name: 'Progress',
      value: dashboard.progressPercentage,
      fill: '#14b8a6',
    },
  ];

  const priorityData = [
    { name: 'High', count: dashboard.tasksByPriority.High, fill: '#ef4444' },
    { name: 'Medium', count: dashboard.tasksByPriority.Medium, fill: '#f59e0b' },
    { name: 'Low', count: dashboard.tasksByPriority.Low, fill: '#14b8a6' },
  ];

  const statusData = [
    { name: 'To Do', value: dashboard.tasksByStatus['To Do'], fill: '#64748b' },
    { name: 'In Progress', value: dashboard.tasksByStatus['In Progress'], fill: '#f59e0b' },
    { name: 'Review', value: dashboard.tasksByStatus['Review'] || 0, fill: '#818cf8' },
    { name: 'Completed', value: dashboard.tasksByStatus['Completed'], fill: '#14b8a6' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Progress Card */}
      <div className="card border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Project Progress</h3>
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <TrendingUp className="text-primary-400" size={20} />
          </div>
        </div>

        <div className="relative h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={12} data={progressData}>
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill="#14b8a6"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-1">{dashboard.progressPercentage}%</p>
              <p className="text-slate-500 text-sm">Complete</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CheckCircle2 size={16} />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-primary-400">{dashboard.completedTasks}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Clock size={16} />
              <span className="text-sm">Remaining</span>
            </div>
            <p className="text-2xl font-bold text-accent-400">{dashboard.totalTasks - dashboard.completedTasks}</p>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="card border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Priority Distribution</h3>
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <AlertTriangle className="text-accent-400" size={20} />
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tickLine={false} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Overview */}
      <div className="card border-slate-800 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Task Status Overview</h3>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Clock className="text-purple-400" size={20} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {statusData.map((status) => (
            <div key={status.name} className="bg-slate-800/50 rounded-xl p-6 text-center">
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${status.fill}20` }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: status.fill }}
                />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{status.value}</p>
              <p className="text-slate-400 text-sm">{status.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;