"""
Pydantic schemas for Transaction request/response validation.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


class TransactionCreate(BaseModel):
    date: date
    amount: float = Field(..., gt=0)
    description: Optional[str] = Field(default="", max_length=255)
    type: TransactionType
    category_id: Optional[int] = None


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, max_length=255)
    type: Optional[TransactionType] = None
    category_id: Optional[int] = None


class TransactionResponse(BaseModel):
    id: int
    date: date
    amount: float
    description: Optional[str]
    type: str
    category_id: Optional[int]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BalanceResponse(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
