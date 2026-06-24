import os

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.db.base import Base
from app.db.session import get_db
import app.models.user  # noqa: F401
import app.models.note  # noqa: F401
from app.main import app as fastapi_app

TEST_DB_URL = os.getenv("TEST_DATABASE_URL", settings.database_url + "_test")


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                """
          CREATE OR REPLACE FUNCTION refresh_search_vec() RETURNS trigger AS $$
          BEGIN
            NEW.search_vec := setweight(to_tsvector('simple', NEW.title), 'A') ||
                              setweight(to_tsvector('simple', coalesce(NEW.content_text, '')), 'B');
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        """
            )
        )
        await conn.execute(text("DROP TRIGGER IF EXISTS trg_notes_refresh_search_vec ON notes"))
        await conn.execute(
            text(
                """
          CREATE TRIGGER trg_notes_refresh_search_vec
          BEFORE INSERT OR UPDATE OF title, content_text ON notes
          FOR EACH ROW EXECUTE FUNCTION refresh_search_vec();
        """
            )
        )
    yield eng
    async with eng.begin() as conn:
        await conn.execute(text("DROP TRIGGER IF EXISTS trg_notes_refresh_search_vec ON notes"))
        await conn.execute(text("DROP FUNCTION IF EXISTS refresh_search_vec()"))
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db(engine):
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(engine):
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_get_db():
        async with TestSession() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as c:
        yield c
    fastapi_app.dependency_overrides.clear()