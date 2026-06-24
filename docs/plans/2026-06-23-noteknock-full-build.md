# Noteknock Full-Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Noteknock — a Vietnamese study/notes web app (StudyMap identity, Peeky design system) with a Notion-like block editor, FastAPI + Postgres backend, and StudyMap quiz/review/streak features.

**Architecture:** Monorepo (`/backend` FastAPI + `/frontend` Vite/React/TS) orchestrated by Docker Compose with Postgres 16. Backend: async SQLAlchemy 2.0, JWT/argon2 auth, Postgres FTS. Frontend: BlockNote editor (Notion-like, skinned to match the prototype), React Router, Peeky design tokens lifted verbatim. Notes store content as BlockNote JSON (`jsonb`) with a derived plain-text column for full-text search.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, asyncpg, Alembic, argon2-cffi, python-jose, Pydantic v2; React 18, TypeScript, Vite, React Router, BlockNote (`@blocknote/react` + `@blocknote/mantine`), Lucide; Postgres 16 (JSONB, tsvector, GIN); Docker Compose, ruff, eslint+prettier.

---

## Mockup Fidelity Contract (READ FIRST)

**Source of truth:** `design/project/StudyMap.dc.html` — the Peeky-themed prototype. The frontend **must match this mockup visually and structurally**, not generic Notion.

- **Ignore** `design/project/uploads/StudyMap Editor.html` — stale teal/Geist draft. The real editor lives inside `.dc.html` (`isEditor` block, lines 317-347).
- **Tokens:** lift the `:root` + `[data-theme="dark"]` blocks from `.dc.html` `<helmet>` (lines 14-44) verbatim into `frontend/src/styles/tokens.css`. Do **not** invent colors. Fraunces (display) + Inter (body) + ui-monospace (mono), loaded via the existing Google Fonts `@import`.
- **BlockNote is skinned**, not used with default styling. Override `.bn-editor`, `.bn-suggestion-menu-item`, `.bn-formatting-toolbar`, etc. so the editor body looks like the prototype's `.sm-ce` contenteditable (font-size 1.0625rem, line-height 1.78, caret-color var(--accent), `.sm-ce:empty::before` placeholder behavior).
- **Editor meta row** (lines 323-331, 912-928): subject pills (borderRadius 99, selected = subject-color fill + white text/dot, unselected = paper bg + border + muted text + colored dot) + "+ Thẻ mới" tag input + divider + difficulty chips (de→accent/coral, tb→amber, kho→rose). This is the "page properties" bar above the BlockNote editor.
- **App shell** (lines 116-167): desktop = left sidebar (brand "StudyMap" with coral "S" tile + coral-glow, nav buttons, "Bài học mới" CTA, streak chip with pulsing flame, theme toggle) + main (topbar with back button + Fraunces title + mobile theme toggle). Mobile (<960px) = bottom tab bar + floating "+" FAB. Port `renderVals()` shell styles verbatim.
- **Screens** (11): Login, Register (new, mirrors login split-screen), Dashboard, Empty, Study, Editor, Quiz, QuizResult, Review, Profile, Streak. Port each `.dc.html` `isX` block.
- **Animations:** `sm-rise`, `sm-fade`, `sm-breathe` (pulse), `sm-pop`, `sm-halo` keyframes (lines 62-69) — port verbatim. Respect `prefers-reduced-motion`.

---

## Data Model (final — supersedes handoff.md §4 where noted)

```sql
users
  id            uuid pk default gen_random_uuid()
  name          text
  email         text unique not null
  password_hash text not null           -- argon2
  created_at    timestamptz default now()

notes
  id            uuid pk default gen_random_uuid()
  owner_id      uuid fk -> users.id on delete cascade
  title         text not null            -- strip whitespace; reject < > : " / \ | ? *
  content       jsonb default '[]'::jsonb   -- BlockNote block array (CHANGED from text)
  content_text  text default ''             -- NEW: plain text extracted from blocks, for FTS
  subject       text null                   -- page property: toan|ly|anh|hoa|<custom tag id>
  difficulty    text null                   -- page property: de|tb|kho
  search_vec    tsvector                    -- generated: setweight(title,'A') || setweight(content_text,'B')
  created_at    timestamptz default now()
  updated_at    timestamptz default now()
  unique(owner_id, title)
-- GIN index on search_vec; index on (owner_id, updated_at desc)

note_tags
  note_id  uuid fk -> notes.id on delete cascade
  tag      text                          -- lowercased hashtag
  primary key (note_id, tag)

-- Phase 3
quizzes
  id            uuid pk default gen_random_uuid()
  note_id       uuid fk -> notes.id on delete cascade
  owner_id      uuid fk -> users.id
  created_at    timestamptz default now()
  unique(note_id)                         -- regen replaces prior

quiz_questions
  id            uuid pk default gen_random_uuid()
  quiz_id       uuid fk -> quizzes.id on delete cascade
  position      int not null
  prompt        text not null
  options       jsonb not null            -- string[4]
  correct_index int not null              -- 0-3
  explanation   text null

quiz_attempts                            -- NEW: persists quiz answers so streak/review can use them
  id            uuid pk default gen_random_uuid()
  quiz_id       uuid fk -> quizzes.id on delete cascade
  owner_id      uuid fk -> users.id on delete cascade
  score         int not null              -- correct count
  total         int not null              -- question count
  answers       jsonb not null            -- [{questionId, choice, correct}]
  taken_at      timestamptz default now()

review_events                            -- NEW: persists spaced-repetition reviews so Review/Streak are DB-backed
  id            uuid pk default gen_random_uuid()
  note_id       uuid fk -> notes.id on delete cascade
  owner_id      uuid fk -> users.id on delete cascade
  strength      int not null default 1    -- 0-3 (drives the 3-bar indicator in Review)
  reviewed_at   timestamptz default now()
-- index on (owner_id, reviewed_at) for streak/activity; index on (owner_id, note_id, reviewed_at desc) for due review

-- Phase 4
attachments
  id            uuid pk default gen_random_uuid()
  owner_id      uuid fk -> users.id on delete cascade    -- user-scoped (note_id nullable so unsaved /app/new drafts can upload)
  note_id       uuid fk -> notes.id on delete set null   -- nullable; associated on note save, or orphaned if note deleted
  key           text not null             -- S3/MinIO object key
  url           text not null
  created_at    timestamptz default now()
```

