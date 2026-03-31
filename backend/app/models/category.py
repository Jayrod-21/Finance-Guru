"""
Category model — user-created spending categories with optional budget amounts.
Categories are soft-deleted to preserve historical transaction references.
"""
from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    budget_amount = Column(Float, nullable=True, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
