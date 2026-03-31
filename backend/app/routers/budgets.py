"""
Budget system endpoints.
Calculates per-category spending against budget limits for the current month.
Danger zones: 80% warning, 95% critical, 100%+ exceeded.
"""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetOverviewResponse,
    CategoryBudgetOverview,
    DangerZoneResponse,
)

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _get_status(percentage: float) -> str:
    """Determine danger zone status based on budget usage percentage."""
    if percentage >= 100:
        return "exceeded"
    if percentage >= 95:
        return "critical"
    if percentage >= 80:
        return "warning"
    return "ok"


async def _build_category_overviews(
    db: AsyncSession,
) -> list[CategoryBudgetOverview]:
    """
    Build budget overview for every active category.
    Sums expense transactions in the current calendar month per category.
    """
    today = date.today()
    month_start = today.replace(day=1)

    # Fetch all active categories
    cat_result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.name)
    )
    categories = cat_result.scalars().all()

    # Sum expenses per category for the current month
    spent_result = await db.execute(
        select(Transaction.category_id, func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(
            Transaction.type == "expense",
            Transaction.date >= month_start,
            Transaction.date <= today,
        )
        .group_by(Transaction.category_id)
    )
    spent_map = {row[0]: row[1] for row in spent_result.all()}

    overviews = []
    for cat in categories:
        spent = round(spent_map.get(cat.id, 0.0), 2)
        budget = cat.budget_amount or 0.0
        remaining = round(budget - spent, 2)
        pct = round((spent / budget) * 100, 2) if budget > 0 else 0.0

        overviews.append(
            CategoryBudgetOverview(
                category_id=cat.id,
                category_name=cat.name,
                budget_amount=budget,
                spent_this_month=spent,
                remaining=remaining,
                percentage_used=pct,
                status=_get_status(pct),
            )
        )
    return overviews


@router.get("/overview", response_model=BudgetOverviewResponse)
async def budget_overview(db: AsyncSession = Depends(get_db)):
    """
    All categories with budget_amount, spent_this_month, remaining, and percentage_used.
    Also returns aggregate totals across all categories.
    """
    overviews = await _build_category_overviews(db)

    total_budget = round(sum(o.budget_amount for o in overviews), 2)
    total_spent = round(sum(o.spent_this_month for o in overviews), 2)
    total_remaining = round(total_budget - total_spent, 2)

    return BudgetOverviewResponse(
        categories=overviews,
        total_budget=total_budget,
        total_spent=total_spent,
        total_remaining=total_remaining,
    )


@router.get("/danger-zones", response_model=DangerZoneResponse)
async def danger_zones(db: AsyncSession = Depends(get_db)):
    """Categories at 80%+ budget usage — warning, critical, or exceeded."""
    overviews = await _build_category_overviews(db)
    danger = [o for o in overviews if o.status != "ok"]
    return DangerZoneResponse(danger_zones=danger)


@router.get("/aggregate")
async def aggregate(db: AsyncSession = Depends(get_db)):
    """Total budget, total spent this month, and total remaining across all categories."""
    overviews = await _build_category_overviews(db)

    total_budget = round(sum(o.budget_amount for o in overviews), 2)
    total_spent = round(sum(o.spent_this_month for o in overviews), 2)
    total_remaining = round(total_budget - total_spent, 2)

    return {
        "total_budget": total_budget,
        "total_spent": total_spent,
        "total_remaining": total_remaining,
        "category_count": len(overviews),
        "danger_count": sum(1 for o in overviews if o.status != "ok"),
    }