**`search_vec` trigger:** generated column or trigger refreshing `setweight(to_tsvector('simple', title), 'A') || setweight(to_tsvector('simple', coalesce(content_text,'')), 'B')` on insert/update of title/content_text.

**BlockNote JSON → plain text:** backend service walks the block array, concatenates all inline `text` fields from every block's `content` (skipping `type: "code"` blocks to match the "strip code blocks first" rule). Stored in `content_text` on every save.

**Tag extraction:** same plain-text walk → regex `(?:(?<=^#)|(?<=\s#))[\w-]+(?=\s|$)` with `re.UNICODE` (Python `str` `\w` matches Vietnamese diacritics, so `#toán`/`#lý` work — **deviation from flatnotes' ASCII-only `[a-zA-Z0-9_-]+`**, required because the app is Vietnamese-first) → lowercase + dedupe → rewrite `note_tags` rows.

---

## API Surface (camelCase JSON via Pydantic alias_generator; `Token` stays snake_case)

| Method | Path | Auth | Body | Response | Phase |
|---|---|---|---|---|---|
| POST | `/api/register` | no | `{name, email, password}` | `Token`; 409 email taken | 1 |
| POST | `/api/token` | no | `{username, password}` (form) | `Token`; 401 | 1 |
| GET | `/api/auth-check` | yes | — | `"OK"`; 401 | 1 |
| GET | `/api/me` | yes | — | `{id, name, email}`; 401 | 1 |
| GET | `/api/config` | no | — | `{authType:"password"}` | 1 |
| GET | `/health` | no | — | `"OK"` | 1 |
| GET | `/api/notes/{title}` | yes | — | `Note`; 400, 404 | 2 |
| POST | `/api/notes` | yes | `{title, content?, subject?, difficulty?}` | `Note`; 400, 409 | 2 |
| PATCH | `/api/notes/{title}` | yes | `{newTitle?, newContent?, subject?, difficulty?}` | `Note`; 400, 409, 404 | 2 |
| DELETE | `/api/notes/{title}` | yes | — | `null`; 400, 404 | 2 |
| GET | `/api/search?term=&sort=&order=&limit=` | yes | — | `SearchResult[]` | 2 |
| GET | `/api/tags` | yes | — | `string[]` | 2 |
| POST | `/api/notes/{title}/quiz` | yes | — | `Quiz`; 404, 502 | 3 |
| GET | `/api/notes/{title}/quiz` | yes | — | `Quiz`; 404 | 3 |
| POST | `/api/quizzes/{id}/attempts` | yes | `{answers:[{questionId, choice}]}` | `{id, score, total, answers}`; 404 | 3 |
| POST | `/api/notes/{title}/review` | yes | `{strength}` | `{id, noteId, strength, reviewedAt}`; 404 | 3 |
| GET | `/api/review/due` | yes | — | `[{noteId, title, subject, strength, lastReviewed}]` | 3 |
| GET | `/api/activity?from=&to=` | yes | — | `[{date, notesCreated, quizzesTaken, reviewsDone}]` | 3 |
| GET | `/api/streak` | yes | — | `{current, longest, total, heatmap:[{date,count}]}` | 3 |
| POST | `/api/attachments` | yes | multipart (optional `noteId`) | `{url}` | 4 |

**`Note` response:** `{title, content (BlockNote JSON array), subject, difficulty, lastModified (epoch float of updated_at), tags (string[])}`.

**`SearchResult`:** `{title, lastModified, titleHighlights, contentHighlights, tagMatches}`.

**Error strings (parity):** invalid title → `"The specified note title contains invalid characters."`; collision → `"Cannot create note. A note with the same title already exists."`; missing → `"The specified note cannot be found."`; bad login → `"Invalid login details."`; email taken → `"An account with this email already exists."`.

---

# Phase 1 — Auth foundation

## Task P1.1: Monorepo scaffold + Docker Compose

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `.gitignore`
- Create: `backend/pyproject.toml`, `backend/Dockerfile`, `backend/app/__init__.py`
- Create: `frontend/package.json`, `frontend/Dockerfile`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/vite.config.ts`, `frontend/tsconfig.json`

**Step 1:** Create `docker-compose.yml` with three services: `postgres:16` (volume, healthcheck), `backend` (build `./backend`, env from `.env`, port 8000, depends_on postgres healthy), `frontend` (build `./frontend`, Vite dev on 5173). Postgres uses `POSTGRES_USER=noteknock`, `POSTGRES_PASSWORD=noteknock`, `POSTGRES_DB=noteknock`.

**Step 2:** `.env.example` documents `DATABASE_URL=postgresql+asyncpg://noteknock:noteknock@postgres:5432/noteknock`, `JWT_SECRET=<change-me>`, `JWT_EXPIRY_DAYS=30`. Note: `JWT_SECRET` has no default — backend refuses to start without it.

**Step 3:** Backend `pyproject.toml` with deps: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `argon2-cffi`, `python-jose[cryptography]`, `pydantic`, `pydantic-settings`, `python-multipart` (form login). Dev: `ruff`, `pytest`, `pytest-asyncio`, `httpx`. Python 3.12.

**Step 4:** Frontend `package.json` with deps: `react`, `react-dom`, `react-router-dom`, `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine`, `lucide-react`. Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `eslint`, `prettier`. `Dockerfile` runs `npm install && npm run dev -- --host`.

**Step 5:** Verify — `docker compose up postgres -d` starts Postgres, `docker compose down` tears down. Commit: `Scaffold monorepo with Docker Compose`.

## Task P1.2: Backend config + DB session + base

**Files:**
- Create: `backend/app/config.py`, `backend/app/db/session.py`, `backend/app/db/base.py`

**Step 1: Write `config.py`** with `pydantic-settings` `Settings(BaseSettings)` reading `DATABASE_URL`, `JWT_SECRET` (no default — raises if missing), `JWT_EXPIRY_DAYS=30`. Export `settings` singleton.

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str
    jwt_secret: str           # no default — refuse to start without it
    jwt_expiry_days: int = 30
    jwt_algorithm: str = "HS256"

settings = Settings()
```

**Step 2: Write `db/session.py`** — async engine + `async_sessionmaker` + `get_db` dependency.

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
```

**Step 3: Write `db/base.py`** — `DeclarativeBase` with camelCase naming convention for auto-constraint naming.

**Step 4:** Verify backend container imports without error (`docker compose run --rm backend python -c "from app.config import settings; from app.db.session import engine"`). Commit: `Add backend config and DB session`.

## Task P1.3: User model + Alembic migration

**Files:**
- Create: `backend/app/models/__init__.py`, `backend/app/models/user.py`
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/0001_create_users.py`

**Step 1: Write the test** `backend/tests/test_models_user.py`:
```python
import pytest
from app.models.user import User

def test_user_creates_with_required_fields():
    u = User(name="Hà", email="ha@test.com", password_hash="$argon2id$...")
    assert u.email == "ha@test.com"
    assert u.id is None  # set by DB
```

**Step 2:** Run `pytest` → fails (module not found).

**Step 3: Write `models/user.py`:**
```python
import uuid
from datetime import datetime
from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
```

**Step 4:** Run test → passes.

**Step 5: Init Alembic** (`alembic init alembic`), configure `env.py` to use `settings.database_url` + `Base.metadata`, run `alembic revision --autogenerate -m "create users table"`. Inspect generated migration, verify `gen_random_uuid()` + unique email index.

**Step 6:** Run `alembic upgrade head` inside the backend container against the Postgres service → `users` table exists. Verify: `docker compose exec postgres psql -U noteknock -c "\d users"`. Commit: `Add users model and Alembic migration`.

## Task P1.4: Security — argon2 + JWT

**Files:**
- Create: `backend/app/core/security.py`, `backend/app/core/deps.py`
- Test: `backend/tests/test_security.py`

**Step 1: Write failing tests:**
```python
import pytest
from app.core.security import hash_password, verify_password, create_token, decode_token

def test_hash_and_verify_password():
    h = hash_password("secret123")
    assert h != "secret123"
    assert verify_password("secret123", h) is True
    assert verify_password("wrong", h) is False

def test_create_and_decode_token():
    token = create_token(sub="user-uuid-here")
    payload = decode_token(token)
    assert payload["sub"] == "user-uuid-here"
    assert "exp" in payload

def test_decode_invalid_token_raises():
    from jose import JWTError
    with pytest.raises(JWTError):
        decode_token("not-a-jwt")
```

**Step 2:** Run → fails.

**Step 3: Write `security.py`:**
```python
from argon2 import PasswordHasher
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from app.config import settings

_ph = PasswordHasher()

def hash_password(pw: str) -> str: return _ph.hash(pw)
def verify_password(pw: str, h: str) -> bool:
    try: return _ph.verify(h, pw)
    except Exception: return False

def create_token(sub: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiry_days)
    return jwt.encode({"sub": sub, "exp": exp}, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try: return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError: raise
```

**Step 4:** Run → passes. Commit: `Add argon2 password hashing and JWT helpers`.

## Task P1.5: Pydantic schemas (camelCase)

**Files:**
- Create: `backend/app/schemas/__init__.py`, `backend/app/schemas/auth.py`

**Step 1:** `auth.py` defines `UserCreate {name, email, password}`, `Token {access_token: str, token_type: str = "bearer"}` (snake_case, OAuth2 parity), and a `CamelModel(BaseModel)` base with `alias_generator=to_camel, populate_by_name=True` for all other schemas. Add validators: email regex, password ≥ 8 chars.

```python
import re
from pydantic import BaseModel, field_validator, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class UserCreate(CamelModel):
    name: str
    email: str
    password: str
    @field_validator("email")
    def valid_email(v): ...  # regex check
    @field_validator("password")
    def min_len(v): ...  # >= 8

class Token(BaseModel):  # snake_case, OAuth2 parity
    access_token: str
    token_type: str = "bearer"
```

**Step 2:** Test that `UserCreate.model_validate({"name":"Hà","email":"ha@test.com","password":"secret123"})` works and rejects bad email/short pw. Commit: `Add auth Pydantic schemas with camelCase aliases`.

## Task P1.6: Auth API routes

**Files:**
- Create: `backend/app/api/__init__.py`, `backend/app/api/auth.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_api_auth.py`

**Step 1: Write test infrastructure (`conftest.py`)** before any API tests. Sets up an async test DB session with per-test transaction rollback (no cross-test pollution, no separate DB to spin up):
```python
import pytest, pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.base import Base
from app.main import app
from app.config import settings
import os

TEST_DB_URL = os.getenv("TEST_DATABASE_URL", settings.database_url + "_test")

@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()

@pytest_asyncio.fixture
async def db(engine):
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest_asyncio.fixture
async def client(engine):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
```
Use a `noteknock_test` database (create via `docker compose exec postgres createdb -U noteknock noteknock_test` once). `TEST_DATABASE_URL` env overrides. Tables recreate per test (fast for this schema size).

**Step 2: Write failing tests** using `httpx.AsyncClient` + `ASGITransport` against the FastAPI app:
```python
@pytest.mark.asyncio
async def test_health(client): ...
@pytest.mark.asyncio
async def test_register_then_token_then_authcheck_then_me(client): ...  # full flow incl. GET /api/me returns {id,name,email}
@pytest.mark.asyncio
async def test_register_duplicate_email_409(client): ...
@pytest.mark.asyncio
async def test_token_bad_creds_401(client): ...
@pytest.mark.asyncio
async def test_auth_check_no_token_401(client): ...
@pytest.mark.asyncio
async def test_me_no_token_401(client): ...
```
Register happy path: POST `/api/register` → 200 `Token`; POST `/api/token` with form → 200 `Token`; GET `/api/auth-check` with Bearer → 200 `"OK"`; GET `/api/me` with Bearer → 200 `{id, name, email}`.

**Step 2:** Run → fails.

**Step 3: Write `api/auth.py`** with a router:
- `POST /api/register` — hash password, insert user (catch unique violation → 409 `"An account with this email already exists."`), return `Token`.
- `POST /api/token` — `OAuth2PasswordRequestForm` (username=email), verify, return `Token`; 401 `"Invalid login details."`.
- `GET /api/auth-check` — requires `get_current_user` dep, returns `"OK"`.
- `GET /api/me` — requires `get_current_user` dep, returns `{id, name, email}` (camelCase via `CamelModel`) so the frontend can populate `AuthContext.user` and the Dashboard greeting.
- `GET /api/config` — returns `{"authType": "password"}`.

`deps.py` `get_current_user`: extract Bearer token from `Authorization` header (or `token` cookie, header wins), decode JWT, fetch user by `sub` UUID, 401 on any failure.

**Step 4: Write `main.py`** — create `FastAPI(title="Noteknock")`, add CORS (allow frontend origin), include `auth.router` under `/api` prefix, add `/health` route returning `"OK"`.

**Step 5:** Run tests → pass. Commit: `Add auth API routes and FastAPI app`.

## Task P1.7: Frontend scaffold + tokens

**Files:**
- Create: `frontend/src/styles/tokens.css`, `frontend/src/styles/global.css`
- Create: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`

**Step 1:** Lift the `:root` + `[data-theme="dark"]` blocks + keyframes from `.dc.html` `<helmet>` (lines 14-69) into `tokens.css` verbatim. Add the Fraunces+Inter `@import` at the top.

**Step 2:** `global.css` — base reset, `body { font-family: var(--body); background: var(--canvas); color: var(--ink); }`, scrollbar styles (`.sm-scroll`), `.ic` + `.sm-ce` utility classes ported from the prototype.

**Step 3:** `App.tsx` with React Router: routes `/`, `/login`, `/register`, `/app/*`. Empty placeholders for now. Theme toggle hook (`useTheme`) reading/writing `localStorage` + setting `data-theme` on `document.documentElement`.

**Step 4:** Verify — `docker compose up frontend` serves the app, tokens render (cream bg, plum text). Commit: `Add frontend scaffold with Peeky design tokens`.

## Task P1.8: Auth client + AuthContext

**Files:**
- Create: `frontend/src/api/client.ts`, `frontend/src/api/auth.ts`
- Create: `frontend/src/auth/AuthContext.tsx`, `frontend/src/auth/ProtectedRoute.tsx`

**Step 1:** `client.ts` — `fetch` wrapper: attaches `Authorization: Bearer <token>` from `localStorage`, parses JSON, throws on non-2xx with the server's error string. `auth.ts` — `register({name,email,password})`, `login(email,password)`, `authCheck()`, `getMe()` (GET `/api/me` → `{id, name, email}`).

**Step 2:** `AuthContext` — stores token in `localStorage`, exposes `{user, token, login, register, logout}`, on mount calls `authCheck` then `getMe` to populate `user` (so Dashboard can render the greeting "Chào buổi tối, {name}"). `ProtectedRoute` — redirects to `/login` if no valid token.

**Step 3:** Verify with a manual smoke test against running backend. Commit: `Add auth API client and AuthContext`.

## Task P1.9: Login screen (match mockup)

**Files:**
- Create: `frontend/src/pages/Login.tsx`

**Step 1:** Port the `.dc.html` `isLogin` block (lines 75-114) to JSX. Split-screen: left = coral-gradient art panel (`loginArtStyle` — port the gradient + Fraunces eyebrow "Sổ tay học tập" + headline "Học chậm lại, nhớ lâu hơn." + sub-copy); right = cream form (brand row with coral "S" tile + "StudyMap" wordmark, "Đăng nhập để tiếp tục ôn tập.", email label+input, password label+input with show/hide eye, "Đăng nhập" coral CTA with coral-glow, divider "hoặc", Google button placeholder, "Chưa có tài khoản? Đăng ký" link). Theme toggle button top-right of form.

**Step 2:** Wire to `AuthContext.login` — on success redirect to `/app`. Show rose error state on failure (reuse prototype `inputStyle(err)` pattern: border `var(--rose)`, error text `var(--rose)`). Client validation: email regex, password ≥ 8 (mirrors `loginSubmit()`).

**Step 3:** Verify visually against `.dc.html` login — coral panel, cream form, Fraunces headline, coral CTA glow. Commit: `Add login screen matching mockup`.

## Task P1.10: Register screen (match mockup, new)

**Files:**
- Create: `frontend/src/pages/Register.tsx`

**Step 1:** Mirror login's split-screen. Same coral art panel, headline "Bắt đầu sổ tay của bạn." Form: name, email, password, confirm password. CTA "Đăng ký". Validation: email regex, pw ≥ 8, confirm matches. Coral focus rings, rose error state. Link back to login.

**Step 2:** Wire to `AuthContext.register` → redirect `/app`. Commit: `Add register screen matching mockup`.

## Task P1.11: Landing + /app placeholder

**Files:**
- Create: `frontend/src/pages/Landing.tsx`, `frontend/src/pages/AppPlaceholder.tsx`

**Step 1:** Landing — coral-gradient hero (Fraunces "Học chậm lại, nhớ lâu hơn." + sub-copy from login art panel), 3 feature blurbs (notes/quiz/streak with prototype's `notes`/`quiz`/`flame` icons), theme toggle, footer, CTAs → `/register` and `/login`.

**Step 2:** `/app` placeholder — minimal "Đã đăng nhập" + logout button (confirms auth flow works). Full dashboard is Phase 2.

**Step 3:** Verify full Phase 1 flow (see Verification below). Commit: `Add landing page and app placeholder`.

## Phase 1 Verification

`docker compose up` → Postgres + backend + frontend running. Then:
1. `GET /health` → `"OK"`.
2. Register via UI → lands on `/app` placeholder (auto-login).
3. Re-register same email → 409, rose error shown.
4. Logout, login same creds → `/app`.
5. Login wrong password → `"Invalid login details."`, rose error.
6. Hit `/app` incognito → redirect to `/login`.
7. Backend tests pass: `docker compose run --rm backend pytest -v`.

---

# Phase 2 — Notes + Notion-like editor + search

## Task P2.1: Note + NoteTag models + migration

**Files:**
- Create: `backend/app/models/note.py`
- Create: `backend/alembic/versions/0002_create_notes_tags.py`
- Test: `backend/tests/test_models_note.py`

**Step 1: Write failing test** for `Note` + `NoteTag` construction.

**Step 2: Write `models/note.py`:** `Note` (id, owner_id FK, title, content JSONB default '[]', content_text default '', subject, difficulty, search_vec tsvector, created_at, updated_at, unique(owner_id,title)) and `NoteTag` (note_id FK cascade, tag, PK(note_id,tag)).

**Step 3: Migration** — create tables, GIN index on `search_vec`, index `(owner_id, updated_at desc)`, and a trigger function `refresh_search_vec()` that sets `search_vec = setweight(to_tsvector('simple', title), 'A') || setweight(to_tsvector('simple', coalesce(content_text,'')), 'B')` + `CREATE TRIGGER ... BEFORE INSERT OR UPDATE OF title, content_text ON notes`.

**Step 4:** Run `alembic upgrade head`, verify tables + trigger exist. Commit: `Add notes and note_tags models with FTS trigger`.

## Task P2.2: BlockNote JSON → plain text + tag extraction services

**Files:**
- Create: `backend/app/services/content.py`, `backend/app/services/tags.py`
- Test: `backend/tests/test_services.py`

**Step 1: Write failing tests:**
```python
BLOCKS = [
  {"type":"paragraph","content":[{"type":"text","text":"Tích phân #toán từng phần","styles":{}}]},
  {"type":"code","content":[{"type":"text","text":"#notatag inside code"}]},
  {"type":"paragraph","content":[{"type":"text","text":"ILATE #lý helps","styles":{}}]},
]
def test_blocks_to_text_skips_code():
    assert blocks_to_text(BLOCKS) == "Tích phân #toán từng phần ILATE #lý helps"
def test_extract_tags_unicode():
    assert extract_tags(BLOCKS) == ["toán", "lý"]
def test_empty_blocks():
    assert blocks_to_text([]) == ""
    assert extract_tags([]) == []
```

**Step 2: Write `content.py`** `blocks_to_text(blocks: list) -> str` — recursively walk blocks, skip `type=="code"`, collect `text` from every `content[].text`.

**Step 3: Write `tags.py`** `extract_tags(blocks: list) -> list[str]` — `blocks_to_text` → regex `(?:(?<=^#)|(?<=\s#))[\w-]+(?=\s|$)` with `re.UNICODE` (str `\w` covers Vietnamese diacritics; deviates from flatnotes' ASCII-only pattern) → lowercase + dedupe (preserve order).

**Step 4:** Run → passes. Commit: `Add BlockNote content text extraction and tag parsing services`.

## Task P2.3: Note schemas

**Files:**
- Create: `backend/app/schemas/note.py`

`NoteCreate(CamelModel) {title, content?: list = [], subject?: str, difficulty?: str}` with title validator (reject `< > : " / \ | ? *`, strip whitespace). `NoteUpdate(CamelModel) {newTitle?: str, newContent?: list, subject?: str, difficulty?: str}`. `NoteOut(CamelModel) {title, content: list, subject, difficulty, lastModified: float, tags: list[str]}` — `lastModified` = `updated_at.timestamp()`. `SearchResult(CamelModel) {title, lastModified: float, titleHighlights: str|None, contentHighlights: str|None, tagMatches: list[str]|None}`. Commit: `Add note Pydantic schemas`.

## Task P2.4: Notes CRUD API

**Files:**
- Create: `backend/app/api/notes.py`
- Test: `backend/tests/test_api_notes.py`

**Step 1: Write failing tests** (full CRUD flow with an authenticated test client):
- create note → 200 `NoteOut` with content/subject/difficulty
- create duplicate title → 409
- create invalid title → 400
- get note → 200; get missing → 404
- patch note (newTitle, newContent, subject, difficulty) → 200; patch missing → 404; patch to colliding title → 409
- delete note → 200 `null`; delete missing → 404
- after create with `#toan` in content, `GET /api/tags` returns `["toan"]`
- note `lastModified` is a float epoch
- `search_vec` populated (query via raw SQL in test)

**Step 2: Write `api/notes.py`** router:
- `POST /api/notes` — validate, check unique(owner,title), `blocks_to_text` → `content_text`, `extract_tags` → rewrite `note_tags`, insert, return `NoteOut`.
- `GET /api/notes/{title}` — fetch by owner+title, 404 if missing.
- `PATCH /api/notes/{title}` — fetch (404), apply newTitle/newContent/subject/difficulty, re-extract text+tags, check collision on rename, update `updated_at`, return `NoteOut`.
- `DELETE /api/notes/{title}` — fetch (404), delete (cascade drops tags), return `null`.
- `GET /api/tags` — distinct lowercased tags for owner.

**Step 3:** Register router in `main.py`. Run tests → pass. Commit: `Add notes CRUD API`.

## Task P2.5: Search API (Postgres FTS)

**Files:**
- Create: `backend/app/services/search.py`
- Modify: `backend/app/api/notes.py` (add `/api/search`)
- Test: `backend/tests/test_api_search.py`

**Step 1: Write failing tests:**
- `term=*` returns all notes sorted by `lastModified desc`
- `term=#toán` rewrites to tag filter, returns only notes with that tag (Unicode tag)
- `term=tích` returns notes with matches in title/content, with `titleHighlights`/`contentHighlights` (HTML from `ts_headline`)
- `sort=title` sorts alphabetically; `order=asc`/`desc`
- `limit=N` caps results
- quoted `"phrase"` searches title+content only (no tag)
- `tagMatches` populated when search hits a tag
- **malformed/safe-input tests (must not raise):** `term="!!! & | ( )"` (bare operators/punctuation) returns empty or score-sorted, no 500; `term=""` (empty) returns all or empty without error; `term="a OR"` (trailing operator) does not raise; `term="tích - phương"` (diacritics + NOT) parses via `websearch_to_tsquery`; `term="()()"` (parens) returns empty without error.

**Step 2: Write `search.py`** `parse_search(term: str) -> (tsquery_str, tag_filter: str|None)`:
- `term="*"` → match-all (no tsquery, just sort)
- `#tag` at start → tag filter, rest is query
- quoted `"phrase"` → `phraseto_tsquery('simple', phrase)` (safe, no syntax errors)
- operators `title:`/`content:`/`tags:`, `AND`/`OR`/`NOT` → translate to `websearch_to_tsquery('simple', ...)` which supports quoted phrases, `OR`, and `-` for NOT and **never raises syntax errors** on raw user input (per PostgreSQL docs — `to_tsquery` raises on malformed input, `websearch_to_tsquery` does not)
- **never** feed arbitrary user text to `to_tsquery` directly; use `websearch_to_tsquery` for the free-text portion and `plainto_tsquery` as a fallback when `websearch_to_tsquery` yields an empty query
- build `ts_rank(search_vec, query)` + `ts_headline` for both title (weight A) and content (weight B)

**Step 3:** `GET /api/search?term=&sort=&order=&limit=` in `notes.py` — call `parse_search`, run the FTS query, return `SearchResult[]`. Default sort `score` desc.

**Step 4:** Run → pass. Commit: `Add full-text search API`.

## Task P2.6: Frontend notes API client

**Files:**
- Create: `frontend/src/api/notes.ts`

Functions: `getNote(title)`, `createNote({title,content,subject,difficulty})`, `updateNote(title,{newTitle,newContent,subject,difficulty})`, `deleteNote(title)`, `search({term,sort,order,limit})`, `getTags()`. All via `client.ts`. Commit: `Add notes API client`.

## Task P2.7: BlockNote editor — schema + theming

**Files:**
- Create: `frontend/src/components/editor/Editor.tsx`
- Create: `frontend/src/components/editor/schema.ts`
- Create: `frontend/src/components/editor/theme.css`
- Create: `frontend/src/components/editor/slashMenu.ts`

**Step 1: `theme.css`** — override BlockNote's `.bn-*` classes to match the prototype's `.sm-ce`:
```css
.bn-editor { font-size: 1.0625rem; line-height: 1.78; color: var(--ink); caret-color: var(--accent); }
.bn-editor:empty::before { content: attr(data-ph); color: var(--faint); }
.bn-editor p { margin: 0 0 1.05em; }
.bn-editor b { font-weight: 600; }
.bn-suggestion-menu { background: var(--paper); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-lift); }
.bn-suggestion-menu-item { border-radius: 10px; }
.bn-suggestion-menu-item:hover, .bn-suggestion-menu-item[aria-selected] { background: var(--accent-tint); }
.bn-formatting-toolbar { background: var(--paper); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-lift); }
/* drag handle + block side menu styled coral on hover */
```

**Step 2: `schema.ts`** — define a custom `formula` block via `createReactBlockSpec` matching the prototype's formula style (mono font, `var(--accent)` color, `var(--accent-tint)` bg, 12px radius, `contenteditable=false`, `content: "none"`). Register **only block specs** in the schema (per BlockNote docs, `BlockNoteSchema.create` does not take slash items): `BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs, formula } })`. Export the `formula` slash menu item (`insertFormulaItem`) from `slashMenu.ts` for the Editor to compose.

**Step 3: `Editor.tsx`** — `useCreateBlockNote({ schema, initialContent })`, `useEditorChange` for autosave hook integration. Customize the slash menu via the documented pattern: pass `slashMenu={false}` to `BlockNoteView` and add a child `<SuggestionMenuController triggerCharacter="/" getItems={async (query) => filterSuggestionItems([insertFormulaItem(editor), ...getDefaultReactSlashMenuItems(editor)], query)} />`. `BlockNoteView` with `theme={{ light, dark }}` driven by current Peeky theme. Pass `data-ph="Bắt đầu viết bài học của bạn…"`.

**Step 4: `slashMenu.ts`** — export `insertFormulaItem(editor)` (a `SuggestionMenu_ITEM` that inserts the custom `formula` block). This is consumed by `Editor.tsx`'s `getItems` above, **not** by `BlockNoteSchema.create`.

**Step 5:** Verify — render editor standalone, type `/`, see slash menu styled in Peeky, formula block renders with coral tint. Commit: `Add BlockNote editor with Peeky theming and formula block`.

## Task P2.8: Editor page (match mockup)

**Files:**
- Create: `frontend/src/pages/EditorPage.tsx`
- Create: `frontend/src/components/PageProperties.tsx`
- Create: `frontend/src/hooks/useAutosave.ts`

**Step 1: `PageProperties.tsx`** — port the prototype meta row (lines 323-331, 912-928) exactly:
- Subject pills: `SUBJECTS = {toan:{label:"Toán",color:"#B5654A"}, ly:{label:"Lý",color:"#B08A3E"}, anh:{label:"Tiếng Anh",color:"#5A7398"}, hoa:{label:"Hóa",color:"#8A5F77"}}` + custom tags. Selected = `background: subjectColor, color: #fff, dot: #fff`; unselected = `background: var(--paper), border: 1px solid var(--border), color: var(--muted), dot: subjectColor`. borderRadius 99, height 38, padding 0 14.
- "+ Thẻ mới" input (pill style, adds custom tag with palette-cycled color).
- Divider (1px, var(--border), height 24).
- Difficulty chips: `de→{color:var(--accent),bg:var(--accent-soft)}`, `tb→{color:var(--amber),bg:var(--amber-soft)}`, `kho→{color:var(--rose),bg:var(--rose-soft)}`. Selected = fill+tint; unselected = transparent+muted. borderRadius 99, height 38.

**Step 2: `useAutosave.ts`** — debounced (900ms) save to API + localStorage draft. Exposes `{saveText, saving, forceSave}`. `Ctrl/Cmd+Enter` → `forceSave()`. On mount, check localStorage for a draft of this title → show "resume draft?" modal.

**Step 3: `EditorPage.tsx`** — layout matching `.dc.html` `isEditor` (lines 317-347):
- Title input: Fraunces, 1.7rem, weight 600, letter-spacing -.02em, borderless, placeholder "Tiêu đề bài học". Autosave indicator to the right (`icSave` + "Đã lưu"/"Đang lưu…").
- `PageProperties` bar below title.
- `Editor` (BlockNote) below, max-width 760px centered.
- Bottom toolbar (B, I, image, reset, word count) — port lines 339-345. B/I delegate to BlockNote formatting; image inserts image block (Phase 4 wires upload); reset clears content.
- Back button in topbar → Dashboard.

**Step 4:** Wire create vs edit mode: `/app/new` (empty editor, POST on first save) vs `/app/notes/:title` (load via `getNote`, PATCH on save). Handle 409 (title exists) with rose error.

**Step 5:** Verify visually against `.dc.html` editor — Fraunces title, coral subject pills, difficulty chips, BlockNote body with placeholder + slash menu. Commit: `Add editor page matching mockup with BlockNote and page properties`.

## Task P2.9: Dashboard (match mockup)

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`

**Step 1:** Port `.dc.html` `isDashboard` (lines 170-280+): greeting header "Chào buổi tối, {name}" + "Bạn còn {n} bài cần ôn hôm nay" + avatar circle. "Tiếp tục học" card (accent-tint bg, Fraunces title, progress bar). Two-column grid on desktop (`dashGridStyle`): left = recent notes list (`search?term=*&sort=lastModified` → note rows with title + lastModified + subject chip), right = streak summary / today's review (static this phase). Empty state (`isEmpty` block) when no notes.

**Step 2:** Search box in dashboard header — Enter submits → `search({term})` → results list with `titleHighlights`/`contentHighlights` rendered. `/` focuses search. Tag chips → `tags:x` search. `#` autocomplete from `getTags()`.

**Step 3:** Commit: `Add dashboard matching mockup with notes list and search`.

## Task P2.10: Study (view note) screen

**Files:**
- Create: `frontend/src/pages/Study.tsx`

Port `isStudy` block — read-only rendered note (BlockNote content → HTML via `editor.blocksToFullHTML` or a read-only `BlockNoteView` with `editable={false}`), subject/difficulty chips, "Chỉnh sửa" button → Editor, "Bắt đầu Quiz" button → Quiz (Phase 3 wires it). Commit: `Add study (view note) screen`.

## Phase 2 Verification

1. Login → Dashboard shows empty state.
2. Click "Bài học mới" → editor, type title + content with `#toán`, select Toán/Dễ → save → redirects to Study view.
3. Dashboard recent list shows the note.
4. Search "tích" → note appears with highlights.
5. Click `#toán` chip → filtered to that tag.
6. `GET /api/tags` → `["toán"]`.
7. Edit note, change title → 409 if collision, else updates.
8. Delete note → 404 if gone.
9. Draft: type without saving, reload → resume draft modal.
10. Backend tests pass.

---

# Phase 3 — StudyMap screens (quiz/review/streak)

## Task P3.1: Quiz + QuizQuestion models + migration

**Files:**
- Create: `backend/app/models/quiz.py`
- Create: `backend/alembic/versions/0003_create_quizzes.py`
- Test: `backend/tests/test_models_quiz.py`

`Quiz` (id, note_id FK cascade unique, owner_id, created_at) + `QuizQuestion` (id, quiz_id FK cascade, position, prompt, options jsonb, correct_index, explanation) + `QuizAttempt` (id, quiz_id FK cascade, owner_id, score, total, answers jsonb, taken_at) + `ReviewEvent` (id, note_id FK cascade, owner_id, strength, reviewed_at). One migration creates all four tables + indexes (`(owner_id, reviewed_at)` for streak/activity, `(owner_id, note_id, reviewed_at desc)` for due review). Migration + tests. Commit: `Add quiz, attempt, and review-event models and migration`.

## Task P3.2: Quiz generation API

**Files:**
- Create: `backend/app/services/quizgen.py`
- Create: `backend/app/api/quiz.py`
- Create: `backend/app/schemas/quiz.py`
- Test: `backend/tests/test_api_quiz.py`

**Step 1:** `quizgen.py` — calls an AI service (non-Claude LLM per handoff) with the note's `content_text`, prompt for N MCQ (4 options, 1 correct). Validate response schema (4 opts, one correct). On bad/empty → raise → 502.

**Step 2:** `POST /api/notes/{title}/quiz` — fetch note (404), generate questions, UPSERT quiz (regen replaces prior) + questions, return `Quiz {id, questions[]}`. `GET /api/notes/{title}/quiz` — return existing quiz (404 if none).

**Step 3:** Tests: generate happy path (mock the AI service), 404 missing note, 502 on AI failure, regen replaces. Commit: `Add quiz generation API`.

## Task P3.3: Review events + quiz attempts + activity/streak APIs

**Files:**
- Create: `backend/app/api/activity.py` (review, attempts, activity, streak)
- Create: `backend/app/services/streak.py` (streak + heatmap computation)
- Modify: `backend/app/schemas/quiz.py` (add `AttemptCreate`, `AttemptOut`, `ReviewEventOut`, `ActivityOut`, `StreakOut`)
- Test: `backend/tests/test_api_activity.py`

**Step 1:** `POST /api/quizzes/{id}/attempts` — fetch quiz (404), validate answers against questions, compute score, insert `QuizAttempt`, return `{id, score, total, answers}`. **This is what makes quiz results persist** (required by Streak/Review).

**Step 2:** `POST /api/notes/{title}/review` — fetch note (404), insert `ReviewEvent` with `strength` (0-3), return event. `GET /api/review/due` — notes whose latest `ReviewEvent` is older than the spaced-repetition interval (start with simple intervals: strength 1 → 1 day, 2 → 3 days, 3 → 7 days; never reviewed → due now), returns `[{noteId, title, subject, strength, lastReviewed}]`.

**Step 3:** `GET /api/activity?from=&to=` — aggregate per-day counts of notes created, quizzes taken, reviews done (union of `notes.created_at`, `quiz_attempts.taken_at`, `review_events.reviewed_at`), returns `[{date, notesCreated, quizzesTaken, reviewsDone}]`.

**Step 4:** `GET /api/streak` — `services/streak.py` computes current/longest/total streak from the activity aggregation (consecutive days with ≥1 activity), plus `heatmap:[{date,count}]` for the calendar grid. Returns `{current, longest, total, heatmap}`.

**Step 5:** Tests — attempt happy path + 404; review event create + 404; `/review/due` returns never-reviewed + overdue; `/activity` aggregates across all three event sources; `/streak` computes consecutive days correctly (test a gap → streak resets). Commit: `Add review, quiz-attempt, activity, and streak APIs`.

## Task P3.4: Frontend quiz screens (match mockup)

**Files:**
- Create: `frontend/src/pages/Quiz.tsx`, `frontend/src/pages/QuizResult.tsx`
- Create: `frontend/src/api/quiz.ts`

Port `isQuiz` (lines 349+) — question card with 4 option buttons (A/B/C/D badges), correct=coral fill, wrong=rose fill, "Tiếp" navigation, progress "1/10". On finish → `POST /api/quizzes/{id}/attempts` then `QuizResult` (port `isResult`): score ring, missed-questions accordion (collapsible, chevDown animation, "why" explanation). Wire to real quiz + attempt APIs. **Fix the quiz explanation dock spacing** noted in the spec (`dockStyle` margin collapses when explanation panel expands). Commit: `Add quiz and result screens wired to API`.

## Task P3.5: Review screen (match mockup)

**Files:**
- Create: `frontend/src/pages/Review.tsx`
- Create: `frontend/src/api/activity.ts`

Port `isReview` — due cards list (subject color dot + title + 3-bar strength indicator + "last reviewed" + chevRight), "Sắp tới" section. DB-backed via `GET /api/review/due`; "Đã ôn" button on a card → `POST /api/notes/{title}/review` with selected strength. Commit: `Add review screen wired to review API`.

## Task P3.6: Streak screen (match mockup)

**Files:**
- Create: `frontend/src/pages/Streak.tsx`

Port `isStreak` — big flame + "{n} ngày" streak number (from `GET /api/streak` `current`), heatmap (port `heatmap` SVG builder verbatim from prototype — calendar grid colored by `heatmap[].count`), growth chart (port `growthChart` SVG), timeline of recent activity (from `GET /api/activity`), ministats (`longest`, `total`). DB-backed, no seed data. Commit: `Add streak screen with heatmap and growth chart wired to streak API`.

## Task P3.7: Profile screen (match mockup)

**Files:**
- Create: `frontend/src/pages/Profile.tsx`

Port `isProfile` — avatar + name + stats, leaderboard (port `LEADER` data structure, highlight "me" row with accent-tint), settings list (theme toggle, notifications, sync, language — port the switch + knob styles from lines 973-982). Commit: `Add profile screen`.

## Phase 3 Verification

1. Open a note with content → "Bắt đầu Quiz" → generates quiz → answer → `POST /api/quizzes/{id}/attempts` persists → result screen with score + missed explanations.
2. Mark a note reviewed with strength 2 → `POST /api/notes/{title}/review` persists → `/api/review/due` no longer lists it as due today.
3. Review screen shows due notes (never-reviewed + overdue by interval).
4. Streak screen heatmap populated by `GET /api/streak` (real activity from notes/quizzes/reviews across consecutive days; a day with no activity breaks the streak).
5. Profile shows settings; theme toggle works.
6. Backend tests pass: `docker compose run --rm backend pytest -v`.

---

# Phase 4 — Google OAuth + attachments

## Task P4.1: Google OAuth

**Files:**
- Modify: `backend/app/api/auth.py`, `backend/app/core/security.py`
- Create: `backend/app/services/oauth_google.py`
- Modify: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`

Implement real Google OAuth: backend exchange code → verify Google ID token → find/create user → issue JWT. Frontend Google button → redirect to Google consent → callback → store token. `/api/config` flips to `{authType: "password+google"}`. Commit: `Add Google OAuth sign-in`.

## Task P4.2: Attachments model + storage

**Files:**
- Create: `backend/app/models/attachment.py`
- Create: `backend/app/services/storage.py` (MinIO/S3 client)
- Create: `backend/app/api/attachments.py`
- Modify: `docker-compose.yml` (add MinIO service)
- Test: `backend/tests/test_api_attachments.py`

`attachments` table (owner_id required, note_id nullable so unsaved `/app/new` drafts can upload), `POST /api/attachments` (multipart upload, Bearer auth; optional `noteId` form field to associate with a saved note) → PUT object in MinIO → insert row with `owner_id` from token + `note_id` if provided → return `{url}`. Orphaned attachments (note deleted → `note_id` set null) are cleaned by a later GC job. Editor image button → file picker → upload → insert image block with `url`. Commit: `Add attachment upload and storage`.

## Task P4.3: Editor image upload integration

**Files:**
- Modify: `frontend/src/components/editor/Editor.tsx`, `frontend/src/components/editor/schema.ts`

Wire the image toolbar button + BlockNote image block to upload via `/api/attachments` and insert the returned URL. Port the prototype's image placeholder figure style (dashed border, accent-tint diagonal stripe, "ảnh chụp slide" label) for uploading state. Commit: `Wire editor image upload to attachments API`.

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-06-23-noteknock-full-build.md`.**

Two execution options:

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints.

Which approach?
