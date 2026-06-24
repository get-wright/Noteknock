# Noteknock — Handoff

StudyMap (Vietnamese study/notes app, Peeky design system) ported to a real web app, with flatnotes' note functionality on a Postgres backend. This doc started as the baseline research/design handoff; the active implementation source of truth is now `docs/plans/2026-06-23-noteknock-full-build.md`, which supersedes older details here when they conflict.

## Handoff Maintenance

- After finishing any implementation task from `docs/plans/2026-06-23-noteknock-full-build.md`, update this file before moving to the next task.
- Record the completed task, commit SHA(s), verification run, spec/code review status, blockers, and the next planned task.
- Keep this section concise; do not duplicate the full plan. Prefer links/commit IDs plus high-signal notes future agents would otherwise miss.

## Current Status

- Phase 3 backend through P3.3 is complete and reviewed: recall items/generation, quiz models/migration `0004`, quiz generation API, quiz attempts, review events, activity, and streak APIs.
- Latest completed plan task: P3.3 `Add quiz attempts and activity APIs` (`e02acf3`), with spec-review and code-review gates passed.
- Next plan task: P3.4 frontend quiz screens unless the user redirects.

---

## TL;DR — what to do first

1. **Check first** (before writing code): confirm the 4 open decisions in [§7](#7-open-decisions--confirm-before-building). They change the data model and auth surface.
2. **Build order** (each unblocks the next):
   1. Scaffold monorepo + `docker-compose.yml` (Postgres 16) — §6
   2. Backend: models → auth → notes CRUD → search/tags — §3, §4
   3. Frontend: Vite scaffold → design tokens → auth screens → StudyMap shell → wire notes API — §5
   4. `handoff` verify: `docker compose up`, register, create note, search by `#tag`.
3. **Source of truth**: the prototype is `StudyMap.dc.html` (extracted to `/home/n3m0/.claude/jobs/2838d9f2/tmp/design/note-taking-app-port/`). It's React-via-`React.createElement` wrapped in Anthropic's `x-dc`/`DCLogic` runtime — port the data + `renderVals()` + SVG builders verbatim, drop the runtime.

---

## 1. Decisions (locked)

| Area | Choice | Why / lazier fork rejected |
|---|---|---|
| Repo | Monorepo: `/backend`, `/frontend`, root `docker-compose.yml` | One `up` brings up everything. |
| Backend | **FastAPI** (Python) | flatnotes *is* FastAPI — port real route/auth/search logic vs rewrite. Rejected all-Node: would reinvent flatnotes. |
| DB | **Postgres 16** | Per request. flatnotes' flat-file + Whoosh → `notes` rows + Postgres FTS (`tsvector`). |
| ORM | SQLAlchemy 2.0 async + asyncpg | Standard; Alembic for migrations. |
| Auth | **JWT (HS256) + argon2** password hash, login **and** register | flatnotes has login only (single env user, no DB). We add a real `users` table + register, since the brief asks for a register panel. |
| Frontend | **Vite + React + TS** | Prototype is already `React.createElement`; ports cleanly. |
| Markdown editor | Raw markdown `<textarea>` + preview (react-markdown + remark-gfm) | Lazier than Toast UI WYSIWYG; covers GFM, tasks, code, tables. Add WYSIWYG only if asked. |
| StudyMap-only screens | Quiz / Streak / Review / spaced-repetition render with **seed data** for the backbone | Not in flatnotes. Notes CRUD + search + tags + editor get real API wiring; the rest is visual port. |

---

## 2. Design direction (Peeky, via frontend-design)

The prototype owns a non-default identity — **keep it**, don't reinvent.

- **Palette** (from Peeky tokens): `--canvas #FDFAF6` cream · `--surface #F5F0EB` · `--paper #FFFFFF` · `--ink #2D1B35` plum · `--muted #75607F` · `--accent #FF6B6B` coral (single CTA color) · warm semantics (green `#5C9E6E`, amber `#C98A2E`, rose `#C2607B`). Dark theme = **warm deep-plum**, never grey (Peeky forbids cold dark mode).
- **Type**: Fraunces (display/headings, soft serif) + Inter (body/UI) + mono for formulas/data. Negative letter-spacing on headings.
- **Radii**: 24px signature (cards/buttons/sheets); chips/round buttons fully pill.
- **Shadows**: soft, low, plum-tinted. Coral glow only on primary CTA.
- **Signature**: split-screen auth — full-bleed coral-gradient art panel (Fraunces eyebrow + headline) beside a cream form. Persisted across **both** login and register so auth feels like part of the study ritual.

**Auth screens** (Vietnamese, sentence case):
- *Login* (exists in prototype): email, password (show/hide), `Đăng nhập`, Google button, link to register. Validation: email regex, password ≥ 8 chars.
- *Register* (design new, mirror login): name, email, password, confirm password. Same art panel, headline e.g. *"Bắt đầu sổ tay của bạn."* CTA `Đăng ký`, link back to login. Coral focus rings, rose error state.

Full token CSS already lives in the prototype's `<helmet>` (`:root` + `[data-theme="dark"]`) — lift it into `frontend/src/styles/tokens.css`.

---

## 3. Backend API surface (port from flatnotes, camelCase JSON)

> **Critical**: all JSON keys are **camelCase** on the wire (`lastModified`, `newTitle`, `titleHighlights`…). flatnotes uses a Pydantic `alias_generator`. Keep it for parity. Exception: `Token` stays snake_case (`access_token`, `token_type`) per OAuth2.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/register` | no | `{name, email, password}` | `Token` *(new — not in flatnotes)* |
| POST | `/api/token` | no | `{username, password}` | `Token {access_token, token_type:"bearer"}`, 401 bad creds |
| GET | `/api/auth-check` | yes | — | `"OK"` |
| GET | `/api/notes/{title}` | yes | — | `Note`; 400 invalid, 404 missing |
| POST | `/api/notes` | yes | `{title, content?}` | `Note`; 400, 409 exists |
| PATCH | `/api/notes/{title}` | yes | `{newTitle?, newContent?}` | `Note`; 400, 409, 404 |
| DELETE | `/api/notes/{title}` | yes | — | `null`; 400, 404 |
| GET | `/api/search?term=&sort=&order=&limit=` | yes | — | `SearchResult[]` |
| GET | `/api/tags` | yes | — | `string[]` (distinct, lowercased) |
| GET | `/api/config` | no | — | `{authType, quickAccess*}` (UI bootstrap) |
| GET | `/health` | no | — | `"OK"` |

**Auth**: JWT HS256 signed with secret, payload `{sub, exp}`, 30-day default expiry. Transport: `Authorization: Bearer <jwt>` header **or** `token` cookie (header wins). Register/login both return a token; frontend stores it (localStorage) and sends Bearer.

**Search** (emulate Whoosh on Postgres FTS):
- `term="*"` → match all (used by quick-access / recent list).
- `#tag` in term → rewrite to a tag filter before parsing.
- `tsvector` over title+content, **title weighted higher** (`setweight A/B`). Sort modes: `score` (default, `ts_rank`), `title`, `lastModified`; `order` asc/desc (default desc); optional `limit`.
- Quoted `"phrase"` → search title+content only, skip tags (parity quirk).
- Highlights via `ts_headline` → `titleHighlights` / `contentHighlights` (HTML snippet or null); `tagMatches` = matched tag names or null.
- Operators surfaced to users: `#tag`, `title:`/`content:`/`tags:`, `AND`/`OR`/`NOT`, `"phrase"`, `*`.

**Error strings** (parity): invalid title → `"The specified note title contains invalid characters."`; collision → `"Cannot create note. A note with the same title already exists."`; missing → `"The specified note cannot be found."`; bad login → `"Invalid login details."`

---

## 4. Data model (Postgres)

```
users
  id            uuid pk
  name          text
  email         text unique not null
  password_hash text not null        -- argon2
  created_at    timestamptz default now()

notes
  id            uuid pk
  owner_id      uuid fk -> users.id
  title         text not null         -- identity, unique per owner; strip whitespace; reject < > : " / \ | ? *
  content       text default ''
  subject       text null             -- StudyMap: toan/ly/anh/hoa or custom tag id
  difficulty    text null             -- de/tb/kho
  search_vec    tsvector              -- generated/triggered: setweight(title,'A') || setweight(content,'B')
  created_at    timestamptz default now()
  updated_at    timestamptz default now()   -- 'lastModified' in API = epoch float of this
  unique(owner_id, title)

note_tags                              -- tags parsed from content #hashtags
  note_id  uuid fk -> notes.id
  tag      text                        -- lowercased
  primary key (note_id, tag)
```

**Tag extraction** (reproduce flatnotes exactly, app-side on save):
- Strip code blocks first (`` `{1,3}.*?`{1,3} `` DOTALL).
- Regex: `(?:(?<=^#)|(?<=\s#))[a-zA-Z0-9_-]+(?=\s|$)`.
- Lowercase + dedupe. Rewrite `note_tags` rows on every create/update.

**`lastModified`** stays a **Unix epoch float** in responses (back it with `updated_at`). flatnotes exposes no `created` field — we keep `created_at` in DB but the Note response only needs `{title, content, lastModified}`.

GIN index on `search_vec`; index on `(owner_id, updated_at)`.

---

## 5. Frontend port notes

- **Drop** the `x-dc` / `DCLogic` / `support.js` runtime. The prototype `class Component extends DCLogic` uses React's `setState` API — port `state`, `renderVals()`, and all SVG builders (`growthChart`, `heatmap`, `emptyIllus`, `ring`) **verbatim** into a real `React.Component` (or hooks). Rewrite the `<x-dc>` template (the `{{ }}` / `<sc-if>` / `<sc-for>` markup) as JSX.
- **Screens** (10): Login, Register*, Dashboard, Empty, Study, Editor, Quiz, Quiz Result, Review, Profile, Streak. (* = new.)
- **Responsive shell**: desktop left sidebar (logo, nav, streak chip, theme toggle); < 960px collapses to bottom tab bar + floating "+". Dashboard two-column on desktop. (Already in prototype.)
- **Notes wiring** (real API): Editor (create/update, explicit save + `Ctrl/Cmd+Enter`, draft to localStorage with resume-draft modal), Dashboard recent list (`search?term=*&sort=lastModified`), search box (submit on Enter → results, `#tag` autocomplete from `/api/tags`), tag chips → `tags:x` search.
- **Keyboard**: `/` search, `Ctrl+Alt+N` new note, `e` edit, `Ctrl/Cmd+Enter` save, `Esc` exit edit.
- **Seed/static** (no API yet): Quiz bank, streak heatmap, review schedule, leaderboard, profile — port the prototype's `const` data arrays as-is.
- **Markdown**: react-markdown + remark-gfm (tasks, code w/ highlight, tables). Wiki-links `[[Note]]` → note route. Defer WYSIWYG.

---

## 6. Scaffold / run

```
/
  docker-compose.yml      # postgres:16 + (optional) backend + frontend
  .env.example            # DB url, JWT secret, etc.
  backend/                # FastAPI, alembic, pyproject, Dockerfile
  frontend/               # Vite + React + TS, Dockerfile
  handoff.md
```

- `docker compose up` → Postgres on 5432, backend on 8000, frontend (Vite dev) on 5173.
- Backend reads `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY_DAYS=30`.
- Alembic migration creates tables + GIN index + `search_vec` trigger.
- **Verify**: register a user → create a note with `#toán` in body → `GET /api/tags` returns `toán` → `GET /api/search?term=#toán` returns it.

---

## 7. Open decisions — confirm before building

1. **Multi-user or single-user?** flatnotes is single-user (env creds). We're adding register + a `users` table → multi-user with per-owner notes. Confirm that's wanted (vs. register that just seeds one user).
2. **StudyMap dynamic screens**: keep Quiz/Streak/Review on **seed data** for this backbone, or wire any to the DB now? (Default: seed data.)
3. **Attachments/images**: flatnotes supports upload. Include `/api/attachments` + object storage now, or defer? (Default: defer.)
4. **Google sign-in button** (in login design): real OAuth or visual-only placeholder for backbone? (Default: visual-only.)

---

## 8. Reference

- Prototype + design system: `/home/n3m0/.claude/jobs/2838d9f2/tmp/design/note-taking-app-port/`
- Peeky tokens: `…/project/_ds/peeky-design-system-d3207557-…/tokens/*.css`
- flatnotes upstream: github.com/dullage/flatnotes (FastAPI + Vue + Whoosh)
- Context7 IDs: `/fastapi/fastapi`, `/benavlabs/fastapi-boilerplate` (async SQLAlchemy 2.0 + Postgres patterns)
