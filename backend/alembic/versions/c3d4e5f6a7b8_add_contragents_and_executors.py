"""add contragents and executors

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-31 23:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('contragents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=500), nullable=True),
        sa.Column('org_form', sa.String(length=100), nullable=True),
        sa.Column('person', sa.String(length=255), nullable=True),
        sa.Column('job', sa.String(length=255), nullable=True),
        sa.Column('basis', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_contragents_name'), 'contragents', ['name'], unique=True)

    op.create_table('executors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('contragent_id', sa.Integer(), nullable=False),
        sa.Column('emails', sa.Text(), nullable=True),
        sa.Column('agreement_number', sa.String(length=100), nullable=True),
        sa.Column('agreement_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contragent_id'], ['contragents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('executors')
    op.drop_index(op.f('ix_contragents_name'), table_name='contragents')
    op.drop_table('contragents')
