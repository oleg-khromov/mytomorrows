"""add condition trigram index

Revision ID: 202609181930
Revises: 202609181700
Create Date: 2026-09-18 19:30:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "202609181930"
down_revision: str | None = "202609181700"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_index(
        "ix_trials_condition_trgm",
        "trials",
        ["condition"],
        postgresql_using="gin",
        postgresql_ops={"condition": "gin_trgm_ops"},
    )


def downgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return

    op.drop_index("ix_trials_condition_trgm", table_name="trials", postgresql_using="gin")
