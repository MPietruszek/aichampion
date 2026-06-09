"""add users and user_id to conversations

Revision ID: 002
Revises: 001
Create Date: 2025-05-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    op.add_column('conversations', sa.Column(
        'user_id', UUID(as_uuid=True),
        sa.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True,  # nullable tymczasowo dla istniejących wierszy
    ))
    op.create_index('idx_conversations_user_id', 'conversations', ['user_id'])

def downgrade():
    op.drop_index('idx_conversations_user_id')
    op.drop_column('conversations', 'user_id')
    op.drop_index('idx_users_email')
    op.drop_table('users')
