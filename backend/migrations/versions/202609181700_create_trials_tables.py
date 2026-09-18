"""create trials tables

Revision ID: 202609181700
Revises:
Create Date: 2026-09-18 17:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "202609181700"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "trials",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("condition", sa.String(length=160), nullable=False),
        sa.Column("sponsor", sa.String(length=255), nullable=False),
        sa.Column("phase", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=80), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("intervention", sa.String(length=255), nullable=False),
        sa.Column("last_updated", sa.Date(), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trials_condition", "trials", ["condition"])
    op.create_index("ix_trials_last_updated", "trials", ["last_updated"])
    op.create_index("ix_trials_status", "trials", ["status"])
    op.create_index("ix_trials_title", "trials", ["title"])

    op.create_table(
        "trial_eligibility",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("trial_id", sa.String(length=32), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("criterion", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["trial_id"], ["trials.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trial_eligibility_trial_id", "trial_eligibility", ["trial_id"])

    op.create_table(
        "trial_locations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("trial_id", sa.String(length=32), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("facility", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["trial_id"], ["trials.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trial_locations_country", "trial_locations", ["country"])
    op.create_index("ix_trial_locations_trial_id", "trial_locations", ["trial_id"])


def downgrade() -> None:
    op.drop_index("ix_trial_locations_trial_id", table_name="trial_locations")
    op.drop_index("ix_trial_locations_country", table_name="trial_locations")
    op.drop_table("trial_locations")
    op.drop_index("ix_trial_eligibility_trial_id", table_name="trial_eligibility")
    op.drop_table("trial_eligibility")
    op.drop_index("ix_trials_title", table_name="trials")
    op.drop_index("ix_trials_status", table_name="trials")
    op.drop_index("ix_trials_last_updated", table_name="trials")
    op.drop_index("ix_trials_condition", table_name="trials")
    op.drop_table("trials")
