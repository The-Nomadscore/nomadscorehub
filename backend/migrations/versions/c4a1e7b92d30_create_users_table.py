"""Create users table

Revision ID: c4a1e7b92d30
Revises: afd5d20a644f
Create Date: 2026-10-23 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4a1e7b92d30'
down_revision = 'afd5d20a644f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('users',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('is_admin', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("email = lower(trim(email))", name='ck_users_email_normalized'),
    sa.CheckConstraint("email <> ''", name='ck_users_email_not_empty'),
    sa.PrimaryKeyConstraint('id', name='pk_users'),
    sa.UniqueConstraint('email', name='uq_users_email')
    )


def downgrade():
    op.drop_table('users')