"""
RecurringExpense model — tracks fixed recurring expenses like rent, subscriptions, etc.
Supports multiple billing cycles with auto-calculation of monthly cost.
"""
from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    billing_cycle = Column(String(20), nullable=False, default="monthly")  # monthly, annual, quarterly, weekly, custom
    next_payment_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
