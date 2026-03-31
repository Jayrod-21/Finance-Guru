"""
Debt model — tracks individual debts with interest rates and minimum payments.
Can be linked to a debt_payoff goal for integrated tracking.
"""
from sqlalchemy import Column, Float, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    balance = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False, default=0.0)  # Annual percentage rate
    minimum_payment = Column(Float, nullable=False, default=0.0)
    linked_goal_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
