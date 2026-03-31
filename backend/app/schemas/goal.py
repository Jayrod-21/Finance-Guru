"""
Pydantic schemas for Goal request/response validation.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class GoalType(str, Enum):
    debt_payoff = "debt_payoff"
    savings = "savings"
    custom = "custom"


class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: GoalType = GoalType.savings
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    deadline: Optional[date] = None
    linked_debt_id: Optional[int] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[GoalType] = None
    target_amount: Optional[float] = Field(default=None, gt=0)
    current_amount: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[date] = None
    linked_debt_id: Optional[int] = None
    is_active: Optional[bool] = None


class GoalResponse(BaseModel):
    id: int
    name: str
    type: str
    target_amount: float
    current_amount: float
    deadline: Optional[date]
    is_active: bool
    linked_debt_id: Optional[int]
    progress_percentage: float
    days_remaining: Optional[int]
    monthly_contribution_needed: Optional[float]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeasibilityResponse(BaseModel):
    monthly_income: float
    monthly_expenses: float
    monthly_recurring: float
    monthly_surplus: float
    total_monthly_goal_contributions: float
    is_feasible: bool
    deficit: float  # 0 if feasible, positive if not
