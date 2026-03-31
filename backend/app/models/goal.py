"""
Goal model — financial goals with progress tracking and deadline support.
Supports types: debt_payoff, savings, custom.
Can be linked to a debt for debt payoff goals.
"""
from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False, default="savings")  # debt_payoff, savings, custom
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, nullable=False, default=0.0)
    deadline = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    linked_debt_id = Column(Integer, ForeignKey("debts.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
