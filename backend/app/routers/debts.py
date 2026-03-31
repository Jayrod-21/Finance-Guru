"""
Debt tracking endpoints.
Calculates monthly interest, payoff projections, and links to goals.
"""
import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.debt import Debt
from app.schemas.debt import DebtCreate, DebtResponse, DebtUpdate

router = APIRouter(prefix="/api/debts", tags=["debts"])


def _calc_payoff(balance: float, rate: float, payment: float) -> tuple[int | None, float | None]:
    """
    Calculate months to payoff and total interest cost.
    Uses standard amortization formula. Returns (None, None) if payment
    doesn't cover monthly interest (debt will never be paid off).
    """
    if balance <= 0 or payment <= 0:
        return None, None

    monthly_rate = rate / 100 / 12

    # No interest — simple division
    if monthly_rate == 0:
        months = math.ceil(balance / payment)
        return months, 0.0

    # Check if payment covers at least monthly interest
    monthly_interest = balance * monthly_rate
    if payment <= monthly_interest:
        return None, None

    # Amortization: n = -log(1 - r*PV/PMT) / log(1+r)
    months = math.ceil(-math.log(1 - monthly_rate * balance / payment) / math.log(1 + monthly_rate))
    total_paid = payment * months
    total_interest = round(total_paid - balance, 2)
    return months, total_interest


def _to_response(debt: Debt) -> DebtResponse:
    """Convert a Debt model to a response with calculated projections."""
    monthly_interest = round(debt.balance * (debt.interest_rate / 100 / 12), 2)
    months, total_interest = _calc_payoff(debt.balance, debt.interest_rate, debt.minimum_payment)

    return DebtResponse(
        id=debt.id,
        name=debt.name,
        balance=debt.balance,
        interest_rate=debt.interest_rate,
        minimum_payment=debt.minimum_payment,
        linked_goal_id=debt.linked_goal_id,
        monthly_interest=monthly_interest,
        payoff_months=months,
        total_interest_cost=total_interest,
        created_at=debt.created_at,
        updated_at=debt.updated_at,
    )


@router.post("", response_model=DebtResponse, status_code=201)
async def create_debt(data: DebtCreate, db: AsyncSession = Depends(get_db)):
    """Add a new debt."""
    debt = Debt(
        name=data.name,
        balance=data.balance,
        interest_rate=data.interest_rate,
        minimum_payment=data.minimum_payment,
    )
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    return _to_response(debt)


@router.get("", response_model=list[DebtResponse])
async def list_debts(db: AsyncSession = Depends(get_db)):
    """List all debts with payoff projections."""
    result = await db.execute(select(Debt).order_by(Debt.balance.desc()))
    return [_to_response(d) for d in result.scalars().all()]


@router.put("/{debt_id}", response_model=DebtResponse)
async def update_debt(debt_id: int, data: DebtUpdate, db: AsyncSession = Depends(get_db)):
    """Update a debt's balance or payment info."""
    debt = await db.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    if data.name is not None:
        debt.name = data.name
    if data.balance is not None:
        debt.balance = data.balance
    if data.interest_rate is not None:
        debt.interest_rate = data.interest_rate
    if data.minimum_payment is not None:
        debt.minimum_payment = data.minimum_payment

    await db.commit()
    await db.refresh(debt)
    return _to_response(debt)


@router.delete("/{debt_id}", status_code=204)
async def delete_debt(debt_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a debt."""
    debt = await db.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    await db.delete(debt)
    await db.commit()
