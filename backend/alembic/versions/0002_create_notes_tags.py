"""create notes and tags tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-24 01:36:31.932027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notes",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column(
            "content",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("content_text", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("subject", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.Text(), nullable=True),
        sa.Column("search_vec", postgresql.TSVECTOR(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name=op.f("fk_notes_owner_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notes")),
        sa.UniqueConstraint("owner_id", "title", name="uq_notes_owner_id_title"),
    )
    op.create_index("ix_notes_owner_id_updated_at", "notes", ["owner_id", "updated_at"], unique=False)
    op.create_table(
        "note_tags",
        sa.Column("note_id", sa.UUID(), nullable=False),
        sa.Column("tag", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["note_id"], ["notes.id"], name=op.f("fk_note_tags_note_id_notes"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("note_id", "tag", name=op.f("pk_note_tags")),
    )
    op.create_index(
        "ix_notes_search_vec", "notes", ["search_vec"], unique=False, postgresql_using="gin"
    )
    op.execute(
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
    op.execute(
        """
      CREATE TRIGGER trg_notes_refresh_search_vec
      BEFORE INSERT OR UPDATE OF title, content_text ON notes
      FOR EACH ROW EXECUTE FUNCTION refresh_search_vec();
    """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_notes_refresh_search_vec ON notes")
    op.execute("DROP FUNCTION IF EXISTS refresh_search_vec()")
    op.drop_index("ix_notes_search_vec", table_name="notes")
    op.drop_table("note_tags")
    op.drop_index("ix_notes_owner_id_updated_at", table_name="notes")
    op.drop_table("notes")
