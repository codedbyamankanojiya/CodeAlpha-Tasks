import React from 'react';

export const ProjectIllustration = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background elements */}
    <circle cx="320" cy="60" r="100" fill="url(#gradient1)" opacity="0.1" />
    <circle cx="80" cy="240" r="80" fill="url(#gradient2)" opacity="0.1" />

    {/* Main card */}
    <rect x="100" y="60" width="200" height="140" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />

    {/* Card header */}
    <rect x="100" y="60" width="200" height="40" rx="16" fill="#334155" />
    <circle cx="125" cy="80" r="8" fill="#14b8a6" />
    <rect x="145" y="76" width="80" height="8" rx="4" fill="#64748b" />

    {/* Card content - project bars */}
    <rect x="120" y="115" width="160" height="12" rx="6" fill="#334155" />
    <rect x="120" y="115" width="120" height="12" rx="6" fill="#14b8a6" />

    <rect x="120" y="140" width="160" height="12" rx="6" fill="#334155" />
    <rect x="120" y="140" width="80" height="12" rx="6" fill="#f59e0b" />

    <rect x="120" y="165" width="160" height="12" rx="6" fill="#334155" />
    <rect x="120" y="165" width="140" height="12" rx="6" fill="#14b8a6" />

    {/* Floating task card */}
    <rect x="260" y="140" width="120" height="80" rx="12" fill="#1e293b" stroke="#14b8a6" strokeWidth="2" className="animate-float" />
    <rect x="275" y="155" width="60" height="8" rx="4" fill="#64748b" />
    <circle cx="350" cy="159" r="12" fill="#14b8a6" opacity="0.2" />
    <circle cx="350" cy="159" r="6" fill="#14b8a6" />

    <rect x="275" y="175" width="90" height="6" rx="3" fill="#475569" />
    <rect x="275" y="190" width="70" height="6" rx="3" fill="#475569" />

    {/* Decorative elements */}
    <circle cx="80" cy="80" r="20" fill="#14b8a6" opacity="0.1" />
    <circle cx="80" cy="80" r="10" fill="#14b8a6" opacity="0.2" />

    <rect x="60" y="200" width="40" height="40" rx="8" fill="#f59e0b" opacity="0.1" />

    {/* Connecting lines */}
    <path d="M200 130 C 230 130, 250 140, 260 150" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M300 160 L 320 180" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4 4" />

    <defs>
      <linearGradient id="gradient1" x1="220" y1="0" x2="420" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="gradient2" x1="0" y1="160" x2="160" y2="320" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const TaskIllustration = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="100" cy="100" r="120" fill="url(#taskGradient1)" opacity="0.1" />
    <circle cx="300" cy="200" r="100" fill="url(#taskGradient2)" opacity="0.1" />

    {/* Main task board */}
    <rect x="60" y="60" width="280" height="180" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />

    {/* Column headers */}
    <rect x="80" y="80" width="70" height="20" rx="10" fill="#334155" />
    <rect x="170" y="80" width="70" height="20" rx="10" fill="#334155" />
    <rect x="260" y="80" width="60" height="20" rx="10" fill="#334155" />

    {/* To Do column */}
    <rect x="80" y="115" width="70" height="50" rx="8" fill="#334155" opacity="0.5" />
    <rect x="85" y="120" width="60" height="6" rx="3" fill="#64748b" />
    <rect x="85" y="132" width="40" height="6" rx="3" fill="#475569" />

    <rect x="80" y="175" width="70" height="50" rx="8" fill="#334155" opacity="0.5" />
    <rect x="85" y="180" width="55" height="6" rx="3" fill="#64748b" />
    <rect x="85" y="192" width="45" height="6" rx="3" fill="#475569" />

    {/* In Progress column */}
    <rect x="170" y="115" width="70" height="60" rx="8" fill="#14b8a6" opacity="0.2" stroke="#14b8a6" strokeWidth="1" />
    <rect x="175" y="120" width="60" height="6" rx="3" fill="#14b8a6" />
    <rect x="175" y="132" width="50" height="6" rx="3" fill="#64748b" />
    <rect x="175" y="144" width="55" height="6" rx="3" fill="#475569" />
    <circle cx="230" cy="123" r="8" fill="#14b8a6" opacity="0.3" />

    <rect x="170" y="185" width="70" height="45" rx="8" fill="#14b8a6" opacity="0.2" stroke="#14b8a6" strokeWidth="1" />
    <rect x="175" y="190" width="50" height="6" rx="3" fill="#14b8a6" />
    <rect x="175" y="202" width="40" height="6" rx="3" fill="#64748b" />

    {/* Completed column */}
    <rect x="260" y="115" width="60" height="40" rx="8" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="1" />
    <rect x="265" y="120" width="50" height="6" rx="3" fill="#f59e0b" />
    <rect x="265" y="132" width="35" height="6" rx="3" fill="#475569" />
    <circle cx="305" cy="123" r="8" fill="#f59e0b" opacity="0.3" />

    {/* Floating elements */}
    <circle cx="360" cy="80" r="20" fill="#14b8a6" opacity="0.1" />
    <circle cx="360" cy="80" r="10" fill="#14b8a6" opacity="0.2" />

    <rect x="40" y="200" width="30" height="30" rx="6" fill="#f59e0b" opacity="0.1" />

    <defs>
      <linearGradient id="taskGradient1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="taskGradient2" x1="200" y1="100" x2="400" y2="300" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const EmptyStateIllustration = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="url(#emptyGradient)" opacity="0.1" />

    {/* Folder */}
    <path d="M60 80L80 60H120L140 80V140H60V80Z" stroke="#64748b" strokeWidth="2" fill="none" />
    <path d="M60 80V140H140V80" stroke="#64748b" strokeWidth="2" />

    {/* Dotted lines representing empty */}
    <rect x="75" y="100" width="50" height="4" rx="2" fill="#475569" opacity="0.5" />
    <rect x="75" y="112" width="35" height="4" rx="2" fill="#475569" opacity="0.5" />

    {/* Stars */}
    <circle cx="160" cy="60" r="3" fill="#14b8a6" opacity="0.6" />
    <circle cx="40" cy="120" r="2" fill="#f59e0b" opacity="0.6" />
    <circle cx="150" cy="150" r="2" fill="#14b8a6" opacity="0.6" />

    <defs>
      <linearGradient id="emptyGradient" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#0d9488" />
      </linearGradient>
    </defs>
  </svg>
);

export default { ProjectIllustration, TaskIllustration, EmptyStateIllustration };