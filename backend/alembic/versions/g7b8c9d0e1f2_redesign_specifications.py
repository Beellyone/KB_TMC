"""redesign specifications

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('specification_items')
    op.drop_table('specifications')

    op.create_table('specifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('executor_id', sa.Integer(), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['executor_id'], ['executors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('spec_mother_tmcs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('mother_tmc_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['specification_id'], ['specifications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mother_tmc_id'], ['mother_tmcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('spec_works',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('spec_mother_tmc_id', sa.Integer(), nullable=False),
        sa.Column('breakdown_source', sa.String(length=20), nullable=False),
        sa.Column('breakdown_id', sa.Integer(), nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['spec_mother_tmc_id'], ['spec_mother_tmcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('spec_works')
    op.drop_table('spec_mother_tmcs')
    op.drop_table('specifications')
