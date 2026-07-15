# Deploying Collably

Two pieces ship separately:
- **Frontend** (React SPA) → **Vercel** → `collably.vercel.app`
- **Backend** (Express + Socket.io) → a container host → provides the API URL
- **Database** → **MongoDB Atlas** (free tier)

> Heads-up: the actual deploy has to run under **your** accounts (Vercel, the
> backend host, Atlas). I've prepared every config below; you run the connect
> steps once and it goes live.

---

## 0. Prerequisites
1. Push this repo to **GitHub** (private is fine).
2. Create free accounts: **Vercel**, **MongoDB Atlas**, and a backend host (**Render** recommended).

---

## 1. Database — MongoDB Atlas (free)
1. atlas.mongodb.com → create a **free M0 cluster**.
2. **Database Access** → add a user (username + password).
3. **Network Access** → Allow access from anywhere (`0.0.0.0/0`) for now.
4. **Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/collably`
   (add `/collably` before the `?` so it uses that DB).

---

## 2. Backend — Render (recommended for real-time + Mongo)
Render runs the included `server/Dockerfile` and supports WebSockets.

1. render.com → **New → Web Service** → connect your GitHub repo.
2. **Root Directory:** `server`  · **Runtime:** Docker.
3. **Environment variables:**
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string from step 1 |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://collably.vercel.app` |
   | `NODE_ENV` | `production` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary (optional at first) |
4. Deploy. Note the URL, e.g. `https://collably-api.onrender.com`.
5. Seed once (Render **Shell**): `npm run seed`.

**Railway** works the same way (New Project → Deploy from repo → root `server` → add the same env vars).

### About Hugging Face Spaces for the backend
HF Spaces *can* run this via Docker, but it's built for ML demos, not a stateful
real-time API: free Spaces **sleep**, WebSocket proxying is unreliable, and you'd
still need Atlas for the database. I recommend **Render/Railway** for the API. If
you still want HF, use a **Docker Space** pointing at `server/Dockerfile` and add
the same env vars as Space **secrets** — and keep your HF token secret (never
commit it).

---

## 3. Frontend — Vercel → collably.vercel.app
1. vercel.com → **Add New → Project** → import the repo.
2. **Root Directory:** `client` (Vercel reads `client/vercel.json`).
3. **Environment Variable:**
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your backend URL from step 2 (e.g. `https://collably-api.onrender.com`) |
4. **Project name / domain:** set it so the URL is `collably.vercel.app`
   (Project Settings → Domains).
5. Deploy.

The client already reads `VITE_API_URL` (`client/src/api/client.js`) and points
both REST and Socket.io at it in production; in local dev it uses the Vite proxy.

---

## 4. Final wiring
1. Confirm the backend `CLIENT_URL` equals `https://collably.vercel.app` (CORS + Socket.io origin) and redeploy the backend if you changed it.
2. Visit `https://collably.vercel.app` → register/login → chat should connect live.

---

## 5. Later: Android APK (Capacitor)
```bash
cd client
npm i @capacitor/core @capacitor/cli @capacitor/android
echo "VITE_API_URL=https://YOUR-BACKEND-URL" > .env.production
npm run build
npx cap add android
npx cap sync
npx cap open android   # build the APK in Android Studio
```
`capacitor.config.json` is already present and the API's CORS allows the
`capacitor://localhost` origin.
