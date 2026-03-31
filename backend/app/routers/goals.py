"""
Financial goals endpoints.
Tracks progress toward savings/debt/custom goals with feasibility assessment.
Feasibility checks whether the user's budget surplus supports their goal contributions.
"""
from datetime import date
import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.goal import Goal
from app.models.income_source import IncomeSource
from app.models.recurring_expense import RecurringExpense
from app.models.transaction import Transaction
from app.schemas.goal import FeasibilityResponse, GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/api/goals", tags=["goals"])

# Income frequency multipliers (same as income router)
INCOME_MULTIPLIERS = {"weekly": 52 / 12, "biweekly": 26 / 12, "monthly": 1.0, "irregular": 1.0}
EXPENSE_MULTIPLIERS = {"weekly": 52 / 12, "monthly": 1.0, "quarterly": 1 / 3, "annual": 1 / 12}


def _to_response(goal: Goal) -> GoalResponse:
    """Convert a Goal model to a response with calculated progress metrics."""
    progress = round((goal.current_amount / goal.target_amount) * 100, 2) if goal.target_amount > 0 else 0.0

    days_remaining = None
    monthly_needed = None
    if goal.deadline:
        delta = goal.deadline - date.today()
        days_remaining = max(delta.days, 0)
        months_left = max(delta.days / 30.44, 0.1)  # Avoid division by zero
        remaining_amount = max(goal.target_amount - goal.current_amount, 0)
        monthly_needed = round(remaining_amount / months_left, 2)

    return GoalResponse(
        id=goal.id,
        name=goal.name,
        type=goal.type,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        deadline=goal.deadline,
        is_active=goal.is_active,
        linked_debt_id=goal.linked_debt_id,
        progress_percentage=progress,
        days_remaining=days_remaining,
        monthly_contribution_needed=monthly_needed,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(data: GoalCreate, db: AsyncSession = Depends(get_db)):
    """Create a new financial goal."""
    goal = Goal(
        name=data.name,
        type=data.type.value,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
        linked_debt_id=data.linked_debt_id,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return _to_response(goal)


@router.get("", response_model=list[GoalResponse])
async def list_goals(db: AsyncSession = Depends(get_db)):
    """List all active goals with progress calculations."""
    result = await db.execute(
        select(Goal).where(Goal.is_active == True).order_by(Goal.deadline)
    )
    return [_to_response(g) for g in result.scalars().all()]


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: int, data: GoalUpdate, db: AsyncSession = Depends(get_db)):
    """Update a goal's progress or details."""
    goal = await db.get(Goal, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.name is not None:
        goal.name = data.name
    if data.type is not None:
        goal.type = data.type.value
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.deadline is not None:
        goal.deadline = data.deadline
    if data.linked_debt_id is not None:
        goal.linked_debt_id = data.linked_debt_id
    if data.is_active is not None:
        goal.is_active = data.is_active

    await db.commit()
    await db.refresh(goal)
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a goal."""
    goal = await db.get(Goal, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()


@router.get("/feasibility", response_model=FeasibilityResponse)
async def check_feasibility(db: AsyncSession = Depends(get_db)):
    """
    Check if current budget surplus supports all active savings goals.
    Surplus = monthly income - monthly recurring - avg monthly expenses.
    If surplus < total required monthly goal contributions, returns a warning.
    """
    today = date.today()
    month_start = today.replace(day=1)

    # Calculate total monthly income
    inc_result = await db.execute(select(IncomeSource).where(IncomeSource.is_active == True))
    total_income = sum(
        s.amount * INCOME_MULTIPLIERS.get(s.frequency, 1.0)
        for s in inc_result.scalars().all()
    )

    # Calculate total monthly recurring expenses
    rec_result = await db.execute(select(RecurringExpense).where(RecurringExpense.is_active == True))
    total_recurring = sum(
        e.amount * EXPENSE_MULTIPLIERS.get(e.billing_cycle, 1.0)
        for e in rec_result.scalars().all()
    )

    # Calculate this month's non-recurring expenses
    exp_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.type == "expense",
            Transaction.date >= month_start,
            Transaction.date <= today,
        )
    )
    monthly_expenses = exp_result.scalar()

    # Calculate total monthly goal contributions needed
    goals_result = await db.execute(select(Goal).where(Goal.is_active == True))
    goals = goals_result.scalars().all()
    total_goal_monthly = sum(
        _to_response(g).monthly_contribution_needed or 0.0 for g in goals
    )

    surplus = round(total_income - total_recurring - monthly_expenses, 2)
    deficit = round(max(total_goal_monthly - surplus, 0), 2)

    return FeasibilityResponse(
        monthly_income=round(total_income, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_recurring=round(total_recurring, 2),
        monthly_surplus=surplus,
        total_monthly_goal_contributions=round(total_goal_monthly, 2),
        is_feasible=surplus >= total_goal_monthly,
        deficit=deficit,
    )
