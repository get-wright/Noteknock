# Noteknock Prototype — Design

StudyMap (Vietnamese study/notes app, Peeky design system) ported to a real web app:
FastAPI + Postgres backend, Vite + React + TS frontend. This spec covers the **full
prototype** at a high level and **Phase 1 (auth foundation) in detail**.

Baseline decisions live in `/handoff.md` §1–§6. This spec does not repeat them; it
resolves the open questions and defines the build.

## Source of truth

- **Canonical design:** `/Users/n3m0/Downloads/note-taking-app-port/project/StudyMap.dc.html`
  (Peeky identity: coral `#FF6B6B` / cream `#FDFAF6` / plum ink `#2D1B35`, Fraunces+Inter,
  warm deep-plum dark theme `#1E1322`). Tokens lifted verbatim from its `<helmet>`.
- **Ignore** `uploads/StudyMap Login.html` — stale earlier draft (teal `#2E7D6B` / Geist /
  phone-frame). Does not match the `.dc.html` app. The real login is split-screen
  (coral-gradient art panel + cream form), already present in `.dc.html`.
- Peeky token CSS: `project/_ds/peeky-design-system-*/tokens/*.css` (same values as the
  inline `<helmet>` — lift either).

## Resolved decisions

Per project memory ([[noteknock-scope-decisions]]) the 4 handoff §7 opens resolve against
the doc defaults: **multi-user**, **DB-backed StudyMap**, **real Google OAuth**,
**attachments**. These are eventual targets. For build phasing:

| Question | Resolution |
|---|---|
| Multi-user? | Yes — `users` table, per-owner notes. |
| StudyMap dynamic screens | Phase 3, DB-backed. Phase 1–2 don't touch them. |
| Attachments | Phase 4. |
| Google sign-in | **Phase 1: visual placeholder** (button renders, no-op). Real OAuth: Phase 4. |
| Phase 1 scope | **Auth foundation only** — scaffold + auth backend + landing/login/register. No app shell yet. |

## Architecture (whole prototype)

```
/
  docker-compose.yml      # postgres:16 + backend + frontend
  .env.example
  backend/                # FastAPI, SQLAlchemy 2.0 async, Alembic, argon2/JWT
  frontend/               # Vite + React + TS, React Router
  docs/, handoff.md
```

