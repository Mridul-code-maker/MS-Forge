# 🛠️ MS-Forge — Multi-Tenant SaaS Workspace Platform

### 🚀 Live Demo: [https://ms-forge.vercel.app](https://ms-forge.vercel.app)

Welcome to **MS-Forge**, an enterprise-grade multi-tenant SaaS platform built for real-time collaborative workspace orchestration and task tracking. Named in honor of its creator, Mridul Sharma (MS), and designed with a premium, professional Teal & Cyan theme inspired by Linear and Cal.com.

---

## 🏗️ System Architecture & Data Isolation

MS-Forge utilizes a logical multi-tenant database design. Every record in the database—including users, tasks, and audit logs—is tagged with a unique `tenantId` (Workspace key). 
1. **Authentication Boundary:** JWT tokens encode the user's role and `tenantId` payload.
2. **REST API Isolation:** A global Express middleware extracts the `tenantId` from the verified JWT and filters all database queries to that tenant scope. Users can never request or modify tasks belonging to other organizations.
3. **WebSocket Isolation:** When a browser opens a WebSocket session, the server places the client into a specific Socket.io Room named after their `tenantId`. Broadcast updates (creating, editing, deleting tasks) are only sent to clients within that specific room.

---

## 💻 Tech Stack

* **Frontend:** Next.js 15+ (React App Router), Tailwind CSS v4, Lucide Icons, Zustand (State Management), Axios (REST Client), Socket.io Client.
* **Backend:** Express.js, Socket.io (WebSocket Engine), Prisma (Database ORM), Helmet (HTTP headers protection), Express Rate Limit, Node-Cron (Daily digests), Nodemailer (Simulated email client).
* **Database:** SQLite (dev.db file self-contained in backend for instant out-of-the-box operation).

---

## 🚀 How to Run the Application

Since Node.js is not globally registered on this system, we installed a portable Node.js binary inside the folder `C:\Users\Hp\.gemini\antigravity\scratch\.node`. All scripts must prepand this to the temporary execution `PATH`.

### 1. Launch the Backend Server
Open a terminal in the `backend/` folder and run:
```powershell
$env:PATH = "C:\Users\Hp\.gemini\antigravity\scratch\.node\node-v20.11.1-win-x64;" + $env:PATH
npm run dev
```
* The backend will spin up on **`http://localhost:5000`**.
* The keep-alive daemon can be launched with `node keep_alive.js` to prevent deployment sleeping.

### 2. Launch the Frontend Server
Open a separate terminal in the `frontend/` folder and run:
```powershell
$env:PATH = "C:\Users\Hp\.gemini\antigravity\scratch\.node\node-v20.11.1-win-x64;" + $env:PATH
npm run dev
```
* The Next.js dev server will spin up on **`http://localhost:3000`**.

---

## 🔑 Pre-Seeded Workspace Credentials

The database has been pre-populated with a sample tenant **`MS-Forge Global Workspace`** (slug: `ms-forge`). You can log in immediately with the following credentials:

* **Administrator Account:**
  * **Email:** `admin@msforge.com`
  * **Password:** `Mridul123!`
  * **Permissions:** Access to Kanban board + Admin Console (Member roster, audit logging logs, mock Stripe Billing).

* **Standard Member Account:**
  * **Email:** `member@msforge.com`
  * **Password:** `Mridul123!`
  * **Permissions:** Access to Kanban board (read, move, add tasks). Restricted from Admin Console.

---

## ⭐ Key Premium Upgrades

We have recently upgraded the platform to include several premium enterprise features:
1. **Stateful Sidebar Workspace Layout:** Smooth, cohesive left sidebar navigation structure replacing top headers.
2. **Persistence WebSockets:** Unified dashboard state to preserve active socket links, resulting in instant cross-device updates for tasks, logs, and stats.
3. **Task Completion Heatmap:** A visual 365-day calendar grid (similar to GitHub's contribution chart) showing daily task completions.
4. **Command Palette (`Cmd + K`):** Global command center overlay search bar with keyboard arrow navigation to switch tabs, search tasks, toggle dark/light mode, and invite members.
5. **Interactive SVG Charts:** Clean custom vector graphics showing monthly created/completed task trends and active status ring distributions.
6. **CSV/PDF Export Center:** Direct download options for workspace tasks data sheets, security audit logs, and high-fidelity print reports.

