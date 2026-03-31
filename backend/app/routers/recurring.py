"""
Recurring expenses endpoints.
Tracks fixed recurring payments with billing cycle support.
Auto-calculates monthly cost for non-monthly billing cycles.
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.recurring_expense import RecurringExpense
from app.schemas.recurring_expense import (
    RecurringExpenseCreate,
    RecurringExpenseResponse,
    RecurringExpenseUpdate,
)

router = APIRouter(prefix="/api/recurring", tags=["recurring"])

# Multipliers to convert billing cycle amounts to monthly cost
MONTHLY_MULTIPLIERS = {
    "weekly": 52 / 12,
    "monthly": 1.0,
    "quarterly": 1 / 3,
    "annual": 1 / 12,
}


def _to_response(expense: RecurringExpense) -> RecurringExpenseResponse:
    """Convert a RecurringExpense model to a response with calculated monthly cost."""
    multiplier = MONTHLY_MULTIPLIERS.get(expense.billing_cycle, 1.0)
    return RecurringExpenseResponse(
        id=expense.id,
        name=expense.name,
        amount=expense.amount,
        category_id=expense.category_id,
        billing_cycle=expense.billing_cycle,
        next_payment_date=expense.next_payment_date,
        is_active=expense.is_active,
        monthly_cost=round(expense.amount * multiplier, 2),
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.post("", response_model=RecurringExpenseResponse, status_code=201)
async def create_recurring(data: RecurringExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Add a new recurring expense."""
    expense = RecurringExpense(
        name=data.name,
        amount=data.amount,
        category_id=data.category_id,
        billing_cycle=data.billing_cycle.value,
        next_payment_date=data.next_payment_date,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return _to_response(expense)


@router.get("", response_model=list[RecurringExpenseResponse])
async def list_recurring(db: AsyncSession = Depends(get_db)):
    """List all active recurring expenses with next payment dates."""
    result = await db.execute(
        select(RecurringExpense)
        .where(RecurringExpense.is_active == True)
        .order_by(RecurringExpense.next_payment_date)
    )
    return [_to_response(e) for e in result.scalars().all()]


@router.get("/upcoming", response_model=list[RecurringExpenseResponse])
async def upcoming_payments(db: AsyncSession = Depends(get_db)):
    """Get recurring expenses due in the next 30 days."""
    today = date.today()
    cutoff = today + timedelta(days=30)
    result = await db.execute(
        select(RecurringExpense)
        .where(
            RecurringExpense.is_active == True,
            RecurringExpense.next_payment_date >= today,
            RecurringExpense.next_payment_date <= cutoff,
        )
        .order_by(RecurringExpense.next_payment_date)
    )
    return [_to_response(e) for e in result.scalars().all()]


@router.put("/{expense_id}", response_model=RecurringExpenseResponse)
async def update_recurring(
    expense_id: int, data: RecurringExpenseUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a recurring expense."""
    expense = await db.get(RecurringExpense, expense_id)
    if not expense or not expense.is_active:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    if data.name is not None:
        expense.name = data.name
    if data.amount is not None:
        expense.amount = data.amount
    if data.category_id is not None:
        expense.category_id = data.category_id
    if data.billing_cycle is not None:
        expense.billing_cycle = data.billing_cycle.value
    if data.next_payment_date is not None:
        expense.next_payment_date = data.next_payment_date
    if data.is_active is not None:
        expense.is_active = data.is_active

    await db.commit()
    await db.refresh(expense)
    return _to_response(expense)


@router.delete("/{expense_id}", status_code=204)
async def delete_recurring(expense_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a recurring expense."""
    expense = await db.get(RecurringExpense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    await db.delete(expense)
    await db.commit()
