# Collably — What This Project Does

## In one line
Collably is a **brand–creator collaboration marketplace**: businesses post campaigns, content creators discover and apply to them, both sides chat in real time, collaborate, and review each other — all in one trusted, moderated place. **No money changes hands on the platform** (payments are settled privately); the product's job is discovery, communication, and trust.

## The problem it solves
Small and mid-sized businesses (restaurants, fashion labels, cafés, gyms, gaming studios, travel brands…) increasingly rely on micro and mid-tier creators for marketing. Today that happens through messy Instagram DMs, WhatsApp, and cold outreach — with **no structured search, no way to verify each other, no single record of the deal, and no accountability**. Collably replaces that chaos with a structured marketplace.

## Who uses it (three roles)
1. **Company** — a business that posts campaigns and hires creators.
2. **Creator** — an influencer/content creator who applies to campaigns and gets hired.
3. **Administrator** — the platform owner who verifies, moderates, and keeps the marketplace clean.

## The core loop
**Arrive → Register → Set up profile → Post/Browse → Apply/Invite → Accept → Chat → Collaborate → Review → (Moderate).**

- A **Company** posts a campaign (title, brief, category, platforms, follower range, location, deadline, terms) and can also proactively **search creators and invite** them.
- A **Creator** browses/filters campaigns, **applies** with a message, or accepts an **invitation**.
- The moment an application/invitation exists, a **private real-time chat unlocks** between the two parties (with typing indicators and read receipts).
- When the Company **accepts**, a **Collaboration** is created. After it's marked complete, **both sides leave a 1–5★ review**, which builds public reputation.
- Anyone can file a **complaint** with evidence; the **Admin** reviews reports and can verify, suspend, ban, feature, flag, or remove.

## What makes it trustworthy
- **Admin "verified" badge** (the anti-fake-follower safeguard).
- **Mutual reviews** that follow both companies and creators over time.
- **Complaint + moderation** system with an admin queue.
- **Collaboration-scoped chat** — no unsolicited contact between strangers.

## What's intentionally NOT in v1 (ready for v2)
- On-platform **payments / escrow** (settled offline for now).
- **Subscription tiers** (Free/Pro/Business).
- **AI matching/recommendations**.
- **Official social-OAuth** metric verification.
The data model and APIs are built so these slot in later without a redesign.

## Tech at a glance
- **Frontend:** React + Vite + Tailwind, Framer Motion, glassmorphism UI, Clash Display + Satoshi fonts. Client-rendered SPA → wraps cleanly into an **Android APK with Capacitor**.
- **Backend:** Node + Express, MongoDB (Mongoose), JWT auth (company/creator/admin), Socket.io for real-time chat & notifications, Cloudinary for media.
- **Deploy target:** Vercel (web) + Railway/Render (API) + MongoDB Atlas.

## Business model (later)
Free to build liquidity now; a future subscription layer gates premium features (unlimited campaigns, advanced filters, featured placement) — layered on the existing role system without breaking v1.
