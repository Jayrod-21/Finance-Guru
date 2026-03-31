"""
IncomeSource model — tracks income sources with variable frequency support.
Handles bi-weekly, monthly, weekly, and irregular income.
"""
from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class IncomeSource(Base):
    __tablename__ = "income_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String(20), nullable=False, default="monthly")  # biweekly, monthly, weekly, irregular
    is_variable = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
