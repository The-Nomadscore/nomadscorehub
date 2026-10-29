"""Replace owner_id with user_id

Revision ID: fb97eda02653
Revises: c4a1e7b92d30
Create Date: 2026-10-27 18:23:16.673186

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb97eda02653'
down_revision = 'c4a1e7b92d30'
branch_labels = None
depends_on = None

def upgrade():
    # Guest rows can never match a real user, so they are removed first.
    op.execute("DELETE FROM shortlist_items")
    op.execute("DELETE FROM itineraries")

    with op.batch_alter_table('shortlist_items', schema=None) as batch_op:
        batch_op.drop_index('ix_shortlist_items_owner_id')
        batch_op.drop_constraint('uq_shortlist_owner_city', type_='unique')
        batch_op.drop_column('owner_id')
        batch_op.add_column(sa.Column('user_id', sa.String(length=36), nullable=False))
        batch_op.create_foreign_key('fk_shortlist_items_user_id_users', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_unique_constraint('uq_shortlist_user_city', ['user_id', 'city_id'])
        batch_op.create_index('ix_shortlist_items_user_id', ['user_id'], unique=False)

    with op.batch_alter_table('itineraries', schema=None) as batch_op:
        batch_op.drop_index('ix_itineraries_owner_id')
        batch_op.drop_column('owner_id')
        batch_op.add_column(sa.Column('user_id', sa.String(length=36), nullable=False))
        batch_op.create_foreign_key('fk_itineraries_user_id_users', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index('ix_itineraries_user_id', ['user_id'], unique=False)


def downgrade():
    # user ids and owner ids are both 36-character UUIDs, so rows are kept
    # and owner_id is filled from user_id.
    with op.batch_alter_table('shortlist_items', schema=None) as batch_op:
        batch_op.drop_index('ix_shortlist_items_user_id')
        batch_op.drop_constraint('uq_shortlist_user_city', type_='unique')
        batch_op.drop_constraint('fk_shortlist_items_user_id_users', type_='foreignkey')
        batch_op.add_column(sa.Column('owner_id', sa.String(length=36), nullable=True))

    op.execute("UPDATE shortlist_items SET owner_id = user_id")

    with op.batch_alter_table('shortlist_items', schema=None) as batch_op:
        batch_op.alter_column('owner_id', existing_type=sa.String(length=36), nullable=False)
        batch_op.drop_column('user_id')
        batch_op.create_unique_constraint('uq_shortlist_owner_city', ['owner_id', 'city_id'])
        batch_op.create_index('ix_shortlist_items_owner_id', ['owner_id'], unique=False)

    with op.batch_alter_table('itineraries', schema=None) as batch_op:
        batch_op.drop_index('ix_itineraries_user_id')
        batch_op.drop_constraint('fk_itineraries_user_id_users', type_='foreignkey')
        batch_op.add_column(sa.Column('owner_id', sa.String(length=36), nullable=True))

    op.execute("UPDATE itineraries SET owner_id = user_id")

    with op.batch_alter_table('itineraries', schema=None) as batch_op:
        batch_op.alter_column('owner_id', existing_type=sa.String(length=36), nullable=False)
        batch_op.drop_column('user_id')
        batch_op.create_index('ix_itineraries_owner_id', ['owner_id'], unique=False)
