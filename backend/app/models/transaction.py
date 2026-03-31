"""
Transaction model — individual income/expense entries that form the ledger.
Each transaction belongs to a category and has a type (income or expense).
"""
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True, default="")
    type = Column(String(10), nullable=False)  # "income" or "expense"
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
