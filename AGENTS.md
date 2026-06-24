# AGENTS.md

## Source Of Truth
- Read `docs/plans/2026-06-23-noteknock-full-build.md` before feature work; it is the active build plan and supersedes older handoff details where it says so.
- Read `handoff.md` for project context, API parity notes, and open decisions, but prefer the plan when data model/API details conflict.
- For frontend/design work, read `design/README.md` and `design/project/StudyMap.dc.html`; the mockup source of truth is `StudyMap.dc.html`, not `design/project/uploads/StudyMap Editor.html`.
- Preserve the Peeky visual system from the design docs: cream/plum/coral tokens, Fraunces + Inter, 24px radii, warm dark theme, and skinned BlockNote rather than default BlockNote UI.

## Architecture
- Monorepo: `backend/` FastAPI + async SQLAlchemy/Alembic/Postgres, `frontend/` Vite React/TS, root `docker-compose.yml` with Postgres 16.
- Backend entrypoint is `backend/app/main.py`; routers are mounted under `/api`, and the backend Docker command runs `alembic upgrade head` before `uvicorn`.
- Alembic metadata only sees models imported in `backend/alembic/env.py`; add new model modules there and in `backend/tests/conftest.py` when tests use `Base.metadata.create_all`.
- API JSON is camelCase through `CamelModel`; OAuth token responses intentionally stay snake_case (`access_token`, `token_type`).

## Commands
- Full stack: create `.env` from `.env.example`, then `docker compose up`.
- Postgres only: `docker compose up postgres -d`; stop with `docker compose down`.
- Backend migration: from `backend/`, run `alembic upgrade head` with `DATABASE_URL`, `JWT_SECRET`, and LLM env vars set.
- Backend focused tests: from `backend/`, use `python -m pytest tests/test_api_activity.py -q` or another specific test file; dev deps are optional extras in `pyproject.toml`, not installed by the backend Docker image.
- Backend lint: from `backend/`, run `ruff check app tests` after installing dev extras.
- Frontend dev: from `frontend/`, `npm run dev`; build/typecheck: `npm run build`; lint: `npm run lint`.

## Environment And Test Gotchas
- `JWT_SECRET` has no default; backend import/startup fails without it.
- LLM-backed modules require `LLM_BASE_URL`, `LLM_API_KEY`, and non-empty `LLM_MODEL`; tests set safe defaults in `backend/tests/conftest.py`.
- Docker maps Postgres to host `5432`; if that port is already taken, `docker compose run` may fail before tests start.
- The backend Dockerfile installs only runtime deps (`pip install .`), so `pytest`/`ruff` are absent unless installed separately or using a dev environment.
- Test DB defaults to `settings.database_url + "_test"`; create `noteknock_test` or set `TEST_DATABASE_URL` before integration tests.

## Backend Conventions
- Keep notes as BlockNote JSON in `notes.content`; derive searchable text with `backend/app/services/content.py` and tags with `backend/app/services/tags.py`.
- Search must use safe Postgres FTS patterns (`websearch_to_tsquery`/fallbacks), not arbitrary user text in `to_tsquery`.
- Note title validation and parity error strings matter; avoid changing existing response details unless the plan says to.
- User data is owner-scoped; every note, quiz, attempt, review, recall item, and future attachment route must filter by `owner_id` and return 404 for cross-user access.
- Quiz regeneration currently delete/recreates quizzes; be aware this cascades quiz questions and, after attempts exist, any dependent attempts.

## Workflow
- `opencode.json` uses `handoff.md` and the full-build plan as session instructions and defines implementer/spec-reviewer/code-reviewer agents.
- For plan tasks, use subagent-driven development: fresh implementer per task, then spec-reviewer first, code-reviewer second; do not start the next task until both gates pass.
- After completing any implementation task from the plan, update `handoff.md` with what changed, verification/review status, commits, blockers, and the next task before moving on.
- Use Context7 for library/API details and Kagi for uncertain web research; this repo already configures both MCPs in `opencode.json`.
- Keep changes task-scoped and commit only when explicitly requested or when following the current subagent plan workflow.
