"""
Pydantic schemas for Debt request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DebtCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    balance: float = Field(..., gt=0)
    interest_rate: float = Field(default=0.0, ge=0)
    minimum_payment: float = Field(default=0.0, ge=0)


class DebtUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    balance: Optional[float] = Field(default=None, ge=0)
    interest_rate: Optional[float] = Field(default=None, ge=0)
    minimum_payment: Optional[float] = Field(default=None, ge=0)


class DebtResponse(BaseModel):
    id: int
    name: str
    balance: float
    interest_rate: float
    minimum_payment: float
    linked_goal_id: Optional[int]
    monthly_interest: float
    payoff_months: Optional[int]  # Months to pay off at minimum payment
    total_interest_cost: Optional[float]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
