"""fix damaged_tmc unique constraint

Revision ID: i9d0e1f2a3b4
Revises: h8c9d0e1f2a3
Create Date: 2026-08-03 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'i9d0e1f2a3b4'
down_revision: Union[str, None] = 'h8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('ix_damaged_tmcs_serial_number', table_name='damaged_tmcs')
    op.create_unique_constraint('uq_damaged_tmc_serial', 'damaged_tmcs', ['tmc_id', 'serial_number'])


def downgrade() -> None:
    op.drop_constraint('uq_damaged_tmc_serial', 'damaged_tmcs', type_='unique')
    op.create_index('ix_damaged_tmcs_serial_number', 'damaged_tmcs', ['serial_number'], unique=True)
