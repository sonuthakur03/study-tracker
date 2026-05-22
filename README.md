# StudyTrack Nepal 🇳🇵
### AI/ML & Data Engineering Learning Tracker with Daily Email Reminders

A full-stack web app for Nepali BCA students to track their AI/ML and Data Engineering learning journey alongside college work.

---

## ✨ Features

### User Features
- **Dashboard** — Streak counter, daily study hours, task progress, roadmap phase
- **DSA Tracker** — 20 pre-loaded LeetCode questions, mark complete, filter by difficulty/topic
- **AI/ML & Data Engineering Roadmap** — 6-phase roadmap with topic-level progress tracking
- **Projects** — Track ideas, in-progress, and completed projects with GitHub links
- **College Section** — Weekly timetable + assignment tracker with due-date alerts
- **Settings** — Profile, email preferences, study target, password change

### Admin Features
- Add/edit DSA questions and roadmap topics
- Manage users (promote to admin, delete)
- Send announcements (with optional email blast)
- Manually trigger daily emails

### Email System
- Beautiful HTML daily email at **7:00 AM Nepal Time** automatically
- Contains: today's tasks, DSA question of the day, next roadmap topic, upcoming assignments
- Powered by **Nodemailer + Gmail** and **node-cron**
- Streak reset and daily hour reset at midnight NPT

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Email | Nodemailer + Gmail App Password |
| Cron | node-cron |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| DB Hosting | MongoDB Atlas (free tier) |

---

## 📁 Project Structure

```
study-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js          — User schema with streak, phases, preferences
│   │   └── index.js         — Task, DSAQuestion, RoadmapTopic, Project, Assignment, Schedule, Announcement
│   ├── routes/
│   │   ├── auth.js          — Register, login, profile, log hours
│   │   ├── tasks.js         — CRUD daily tasks
│   │   ├── dsa.js           — DSA questions + user completion toggle
│   │   ├── roadmap.js       — Roadmap topics + user completion toggle
│   │   ├── projects.js      — User projects CRUD
│   │   ├── college.js       — Schedule + assignments CRUD
│   │   └── admin.js         — Stats, user management, announcements, email trigger
│   ├── middleware/
│   │   └── auth.js          — JWT auth middleware + admin middleware
│   ├── services/
│   │   ├── emailService.js  — HTML email builder + Nodemailer transporter
│   │   └── cronService.js   — Daily email at 7AM NPT + streak/hour resets
│   ├── seed/
│   │   └── seedData.js      — 20 DSA questions + full AI/ML & DE roadmap
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/axios.js        — Axios instance with JWT interceptor
    │   ├── contexts/AuthContext.jsx
    │   ├── components/Layout.jsx — Sidebar + mobile nav
    │   └── pages/
    │       ├── Login.jsx / Register.jsx
    │       ├── Dashboard.jsx
    │       ├── DSATracker.jsx
    │       ├── Roadmap.jsx
    │       ├── Projects.jsx
    │       ├── College.jsx
    │       ├── Settings.jsx
    │       └── admin/
    │           ├── AdminDashboard.jsx
    │           ├── ManageDSA.jsx
    │           ├── ManageRoadmap.jsx
    │           └── ManageUsers.jsx
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## ⚙️ Setup Instructions

### 1. MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/study-tracker`
5. Add `0.0.0.0/0` to IP allowlist (for Render deployment)

### 2. Gmail App Password (for emails)
1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords → Generate for "Mail"
4. Copy the 16-character password

### 3. Backend — Local Setup

```bash
cd backend
cp .env.example .env
# Fill in your MongoDB URI, JWT secret, Gmail credentials
npm install
npm run seed    # Seeds 20 DSA questions + full roadmap + admin user
npm run dev     # Starts on port 5000
```

### 4. Frontend — Local Setup

```bash
cd frontend
npm install
npm run dev     # Starts on port 5173
```

Visit `http://localhost:5173`

---

## 🌍 Deployment

### Backend → Render (Free)
1. Push backend folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add all environment variables from `.env.example`
8. Deploy — get your URL: `https://your-app.onrender.com`

### Frontend → Vercel (Free)
1. Push frontend folder to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Connect repo, set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-app.onrender.com/api
   ```
5. Deploy

### Seed in Production
After deploying backend, trigger seed via Render's shell:
```bash
npm run seed
```

---

## 🔑 Default Admin Account

After running seed with `ADMIN_EMAIL` set in `.env`:
- **Email**: your ADMIN_EMAIL
- **Password**: `Admin@12345` ← **change this immediately!**

---

## 📧 Email Schedule (Nepal Time)

| Time (NPT) | Action |
|---|---|
| 7:00 AM | Daily study plan email to all subscribed users |
| 12:00 AM | Streak reset for users who didn't study yesterday |
| 12:01 AM | Reset today's study hours |

---

## 📚 BCA 5th Semester — TU Subjects Covered
- Artificial Intelligence
- Data Warehousing & Data Mining
- Distributed System
- Internet & Intranet
- Minor Project

> ⚠️ Always verify with your official TU/IoCST notice board — subjects may vary by batch.

---

## 🛠 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16char_app_password
ADMIN_EMAIL=admin@gmail.com
APP_NAME=StudyTrack Nepal
```

---

## 📝 License
MIT — free to use and modify.

Built with 💜 for Nepali students learning AI/ML and Data Engineering.
