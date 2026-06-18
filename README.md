# 🚀 CodeAlpha Full-Stack Web Development Internship Tasks

Welcome to the central repository for my **Full-Stack Web Development Internship** at **CodeAlpha**. This workspace contains a collection of premium, production-ready web applications built from scratch, highlighting modern UI/UX design, real-time communication, database integrations, and analytics.

## 👤 Author Information
- **Intern Name:** Aman Kanojiya
- **GitHub Profile:** [@codedbyamankanojiya](https://github.com/codedbyamankanojiya)
- **Organization:** [CodeAlpha](https://codealpha.in/)
- **Internship Domain:** Full-Stack Web Development

---

## 📂 Repository Structure

This repository is organized into three distinct, standalone full-stack projects structured as followed:

```text
CodeAlpha-Tasks/
├── CodeAlpha-E-Commerce/           # Task 1: ApexBazaar multi-vendor marketplace (Vanilla JS + Node + Postgres)
├── CodeAlpha-ProjectManagement/    # Task 2: Analytics-driven project management app (MERN + Recharts)
├── CodeAlpha-CollabTool/          # Task 3: Real-time kanban collaboration platform (MERN + Socket.io)
├── .gitignore                      # Global git exclusions (dependencies, secrets, envs)
└── README.md                       # Repository master documentation (this file)
```

---

## 🛠️ Unified Tech Stack Matrix

Below is a summary of the technologies leveraged across the projects in this repository, structured by task order:

| Project Directory | Frontend Architecture | Backend & API | Database Engine | Core Libraries & Packages |
| :--- | :--- | :--- | :--- | :--- |
| **[E-Commerce](./CodeAlpha-E-Commerce)** | HTML5, CSS3 (Glassmorphic system), Vanilla JS, Chart.js, Lucide | Node.js, Express.js | PostgreSQL (Sequelize ORM) | `bcryptjs`, JWT, Jest, Supertest, Express-Rate-Limit, Helmet |
| **[ProjectManagement](./CodeAlpha-ProjectManagement)** | React 19, Vite, Tailwind CSS, Framer Motion | Node.js, Express.js | MongoDB (Mongoose ORM) | `recharts`, Lucide React, Axios, React Router, Sonner Toasts |
| **[CollabTool](./CodeAlpha-CollabTool)** | React 18, Vite, Tailwind CSS, Framer Motion | Node.js, Express.js, Socket.io | MongoDB (Atlas/Mongoose) | `@hello-pangea/dnd`, JWT, `bcryptjs`, Axios, React Router v6 |

---

## 💎 Project Deep Dives

### 1. 🛒 [CodeAlpha-E-Commerce](./CodeAlpha-E-Commerce) — ApexBazaar Multi-Vendor Marketplace (Task 1)
A robust, secure multi-vendor marketplace featuring clean separation of roles and live analytics tracking.
*   **Key Features:**
    *   **Three Roles Panel System:** Distinct portals for Customers (browsing, wishlist, checkout), Sellers (inventory management, earnings metrics), and Admins (user moderation, order states, site statistics).
    *   **Glassmorphism Theme:** Premium glass elements over subtle radial background glows.
    *   **Interactive Dashboards:** Visual revenue and order charts built using Chart.js on the administrator control panel.
    *   **Persistent Shopping Cart & Checkout:** Database-driven cart management with Sequelize ORM and PostgreSQL.
    *   **Advanced Security Guards:** Protected route middlewares, password encryption using `bcryptjs`, API rate limiting, and CORS restrictions.

---

### 2. 📊 [CodeAlpha-ProjectManagement](./CodeAlpha-ProjectManagement) — Project Tracker & Analytics (Task 2)
An analytics-heavy, modern platform for users to create projects, assign teams, and track tasks via charts.
*   **Key Features:**
    *   **Analytical Dashboards:** Clean data visualizations using `recharts` (radial progress bars and task priority distributions).
    *   **Granular Task Control:** High, Medium, and Low color-coded priority queues, due-date validation constraints, and overdue visual indicators.
    *   **Team Membership:** Collaborator management where projects can be shared with registered users.
    *   **Polished User Experience:** Framer Motion transition animations, skeleton screen loaders, and Sonner toast notifications.

---

### 3. 📋 [CodeAlpha-CollabTool](./CodeAlpha-CollabTool) — Real-Time Kanban Board (Task 3)
A premium, multi-user real-time workspace designed for teams to organize tasks and communicate instantly.
*   **Key Features:**
    *   **WebSocket Synchronization:** Live multiplayer session updates using Socket.io Rooms (dragging cards, adding columns, updating checklists).
    *   **Premium SaaS Graphite Theme:** Crafted custom charcoal overlays, crisp border separators, and visual cues.
    *   **Slide-over Context Drawers:** Keeps columns fully in view by sliding detail editors from the right instead of blocking overlays.
    *   **Interactive Checklists:** Parses checklist markdown dynamically from card notes, auto-calculating progression on custom circular SVG progress rings.
    *   **Live Feed Sidebar:** Real-time log tracking user events (creation, relocations, deletions).

---

## ⚙️ Quick Start & Setup Instructions

### Prerequisites
Before running the applications, make sure you have the following installed locally:
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [MongoDB](https://www.mongodb.com/try/download/community) (either running locally or a MongoDB Atlas URI)
*   [PostgreSQL](https://www.postgresql.org/download/) (running locally for ApexBazaar database schema)

---

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/codedbyamankanojiya/CodeAlpha-Tasks.git
    cd CodeAlpha-Tasks
    ```

2.  **Run Individual Projects:**
    Each project is fully standalone. Navigate into the desired folder and follow the detailed setup instructions inside its own README:
    *   **E-Commerce Setup (Task 1):** Refer to the [E-Commerce README](./CodeAlpha-E-Commerce/README.md) for instructions on running the database migration and seeder script (`npm run seed`) to seed 100+ starter marketplace products.
    *   **Project Management Setup (Task 2):** Refer to the [ProjectManagement README](./CodeAlpha-ProjectManagement/README.md) for running client and server processes concurrently.
    *   **CollabTool Setup (Task 3):** Refer to the [CollabTool README](./CodeAlpha-CollabTool/README.md) for database connection configurations and Socket.io setups.

---

## 🔒 Security & Safe Credentials Rules

> [!IMPORTANT]
> To prevent leaking confidential data, a root-level `.gitignore` has been added. The following files are **explicitly blocked** from commits:
> *   `node_modules/` (All local dependencies)
> *   `.env` and `.env.local` files (Database credentials, JWT secret keys, API URLs)
> *   Local database dumps and state files (`*.db`, `*.sqlite`, `.sql`, etc.)
> *   System logs (`npm-debug.log`, `yarn-error.log`)
> *   Developer IDE configurations (`.vscode/`, `.idea/`)
>
> **Always copy `.env.example` to `.env` inside each project's subdirectories and customize it locally.**

---

*Developed with ❤️ by Aman Kanojiya for the CodeAlpha Internship.*
