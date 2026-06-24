"""create attachments table

Revision ID: 0005_create_attachments
Revises: 0004
Create Date: 2026-06-25 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_create_attachments"
down_revision: Union[str, Sequence[str], None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "attachments",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("note_id", sa.UUID(), nullable=True),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["note_id"],
            ["notes.id"],
            name=op.f("fk_attachments_note_id_notes"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name=op.f("fk_attachments_owner_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_attachments")),
        sa.UniqueConstraint("key", name=op.f("uq_attachments_key")),
    )
    op.create_index(
        "ix_attachments_owner_id_created_at",
        "attachments",
        ["owner_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_attachments_note_id",
        "attachments",
        ["note_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_attachments_note_id", table_name="attachments")
    op.drop_index("ix_attachments_owner_id_created_at", table_name="attachments")
    op.drop_table("attachments")
