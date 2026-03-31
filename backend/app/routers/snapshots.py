"""
Monthly snapshot endpoints.
Generates and browses historical monthly financial summaries.
Auto-triggers snapshot of previous month on first access of a new month.
"""
import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.monthly_snapshot import MonthlySnapshot
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.models.debt import Debt

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])


async def _generate_snapshot(db: AsyncSession, year: int, month: int) -> MonthlySnapshot:
    """Generate a snapshot for a given year/month from transaction data."""
    from datetime import timedelta

    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(year, month + 1, 1) - timedelta(days=1)

    # Total income
    inc_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "income", Transaction.date >= month_start, Transaction.date <= month_end)
    )
    total_income = round(inc_result.scalar(), 2)

    # Total expenses
    exp_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "expense", Transaction.date >= month_start, Transaction.date <= month_end)
    )
    total_expenses = round(exp_result.scalar(), 2)

    # Category breakdown
    cat_result = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount))
        .where(Transaction.type == "expense", Transaction.date >= month_start, Transaction.date <= month_end)
        .group_by(Transaction.category_id)
    )
    cat_data = {}
    for cat_id, amount in cat_result.all():
        if cat_id:
            cat = await db.get(Category, cat_id)
            cat_data[cat.name if cat else "Unknown"] = round(amount, 2)
        else:
            cat_data["Uncategorized"] = round(amount, 2)

    # Goal progress
    goal_result = await db.execute(select(Goal).where(Goal.is_active == True))
    goal_data = [{"name": g.name, "current": g.current_amount, "target": g.target_amount} for g in goal_result.scalars().all()]

    # Debt balances
    debt_result = await db.execute(select(Debt))
    debt_data = [{"name": d.name, "balance": d.balance} for d in debt_result.scalars().all()]

    snapshot = MonthlySnapshot(
        year=year,
        month=month,
        total_income=total_income,
        total_expenses=total_expenses,
        net_savings=round(total_income - total_expenses, 2),
        category_breakdown=json.dumps(cat_data),
        goal_progress=json.dumps(goal_data),
        debt_balances=json.dumps(debt_data),
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


def _format_snapshot(s: MonthlySnapshot) -> dict:
    """Convert snapshot to response dict with parsed JSON fields."""
    return {
        "id": s.id,
        "year": s.year,
        "month": s.month,
        "total_income": s.total_income,
        "total_expenses": s.total_expenses,
        "net_savings": s.net_savings,
        "category_breakdown": json.loads(s.category_breakdown) if s.category_breakdown else {},
        "goal_progress": json.loads(s.goal_progress) if s.goal_progress else [],
        "debt_balances": json.loads(s.debt_balances) if s.debt_balances else [],
        "created_at": str(s.created_at) if s.created_at else None,
    }


@router.post("/generate")
async def generate_snapshot(
    year: int = None,
    month: int = None,
    db: AsyncSession = Depends(get_db),
):
    """Manually generate a snapshot for a given month (defaults to previous month)."""
    today = date.today()
    if year is None or month is None:
        # Default to previous month
        if today.month == 1:
            year, month = today.year - 1, 12
        else:
            year, month = today.year, today.month - 1

    # Check if snapshot already exists
    existing = await db.execute(
        select(MonthlySnapshot).where(MonthlySnapshot.year == year, MonthlySnapshot.month == month)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Snapshot for {year}-{month:02d} already exists")

    snapshot = await _generate_snapshot(db, year, month)
    return _format_snapshot(snapshot)


@router.get("")
async def list_snapshots(db: AsyncSession = Depends(get_db)):
    """Browse all historical snapshots."""
    result = await db.execute(
        select(MonthlySnapshot).order_by(MonthlySnapshot.year.desc(), MonthlySnapshot.month.desc())
    )
    return [_format_snapshot(s) for s in result.scalars().all()]


@router.get("/{year}/{month}")
async def get_snapshot(year: int, month: int, db: AsyncSession = Depends(get_db)):
    """Get a specific month's snapshot."""
    result = await db.execute(
        select(MonthlySnapshot).where(MonthlySnapshot.year == year, MonthlySnapshot.month == month)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(status_code=404, detail=f"No snapshot for {year}-{month:02d}")
    return _format_snapshot(snapshot)
