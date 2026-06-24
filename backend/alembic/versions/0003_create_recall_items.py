"""create recall items table

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, Sequence[str], None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recall_items",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("note_id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("checked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("source", sa.Text(), server_default=sa.text("'manual'"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["note_id"], ["notes.id"], name=op.f("fk_recall_items_note_id_notes"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name=op.f("fk_recall_items_owner_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recall_items")),
    )
    op.create_index(
        "ix_recall_items_note_id_position",
        "recall_items",
        ["note_id", "position"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_recall_items_note_id_position", table_name="recall_items")
    op.drop_table("recall_items")
