# Event Management System 🔥

A full-stack Event Management application with an Express + MongoDB backend and a React frontend (both Next and Vite apps are present in this repo). This README gives a high-level overview, quick setup steps, and useful commands to get you started.

---

## Contents
- **Overview** ✅
- **Quick start** ⚡
- **Environment variables** 🔒
- **Available scripts** 🧭
- **Testing & Troubleshooting** 🧪
- **Deployment** 🚀
- **Contributing** 🤝

---

## Overview
This repository contains:

- `backend/` — Express.js API, MongoDB (Mongoose) models, controllers and tests.
- `frontend/` — React + Vite app (TailwindCSS) that consumes the backend API.
- Root app — a Next.js-based app (root `package.json`) with utilities and shared dependencies.
- `SETUP_INSTRUCTIONS.md` — detailed setup & feature documentation (recommended reading).

Key features include user authentication (JWT), role-based access control, event CRUD, registrations, polls, messages, uploads, and dashboards.

---

## Quick start (development)
Prerequisites: Node.js (v16+ recommended), npm or pnpm, and MongoDB (local or cloud).

1. Start the backend

```bash
cd backend
npm install
# create .env (see Environment variables below)
npm run dev
```
The backend defaults to `http://localhost:5000` and serves API routes under `/api`.

2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```
The Vite frontend dev server runs on `http://localhost:3000` and proxies `/api` to the backend (see `vite.config.js`).

3. (Optional) Root Next app

```bash
# from repo root
npm install
npm run dev
```

---

## Environment variables
Create a `.env` file in `backend/` with at least:

```
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<strong-secret>
```

Frontend uses `/api` as its base URL; if you need to change this, configure the Vite proxy or use an env var when deploying.

Refer to `backend/.env.example` (or `backend/.env`) for example values.

---

## Useful scripts
From repo root you can run high-level scripts; but most work happens inside the `backend/` or `frontend/` directories.

Backend (from `backend/`):
- `npm run dev` — start dev server with nodemon
- `npm start` — start production server
- `npm test` — run Jest integration tests

Frontend (from `frontend/`):
- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally

Root (from repo root):
- `npm run dev` — (Next.js) dev server
- `npm run build` — build Next app
- `npm start` — start Next app
- `npm run lint` — run ESLint

---

## Testing & troubleshooting 🧪
- Backend tests: `cd backend && npm test` (uses Jest + mongodb-memory-server for fast, isolated tests)
- Health checks:
  - Server: `GET /api/health`
  - DB: `GET /api/health/db`
- If you see DB connection issues, verify `MONGO_URI` and that your MongoDB is reachable.

---

## Deployment notes 🚀
- Backend: set `MONGO_URI` & `JWT_SECRET` on your host (Heroku, Railway, etc.). Ensure uploads directory persistence or use external storage.
- Frontend: configure the deployed frontend to call your backend API (set API URL or proxy accordingly).
- Use HTTPS and strong `JWT_SECRET` in production.

---

## Contributing 🤝
Contributions are welcome. Please:
1. Open an issue describing the change/bug.
2. Create a feature branch and a clear PR description.
3. Include tests when applicable and keep linting passing.

Check `SETUP_INSTRUCTIONS.md` for more developer-oriented details.

---
