"""
Pydantic schemas for RecurringExpense request/response validation.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class BillingCycle(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class RecurringExpenseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    category_id: Optional[int] = None
    billing_cycle: BillingCycle = BillingCycle.monthly
    next_payment_date: Optional[date] = None


class RecurringExpenseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    category_id: Optional[int] = None
    billing_cycle: Optional[BillingCycle] = None
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringExpenseResponse(BaseModel):
    id: int
    name: str
    amount: float
    category_id: Optional[int]
    billing_cycle: str
    next_payment_date: Optional[date]
    is_active: bool
    monthly_cost: float  # Calculated: normalized to monthly
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