**Frontend routing** (React Router — not the prototype's single screen-switch):

- Public: `/` (landing), `/login`, `/register`
- Protected `/app/*`: dashboard · study · editor · quiz · result · review · profile · streak
  — ported from the prototype `renderVals()` + SVG builders verbatim in later phases,
  `x-dc`/`DCLogic`/`support.js` runtime dropped, JSX rewritten.

**Auth transport:** register/login return a JWT; frontend stores it in `localStorage`,
sends `Authorization: Bearer <jwt>`. Protected routes redirect to `/login` when no/invalid
token.

## Phasing

- **Phase 1 (this spec):** monorepo scaffold + compose + Postgres; backend `users` +
  `/api/register`, `/api/token`, `/api/auth-check`, `/api/config`, `/health`; frontend
  tokens + landing + login + register wired to real auth + protected-route redirect.
- **Phase 2:** notes CRUD + search/tags (Postgres FTS) + editor + dashboard recent list.
- **Phase 3:** StudyMap screens (quiz/review/streak), DB-backed.
  **Fix the quiz explanation/dock spacing** ("A bit too close?" — `dockStyle` margin
  collapses once the explanation panel expands).
- **Phase 4:** real Google OAuth + attachments/object storage.

Each phase gets its own spec → plan → implement cycle. Below is Phase 1 only.

---

# Phase 1 — Auth foundation

## Backend

**Data model** (Phase 1 subset of handoff §4):

```
users
  id            uuid pk (default gen_random_uuid())
  name          text
  email         text unique not null
  password_hash text not null        -- argon2
  created_at    timestamptz default now()
```

Alembic migration creates the table. (Notes tables deferred to Phase 2.)

**Endpoints** (camelCase JSON via Pydantic `alias_generator`; `Token` stays snake_case):

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/register` | no | `{name, email, password}` | `Token`; 409 email taken |
| POST | `/api/token` | no | `{username, password}` (form) | `Token {access_token, token_type:"bearer"}`; 401 bad creds |
| GET | `/api/auth-check` | yes | — | `"OK"`; 401 |
| GET | `/api/config` | no | — | `{authType, ...}` (UI bootstrap) |
| GET | `/health` | no | — | `"OK"` |

- **JWT:** HS256, payload `{sub, exp}`, expiry `JWT_EXPIRY_DAYS=30`. Secret from `JWT_SECRET`.
- **Password:** argon2 hash. Register rejects duplicate email (409) and weak input.
- **Validation:** email regex, password ≥ 8 chars (server-side; mirrors client).
- **Error strings (parity):** bad login → `"Invalid login details."`;
  email taken → `"An account with this email already exists."`
- **`/api/config`** returns `{authType: "password"}` for now (Phase 4 flips to include google).

**Env:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY_DAYS`. `.env.example` documents them.
`JWT_SECRET` has no default — backend refuses to start without it (no insecure fallback).

## Frontend

**Tokens:** lift Peeky `:root` + `[data-theme="dark"]` from the `.dc.html` `<helmet>` into
`frontend/src/styles/tokens.css`. Fraunces+Inter via the existing Google Fonts `@import`.
Theme toggle persists to `localStorage` (matches prototype's `sm_*` pattern).

**Screens:**

- **Landing (`/`)** — net-new, fuller marketing page in Peeky language:
  coral-gradient hero (Fraunces headline *"Học chậm lại, nhớ lâu hơn."* + the login art
  panel's sub-copy), 3 feature blurbs (notes / quiz / streak using the prototype's
  `notes`/`quiz`/`flame` icons), theme toggle, footer, CTAs → `/register` and `/login`.
- **Login (`/login`)** — port the `.dc.html` `isLogin` block verbatim: split-screen
  (coral-gradient art panel on desktop ≥960px + cream form), email + password (show/hide
  eye), `Đăng nhập`, divider, Google button (placeholder), link to `/register`. Reuse the
  prototype's `loginSubmit()` validation (email regex, pw ≥ 8). On success: store token,
  redirect to `/app` (a stub "logged in" placeholder this phase, since the app shell is
  Phase 2).
- **Register (`/register`)** — mirror login's split-screen. Art panel headline
  *"Bắt đầu sổ tay của bạn."* Fields: name, email, password, confirm password. CTA
  `Đăng ký`. Validation: email regex, pw ≥ 8, confirm matches. Coral focus rings, rose
  error state (reuse the prototype's `inputStyle(err)` + error-display pattern). On
  success: store token, redirect to `/app`.

**Auth client:** thin `api.ts` (fetch wrapper that attaches Bearer + parses camelCase) and
an auth context/hook storing the token in `localStorage`. Protected `/app/*` redirects to
`/login` when `auth-check` fails. `/app` this phase is a minimal placeholder confirming
login worked (e.g. "Đã đăng nhập" + logout) — full dashboard is Phase 2.

## Verification (Phase 1)

`docker compose up` brings up Postgres + backend + frontend. Then:

1. `GET /health` → `"OK"`.
2. Register a user via the UI → lands on `/app` placeholder (auto-login).
3. Re-register same email → 409, rose error shown.
4. Log out, log in with the same creds → `/app`.
5. Log in with wrong password → `"Invalid login details."`, rose error.
6. Hit `/app` with no token (incognito) → redirected to `/login`.
7. Backend tests: register happy path, duplicate-email 409, login happy path, bad-creds
   401, auth-check with/without valid token. Run before claiming done.

## Out of scope (Phase 1)

Notes CRUD/search/tags, editor, dashboard, all StudyMap screens, real Google OAuth,
attachments. Wired in Phases 2–4.
