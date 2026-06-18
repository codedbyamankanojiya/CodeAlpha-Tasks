# 📊 Project Management Platform

Developed by **Aman Kanojiya** as part of the **CodeAlpha Full-Stack Development Internship**.

A modern, production-ready project management application built with React, Node.js, Express, and MongoDB. Designed with professional UI/UX and packed with powerful features.

## Features

### 🔐 Authentication
- **User Authentication**: Secure JWT-based authentication with login and registration
- **User Profiles**: Public profiles with avatars

### 📊 Project Management
- **Project CRUD**: Create, view, edit, and delete projects
- **Team Management**: Add/remove team members to projects
- **Project Analytics**: Dashboard with key metrics

### ✅ Task Management
- **Task CRUD**: Create, view, edit, and delete tasks
- **Priority System**: Low, Medium, High priority levels with color coding
- **Status Tracking**: To Do → In Progress → Completed workflow
- **Task Assignment**: Assign tasks to team members
- **Due Dates**: Prevent past due dates, with visual overdue alerts
- **Search & Filter**: Search tasks by title/description and filter by priority

### 📈 Analytics Dashboard
Beautiful visualizations using Recharts:
- Project completion progress (radial bar chart)
- Tasks by priority (bar chart)
- Key metrics (total tasks, completed tasks, progress percentage)

### 🎨 UI/UX
- **Modern Design**: Slate/Blue/Purple color scheme with glassmorphism effects
- **Responsive Layout**: Works on all screen sizes
- **Smooth Animations**: Powered by Framer Motion
- **Toast Notifications**: Real-time user feedback (Sonner)
- **Skeleton Loaders**: Improved perceived performance
- **Icon Library**: Lucide React icons

### 🛡️ Security & Quality
- **Input Validation**: Server-side validation
- **Error Handling**: Comprehensive error handling
- **CORS Protection**: Configured CORS settings

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React (Icons)
- React Router
- Axios

## Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js (v18 or later)
- MongoDB (or MongoDB Atlas account)
- npm or yarn

### Installation & Setup

#### 1. Clone the repository

```bash
cd CodeAlpha-ProjectManagement
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/project-management
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

**Important**: Replace `JWT_SECRET` with a secure random string.

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (copy from `.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

#### 1. Start MongoDB

Make sure MongoDB is running locally, or use a MongoDB Atlas connection string in your `.env` file.

#### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will be running on `http://localhost:5000`

#### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be running on `http://localhost:5173`

## Usage

1. **Register**: Create a new account or login with an existing one
2. **Create Project**: Click "New Project" to create your first project
3. **Add Tasks**: Open a project and create tasks with due dates and priorities
4. **Assign Tasks**: Assign tasks to yourself or other team members
5. **Track Progress**: View the analytics dashboard to see project completion metrics
6. **Update Status**: Change task statuses from "To Do" → "In Progress" → "Completed"

## Project Structure

```
CodeAlpha-ProjectManagement/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── DashboardMetrics.jsx
    │   │   ├── ProjectList.jsx
    │   │   ├── TaskRow.jsx
    │   │   ├── AssigneeDropdown.jsx
    │   │   ├── TaskModal.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── ProjectDetails.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users

### Projects
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/:id/dashboard` - Get project dashboard metrics
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/project-management |
| JWT_SECRET | Secret key for JWT tokens | (required) |
| NODE_ENV | Environment | development |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

## License

MIT

## Author

**Aman Kanojiya** — Created as part of the CodeAlpha Full-Stack Development Internship.