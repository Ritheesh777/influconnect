# Collably — Master Build Prompt

> Paste everything below into a capable coding agent to regenerate the entire application from scratch. It is self-contained: product, roles, pages, data model, API, real-time, design system, and constraints.

---

You are building **Collably**, a production-grade **brand–creator collaboration marketplace** (a web app that will later be wrapped as an Android APK with Capacitor). Build it end to end.

## 1. Product summary
A marketplace connecting **Companies** (businesses) and **Creators** (influencers), plus an **Administrator**. Companies post campaigns; creators apply or get invited; both chat in real time; they collaborate and review each other. **No payments are processed on-platform** — payment is arranged privately/offline. The platform's value is structured discovery, real-time communication, mutual reviews, and moderation.

## 2. Tech stack (fixed)
- **Frontend:** React 18 + Vite + React Router + Tailwind CSS + Framer Motion + lucide-react icons + axios + socket.io-client + react-hot-toast. Pure client-rendered SPA (Capacitor-friendly).
- **Backend:** Node.js + Express (ESM) + MongoDB with Mongoose + JWT auth (bcrypt) + Socket.io + Cloudinary (media) + Zod (validation) + multer (uploads).
- **Structure:** monorepo with `client/` and `server/`. API on port 5050 (5000 clashes with macOS AirPlay). Vite proxies `/api` and `/socket.io` to the API.

## 3. Roles & auth
- Roles: `company`, `creator`, `admin`. JWT with `{ id, role }`. Passwords bcrypt-hashed.
- **One shared login form** for everyone: it sends only email+password; the server returns the account's real role and the client redirects to that role's dashboard (`/admin`, `/company`, `/creator`). Do **not** build a separate admin login page or link.
- Email verification (verify/resend) and forgot/reset password via hashed tokens (return the raw token in dev responses so flows are testable without an email service).
- Account status: `active | suspended | banned` — non-active accounts cannot log in.
- Middleware: `protect` (valid JWT), `authorize(...roles)`, `optionalAuth`.

## 4. Data models (MongoDB)
- **User**: role, email (unique), password (hashed, select:false), phone, name, status, isVerified, isAdminVerified (trust badge), emailVerification+passwordReset token/expiry, profileCompleted, lastLoginAt, notificationPrefs {email, browser}.
- **CompanyProfile**: user ref, companyName, industry (enum), description, website, logoUrl, bannerUrl, address, city, state, country, ratingAvg, ratingCount, campaignsPosted.
- **CreatorProfile**: user ref, fullName, username (unique), bio, avatarUrl, city/state/country, categories[], socials[] (platform, username, followers, avgViews, engagementRate, verified), portfolio[] (type image/video/pdf/certificate, title, url), mediaKitUrl, totalFollowers (auto-summed from socials on save), ratingAvg, ratingCount.
- **Campaign**: company ref, companyProfile ref, title, description, bannerUrl, images[], category (enum), campaignType (Product Review/Sponsored Reel/Story/YouTube Video/Giveaway/Brand Ambassador), platforms[] (instagram/youtube/tiktok/facebook), followerRange (1K-5K…100K+), minEngagementRate, city/state/country, isWorldwide, creatorsNeeded, deadline, terms, status (draft/active/paused/closed/completed), moderation (approved/pending/flagged/removed), isFeatured, viewsCount, applicationsCount, acceptedCount. Text index on title+description.
- **Application**: campaign, company, creator refs; origin (`application` = creator applied, `invitation` = company invited); message; portfolioSnapshot[]; status (pending/accepted/rejected/withdrawn); respondedAt. Unique on (campaign, creator).
- **Collaboration**: campaign, application, company, creator; status (active/completed/cancelled); completedAt; companyReviewed, creatorReviewed. Created when an application/invitation is accepted.
- **Conversation**: campaign, application, collaboration, participants[2]; lastMessage, lastMessageAt; unread Map(userId→count). One per company↔creator↔campaign.
- **Message**: conversation, sender, body, attachments[], readBy[]. 
- **Review**: collaboration, campaign, author, subject, authorRole, rating (1–5), comment. Unique on (collaboration, author). Recompute subject's ratingAvg/Count on create.
- **Notification**: user, type (application_received/accepted/rejected, invitation_received, new_message, deadline_reminder, review_received, complaint_update, account_status, campaign_match), title, body, link, meta, isRead.
- **Complaint**: reporter, targetType (user/campaign/message), targetUser/targetCampaign, reason, description, evidence[], status (open/reviewing/resolved/dismissed), resolutionNote, resolvedBy, resolvedAt.
- **SavedCampaign**: creator, campaign (unique pair).
- **ContactMessage**: name, email, message, handled.

## 5. Business rules
- **Chat unlocks the moment a creator applies or a company invites** (create the Conversation then).
- Accepting an application **or** a creator accepting an invitation creates a **Collaboration** and increments the campaign's acceptedCount.
- Reviews are only allowed after a Collaboration is `completed`; each side may review once; it updates the other party's rating.
- Notifications are persisted **and** pushed live over Socket.io to the recipient's personal room.
- Admin `isAdminVerified` is the anti-fake-follower "verified" badge.

