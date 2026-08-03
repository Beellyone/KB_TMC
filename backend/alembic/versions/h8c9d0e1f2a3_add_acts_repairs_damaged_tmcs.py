"""add acts repairs damaged_tmcs

Revision ID: h8c9d0e1f2a3
Revises: g7b8c9d0e1f2
Create Date: 2026-08-02 01:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h8c9d0e1f2a3'
down_revision: Union[str, None] = 'g7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('acts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(length=100), nullable=False),
        sa.Column('executor_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('attention_mark', sa.Enum('CALM', 'ATTENTION', name='attentionmark'), nullable=False),
        sa.Column('status', sa.Enum('NEW', 'CHECKING', 'DONE', 'COMPLETE', 'DECLINED', name='actstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['executor_id'], ['executors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_acts_number'), 'acts', ['number'], unique=True)

    op.create_table('act_dates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('act_id', sa.Integer(), nullable=False),
        sa.Column('diagnostics_date', sa.Date(), nullable=True),
        sa.Column('verification_date', sa.Date(), nullable=True),
        sa.Column('invoice_date', sa.Date(), nullable=True),
        sa.Column('return_date', sa.Date(), nullable=True),
        sa.Column('confirmation_date', sa.Date(), nullable=True),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['act_id'], ['acts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('act_id'),
    )

    op.create_table('damaged_tmcs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tmc_id', sa.Integer(), nullable=False),
        sa.Column('serial_number', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tmc_id'], ['tmcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_damaged_tmcs_serial_number'), 'damaged_tmcs', ['serial_number'], unique=True)

    op.create_table('repairs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('act_id', sa.Integer(), nullable=False),
        sa.Column('damaged_tmc_id', sa.Integer(), nullable=False),
        sa.Column('fault_description', sa.Text(), nullable=True),
        sa.Column('cost_approval', sa.Enum('DISAPPROVED', 'APPROVED', 'GUARANTEE', name='costapproval'), nullable=False),
        sa.Column('state_qualification', sa.Enum('UNCHECKED', 'UNQUALIFIED', 'QUALIFIED', name='statequalification'), nullable=False),
        sa.Column('attention_mark', sa.Enum('CALM', 'ATTENTION', name='attentionmark'), nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['act_id'], ['acts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['damaged_tmc_id'], ['damaged_tmcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('repairs')
    op.drop_index(op.f('ix_damaged_tmcs_serial_number'), table_name='damaged_tmcs')
    op.drop_table('damaged_tmcs')
    op.drop_table('act_dates')
    op.drop_index(op.f('ix_acts_number'), table_name='acts')
    op.drop_table('acts')
    op.execute("DROP TYPE IF EXISTS attentionmark")
    op.execute("DROP TYPE IF EXISTS actstatus")
    op.execute("DROP TYPE IF EXISTS costapproval")
    op.execute("DROP TYPE IF EXISTS statequalification")
