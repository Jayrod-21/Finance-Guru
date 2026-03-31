"""
Pydantic schemas for IncomeSource request/response validation.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class IncomeFrequency(str, Enum):
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"
    irregular = "irregular"


class IncomeSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    frequency: IncomeFrequency = IncomeFrequency.monthly
    is_variable: bool = False


class IncomeSourceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    frequency: Optional[IncomeFrequency] = None
    is_variable: Optional[bool] = None
    is_active: Optional[bool] = None


class IncomeSourceResponse(BaseModel):
    id: int
    name: str
    amount: float
    frequency: str
    is_variable: bool
    is_active: bool
    monthly_amount: float  # Calculated: normalized to monthly
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MonthlyIncomeResponse(BaseModel):
    total_monthly_income: float
    sources: list[IncomeSourceResponse]
