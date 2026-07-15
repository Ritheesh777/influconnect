# Collably

A brand–creator collaboration marketplace. Companies post campaigns, creators apply,
both chat in real time, collaborate, and review each other. **No on-platform payments** —
settlement stays private (Version 1 scope). Built to later wrap into an Android **APK with Capacitor**.

## Stack

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + React Router               |
| Realtime  | Socket.io (chat, typing, read receipts, live notifications) |
| Backend   | Node.js + Express (ESM)                                      |
| Database  | MongoDB + Mongoose                                           |
| Auth      | JWT (roles: company / creator / admin), bcrypt              |
| Media     | Cloudinary (falls back to a local placeholder until keys added) |
| Mobile    | Capacitor wrap of the built SPA                             |

## Project layout

```
collably/
├── server/          Express API + Socket.io
│   └── src/
│       ├── models/        Mongoose schemas
│       ├── controllers/   Route handlers
│       ├── routes/        Express routers
│       ├── middleware/    auth, roles, validation, upload, errors
│       ├── sockets/       real-time chat
│       └── seed/          demo data
└── client/          React + Vite SPA
    └── src/
        ├── pages/         public / auth / company / creator / shared / admin
        ├── components/    reusable UI
        ├── context/       Auth + Socket providers
        ├── layouts/       public nav + dashboard sidebar
        └── api/           axios client + typed endpoints
```

## Getting started

Prerequisites: **Node ≥ 20** and a running **MongoDB** (local `mongod` or Atlas URI).

```bash
# 1. Install everything (root tooling + server + client)
npm run install:all

# 2. Configure the server env (a .env is created for you on first run;
#    otherwise copy the example and edit)
cp server/.env.example server/.env      # then set MONGO_URI / JWT_SECRET etc.

# 3. Seed demo data (admin, companies, creators, campaigns)
npm run seed

# 4. Run API + client together (http://localhost:5173)
npm run dev
```

> The API runs on **:5050** (port 5000 is taken by macOS AirPlay). Vite proxies
> `/api` and `/socket.io` to it, so the client "just works" in dev.

### Demo accounts (after seeding)

| Role    | Email                          | Password       |
|---------|--------------------------------|----------------|
| Admin   | admin@collably.com         | Admin@12345    |
| Company | spiceroutekitchen@demo.com     | Password@123   |
| Creator | ananyacreates@demo.com         | Password@123   |

## Environment variables (`server/.env`)

| Key                    | Purpose                                  |
|------------------------|------------------------------------------|
| `PORT`                 | API port (default 5050)                  |
| `MONGO_URI`            | MongoDB connection string                |
| `JWT_SECRET`           | Token signing secret                     |
| `CLIENT_URL`           | Allowed CORS origin (client dev URL)     |
| `CLOUDINARY_*`         | Media uploads — add when you have keys   |
| `ADMIN_EMAIL/PASSWORD` | Seeded admin credentials                 |

Media uploads work without Cloudinary keys (they return a local placeholder),
so you can build the whole flow before wiring real storage.

## Turning it into an APK (later)

The frontend is a pure client-side SPA, so wrapping is straightforward:

```bash
cd client
npm i @capacitor/core @capacitor/cli @capacitor/android
# point the app at your deployed API:
echo "VITE_API_URL=https://your-api-domain.com" > .env.production
npm run build
npx cap add android
npx cap sync
npx cap open android      # build the APK in Android Studio
```

`capacitor.config.json` is already present. CORS on the API already allows the
`capacitor://localhost` origin.

## Deployment

- **Client** → Vercel / Netlify (static `dist/`). Set `VITE_API_URL`.
- **API**    → Railway / Render. Set all `server/.env` vars; use MongoDB Atlas.

## Feature map (from the spec)

Auth & roles · company & creator profiles · campaign CRUD + media · browse/search with
filters · applications & invitations · accept/reject → collaboration · real-time chat
(unlocks on apply) · notifications · mutual reviews · complaints · full admin portal
(users, campaigns, reports, moderation, verification badge).

**Deferred to v2 (architecture ready):** payments/escrow, subscription tiers,
AI matching, official social-OAuth metric verification.
