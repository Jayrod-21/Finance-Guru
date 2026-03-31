"""
Pydantic schemas for Category request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    budget_amount: Optional[float] = Field(default=0.0, ge=0)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    budget_amount: Optional[float] = Field(default=None, ge=0)


class CategoryResponse(BaseModel):
    id: int
    name: str
    budget_amount: float
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
