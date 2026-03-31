"""
Pydantic schemas for Budget overview and danger zone responses.
"""
from pydantic import BaseModel


class CategoryBudgetOverview(BaseModel):
    category_id: int
    category_name: str
    budget_amount: float
    spent_this_month: float
    remaining: float
    percentage_used: float
    status: str  # "ok", "warning", "critical", "exceeded"


class BudgetOverviewResponse(BaseModel):
    categories: list[CategoryBudgetOverview]
    total_budget: float
    total_spent: float
    total_remaining: float


class DangerZoneResponse(BaseModel):
    danger_zones: list[CategoryBudgetOverview]
