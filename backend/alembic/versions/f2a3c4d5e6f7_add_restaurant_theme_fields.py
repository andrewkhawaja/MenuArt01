"""add restaurant theme fields

Revision ID: f2a3c4d5e6f7
Revises: b4c86729b030
Create Date: 2026-01-21
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f2a3c4d5e6f7"
down_revision = "b4c86729b030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("restaurants", sa.Column("theme_name", sa.String(length=50), nullable=True))
    op.add_column("restaurants", sa.Column("theme_primary", sa.String(length=20), nullable=True))
    op.add_column("restaurants", sa.Column("theme_secondary", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("restaurants", "theme_secondary")
    op.drop_column("restaurants", "theme_primary")
    op.drop_column("restaurants", "theme_name")
