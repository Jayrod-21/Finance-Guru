"""
Analytics endpoints — spending insights, comparisons, projections, and burn rate.
All endpoints support optional date range parameters.
"""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense
from app.models.income_source import IncomeSource

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

INCOME_MULT = {"weekly": 52 / 12, "biweekly": 26 / 12, "monthly": 1.0, "irregular": 1.0}
EXPENSE_MULT = {"weekly": 52 / 12, "monthly": 1.0, "quarterly": 1 / 3, "annual": 1 / 12}


def _default_range(start: Optional[date], end: Optional[date]) -> tuple[date, date]:
    """Default to current month if no date range specified."""
    today = date.today()
    return start or today.replace(day=1), end or today


@router.get("/top-categories")
async def top_categories(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Most spent categories by total amount."""
    start, end = _default_range(date_start, date_end)
    result = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount).label("total"))
        .where(Transaction.type == "expense", Transaction.date >= start, Transaction.date <= end)
        .group_by(Transaction.category_id)
        .order_by(desc("total"))
        .limit(10)
    )
    rows = result.all()

    # Resolve category names
    cat_ids = [r[0] for r in rows if r[0]]
    cats = {}
    if cat_ids:
        cat_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
        cats = {c.id: c.name for c in cat_result.scalars().all()}

    return [
        {"category_id": r[0], "category_name": cats.get(r[0], "Uncategorized"), "total": round(r[1], 2)}
        for r in rows
    ]


@router.get("/frequency")
async def frequency(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Most recurring purchases by category frequency (transaction count)."""
    start, end = _default_range(date_start, date_end)
    result = await db.execute(
        select(Transaction.category_id, func.count().label("count"), func.sum(Transaction.amount).label("total"))
        .where(Transaction.type == "expense", Transaction.date >= start, Transaction.date <= end)
        .group_by(Transaction.category_id)
        .order_by(desc("count"))
        .limit(10)
    )
    rows = result.all()

    cat_ids = [r[0] for r in rows if r[0]]
    cats = {}
    if cat_ids:
        cat_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
        cats = {c.id: c.name for c in cat_result.scalars().all()}

    return [
        {"category_id": r[0], "category_name": cats.get(r[0], "Uncategorized"), "count": r[1], "total": round(r[2], 2), "average": round(r[2] / r[1], 2)}
        for r in rows
    ]


@router.get("/largest")
async def largest(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Largest single purchases."""
    start, end = _default_range(date_start, date_end)
    result = await db.execute(
        select(Transaction)
        .where(Transaction.type == "expense", Transaction.date >= start, Transaction.date <= end)
        .order_by(Transaction.amount.desc())
        .limit(limit)
    )
    txns = result.scalars().all()
    return [{"id": t.id, "date": str(t.date), "amount": t.amount, "description": t.description, "category_id": t.category_id} for t in txns]


@router.get("/comparisons/weekly")
async def weekly_comparison(db: AsyncSession = Depends(get_db)):
    """Week-over-week spending comparison for the last 8 weeks."""
    today = date.today()
    weeks = []
    for i in range(8):
        week_end = today - timedelta(days=today.weekday()) - timedelta(weeks=i)
        week_start = week_end - timedelta(days=6)
        result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(Transaction.type == "expense", Transaction.date >= week_start, Transaction.date <= week_end)
        )
        weeks.append({"week_start": str(week_start), "week_end": str(week_end), "total": round(result.scalar(), 2)})
    return list(reversed(weeks))


@router.get("/comparisons/monthly")
async def monthly_comparison(db: AsyncSession = Depends(get_db)):
    """Month-over-month spending comparison for the last 6 months."""
    today = date.today()
    months = []
    for i in range(6):
        # Calculate month start/end going backwards
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)

        result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(Transaction.type == "expense", Transaction.date >= month_start, Transaction.date <= month_end)
        )
        months.append({"month": f"{year}-{month:02d}", "total": round(result.scalar(), 2)})
    return list(reversed(months))


@router.get("/insights")
async def insights(db: AsyncSession = Depends(get_db)):
    """Generate 'Did you know' data points from spending patterns."""
    today = date.today()
    month_start = today.replace(day=1)
    insights_list = []

    # Top spending category
    top_cat = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount).label("total"), func.count().label("cnt"))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
        .group_by(Transaction.category_id)
        .order_by(desc("total"))
        .limit(1)
    )
    top = top_cat.first()
    if top and top[0]:
        cat = await db.get(Category, top[0])
        if cat:
            insights_list.append(f"You've spent ${top[1]:.2f} on {cat.name} across {top[2]} transactions this month.")

    # Most frequent category
    freq_cat = await db.execute(
        select(Transaction.category_id, func.count().label("cnt"), func.sum(Transaction.amount).label("total"))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
        .group_by(Transaction.category_id)
        .order_by(desc("cnt"))
        .limit(1)
    )
    freq = freq_cat.first()
    if freq and freq[0] and (not top or freq[0] != top[0]):
        cat = await db.get(Category, freq[0])
        if cat:
            avg = freq[2] / freq[1]
            insights_list.append(f"{cat.name} purchases: {freq[1]} times this month, averaging ${avg:.2f} each.")

    # Budget pace
    total_budget_result = await db.execute(
        select(func.coalesce(func.sum(Category.budget_amount), 0.0)).where(Category.is_active == True)
    )
    total_budget = total_budget_result.scalar()
    total_spent_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
    )
    total_spent = total_spent_result.scalar()

    if total_budget > 0:
        days_in_month = 30
        days_passed = max((today - month_start).days + 1, 1)
        projected = (total_spent / days_passed) * days_in_month
        diff = total_budget - projected
        if diff > 0:
            insights_list.append(f"Your spending pace suggests you'll end the month ${diff:.2f} under budget.")
        else:
            insights_list.append(f"At your current pace, you'll exceed your budget by ${abs(diff):.2f} this month.")

    return insights_list


@router.get("/projection")
async def projection(db: AsyncSession = Depends(get_db)):
    """
    Forward projection: estimated end-of-month balance.
    Based on daily spending pace + known recurring expenses remaining.
    """
    today = date.today()
    month_start = today.replace(day=1)
    days_passed = max((today - month_start).days + 1, 1)
    days_in_month = 30

    # Total expenses so far
    spent_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
    )
    total_spent = spent_result.scalar()

    # Total income so far
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "income", Transaction.date >= month_start)
    )
    total_income = income_result.scalar()

    # Monthly income from sources
    inc_result = await db.execute(select(IncomeSource).where(IncomeSource.is_active == True))
    monthly_income = sum(s.amount * INCOME_MULT.get(s.frequency, 1.0) for s in inc_result.scalars().all())

    # Remaining recurring expenses this month
    rec_result = await db.execute(
        select(func.coalesce(func.sum(RecurringExpense.amount), 0.0))
        .where(RecurringExpense.is_active == True, RecurringExpense.next_payment_date > today, RecurringExpense.next_payment_date <= date(today.year, today.month + 1 if today.month < 12 else 1, 1) if today.month < 12 else RecurringExpense.next_payment_date <= date(today.year + 1, 1, 1))
    )
    remaining_recurring = rec_result.scalar()

    daily_pace = total_spent / days_passed
    projected_spending = total_spent + (daily_pace * (days_in_month - days_passed)) + remaining_recurring
    projected_balance = monthly_income - projected_spending

    return {
        "daily_spending_pace": round(daily_pace, 2),
        "total_spent_so_far": round(total_spent, 2),
        "projected_total_spending": round(projected_spending, 2),
        "monthly_income": round(monthly_income, 2),
        "projected_end_balance": round(projected_balance, 2),
        "days_remaining": days_in_month - days_passed,
    }


@router.get("/burn-rate")
async def burn_rate(db: AsyncSession = Depends(get_db)):
    """
    Budget burn rate: pace of spending vs budget allocation.
    Compares expected spending pace (linear) to actual spending pace.
    """
    today = date.today()
    month_start = today.replace(day=1)
    days_passed = max((today - month_start).days + 1, 1)
    days_in_month = 30

    # Total budget
    budget_result = await db.execute(
        select(func.coalesce(func.sum(Category.budget_amount), 0.0)).where(Category.is_active == True)
    )
    total_budget = budget_result.scalar()

    # Total spent
    spent_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
    )
    total_spent = spent_result.scalar()

    expected_pct = (days_passed / days_in_month) * 100
    actual_pct = (total_spent / total_budget * 100) if total_budget > 0 else 0
    burn_status = "on_track" if actual_pct <= expected_pct + 5 else "ahead" if actual_pct <= expected_pct + 15 else "overspending"

    return {
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "days_passed": days_passed,
        "days_in_month": days_in_month,
        "expected_percentage": round(expected_pct, 1),
        "actual_percentage": round(actual_pct, 1),
        "status": burn_status,
    }
