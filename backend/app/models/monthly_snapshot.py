"""
MonthlySnapshot model — stores monthly financial summaries for historical browsing.
Category breakdown stored as JSON blob for flexible schema.
"""
from sqlalchemy import Column, Integer, Float, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class MonthlySnapshot(Base):
    __tablename__ = "monthly_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    total_income = Column(Float, nullable=False, default=0.0)
    total_expenses = Column(Float, nullable=False, default=0.0)
    net_savings = Column(Float, nullable=False, default=0.0)
    category_breakdown = Column(Text, nullable=True)  # JSON string
    goal_progress = Column(Text, nullable=True)  # JSON string
    debt_balances = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, server_default=func.now())