## 6. REST API (prefix `/api`)
- `auth`: register/company, register/creator, login, me, verify-email, resend-verification, forgot-password, reset-password, change-password.
- `company`: me (get/put), me/media (logo+banner upload), dashboard (stats + recent), :id (public profile + reviews).
- `creator`: `/` search (company-only, filters: q, city, country, platform, min/maxFollowers, category, paginate), me (get/put), me/avatar, me/socials (replace), me/portfolio (add/delete), me/media-kit, dashboard, :id (public).
- `campaigns`: `/` browse (filters: q, category, platform, followerRange, campaignType, city, country, sort latest/popular/deadline, paginate; annotate isSaved for creators), featured, mine (company), :id (get; increments views; returns myApplication+isSaved), create, update, :id/status, :id/media, delete, :id/applications.
- `applications`: apply (creator), invite (company), mine, received, :id/decision (accept/reject), :id/respond-invite (creator), :id/withdraw.
- `chat`: conversations, conversations/:id/messages (get marks read), send.
- `reviews`: create, mine (given+received), user/:userId.
- `collaborations`: mine, :id/complete.
- `notifications`: list, :id/read, read-all, clear, preferences.
- `saved`: list, :campaignId (toggle).
- `complaints`: create, mine.
- `public`: contact, stats (companies/creators/campaigns counts).
- `admin`: dashboard, users (list/get/status/verify/delete), campaigns (list/moderation feature-flag-remove), complaints (list/resolve).
Standardize error handling (ApiError + a global handler mapping Mongoose CastError/duplicate/validation), Zod request validation, and rate-limit auth routes.

## 7. Real-time (Socket.io)
- JWT-authenticated connections; each user joins room `user:<id>`.
- Events: `conversation:join/leave`, `message:send` (persist + emit `message:new` to the room and the other user + push a notification), `typing`, `message:read` (read receipts + unread reset), `presence:update`. A registry maps userId→sockets so REST controllers can emit too.

## 8. Pages (build every one)
**Public:** Landing (animated hero with photo collage, how-it-works, two-paths, trust strip, live campaigns, CTA), How It Works, About+Contact form, Browse Campaigns (filters/sort/paginate) with "sign up to apply" wall, public Campaign Detail, Terms, Privacy, 404.
**Auth:** shared Login (creator/company toggle is cosmetic only), Register choice, Company Register, Creator Register, Forgot, Reset, Verify Email. Two-column layout with a **photographic** brand panel on the right.
**Company:** Profile Setup wizard, Dashboard (stat cards + recent), Create/Edit Campaign, My Campaigns (status tabs, edit/delete), Campaign Manage (analytics + inline application accept/reject + pause/resume/close/complete), Campaign Applications, All Applications inbox, Find Creators (search/filter grid), Creator View (socials/portfolio/media kit/reviews + Invite modal), Company Profile (editable, logo/banner upload).
**Creator:** Two-step Profile Setup (basics + socials editor), Dashboard (recommended campaigns), Browse (filters + bookmark), Campaign Detail (sticky Apply bar + save), Apply (message), My Applications (status tabs, withdraw, accept/decline invites), Saved, Profile (editable + socials editor + portfolio upload/remove + media-kit upload).
**Shared:** Messages (conversation list + real-time thread, typing, read receipts, unread badges), Notifications (typed icons, mark-read/clear, deep links), Reviews (collaborations → mark complete → leave 1–5★ review; reviews about you), Settings (change password, notification toggles, logout).
**Admin:** Dashboard (totals + recent signups), Manage Users (search/filter, verify/suspend/ban/delete), Manage Campaigns (feature/flag/remove/restore), Reports/Complaints (reviewing/resolve/dismiss, ban target, view evidence).

## 9. Design system (make it premium)
- **Brand:** signature **violet → fuchsia** gradient (primary `#7c3aed`, accent `#d946ef`) over a warm neutral "ink" scale, with a near-black `#0b0b14` for dark panels. Rationale: violet = creativity + premium + trust, gender-neutral, distinct from generic blue SaaS; fuchsia adds creator-economy energy.
- **Type:** **Clash Display** (headings) + **Satoshi** (body), loaded from Fontshare.
- **Glassmorphism:** frosted translucent cards/nav/sidebar/modals over an ambient aurora background gradient; fine white borders, soft shadows, inner sheen.
- **Motion (Framer Motion):** hero photo collage float, scroll-reveal + staggered cards, animated sidebar active-pill, page transitions, animated modals/drawer. **Cards have an animated rotating gradient edge-glow** (conic-gradient border via CSS `@property --angle`, masked to a thin ring; a blurred outer bloom on hover).
- **Performance (must stay smooth on low-end):** code-split every route with `React.lazy`; animate only transform/opacity; keep heavy `backdrop-blur` to few surfaces (cards use medium blur); hover-only for the expensive blurred bloom; honor `prefers-reduced-motion`; lazy-load images.
- **Critical rule:** never force a global text color on headings — headings must **inherit** color so they stay light on dark panels and dark on light panels (a forced dark color makes dark-on-dark text vanish).
- **No emojis anywhere** — use lucide SVG icons for every glyph (nav, buttons, stats, badges, empty states, platforms).
- Inputs must be **solid/high-contrast** (never near-invisible until focused).
- Fully responsive; safe-area padding for the future APK.

## 10. Seed & docs
Seed an admin, ~3 companies (with logos/banners), ~3 creators (with avatars/socials), and ~3 featured campaigns (with category banner images). Use verified-reachable placeholder images (Unsplash) centralized in one swappable module. Provide a README with run/seed instructions, a `.env.example`, and demo credentials.

## 11. Constraints
No on-platform payments in v1. Model roles/subscriptions independently so payments, subscription tiers, AI matching, and social-OAuth verification can be added later without redesign. Ship it runnable end-to-end.
