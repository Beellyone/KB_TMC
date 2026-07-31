"""add tmc models and audit log

Revision ID: a1b2c3d4e5f6
Revises: 2fca7c7c4d25
Create Date: 2026-07-31 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '2fca7c7c4d25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('tmc_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tmc_categories_name'), 'tmc_categories', ['name'], unique=True)

    op.create_table('mother_tmcs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['tmc_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_mother_tmcs_code'), 'mother_tmcs', ['code'], unique=True)

    op.create_table('tmcs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mother_tmc_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['mother_tmc_id'], ['mother_tmcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tmcs_code'), 'tmcs', ['code'], unique=True)

    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('changes_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_audit_logs_entity_type'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_tmcs_code'), table_name='tmcs')
    op.drop_table('tmcs')
    op.drop_index(op.f('ix_mother_tmcs_code'), table_name='mother_tmcs')
    op.drop_table('mother_tmcs')
    op.drop_index(op.f('ix_tmc_categories_name'), table_name='tmc_categories')
    op.drop_table('tmc_categories')
