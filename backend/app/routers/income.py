"""
Income management endpoints.
Supports multiple income sources with variable frequency.
Calculates total monthly income normalizing across different pay frequencies.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.income_source import IncomeSource
from app.schemas.income_source import (
    IncomeSourceCreate,
    IncomeSourceResponse,
    IncomeSourceUpdate,
    MonthlyIncomeResponse,
)

router = APIRouter(prefix="/api/income", tags=["income"])

# Multipliers to normalize income amounts to monthly
MONTHLY_MULTIPLIERS = {
    "weekly": 52 / 12,
    "biweekly": 26 / 12,
    "monthly": 1.0,
    "irregular": 1.0,  # Irregular income is entered as-is (assumed monthly estimate)
}


def _to_response(source: IncomeSource) -> IncomeSourceResponse:
    """Convert an IncomeSource model to a response with calculated monthly amount."""
    multiplier = MONTHLY_MULTIPLIERS.get(source.frequency, 1.0)
    return IncomeSourceResponse(
        id=source.id,
        name=source.name,
        amount=source.amount,
        frequency=source.frequency,
        is_variable=source.is_variable,
        is_active=source.is_active,
        monthly_amount=round(source.amount * multiplier, 2),
        created_at=source.created_at,
        updated_at=source.updated_at,
    )


@router.post("", response_model=IncomeSourceResponse, status_code=201)
async def create_income(data: IncomeSourceCreate, db: AsyncSession = Depends(get_db)):
    """Add a new income source."""
    source = IncomeSource(
        name=data.name,
        amount=data.amount,
        frequency=data.frequency.value,
        is_variable=data.is_variable,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return _to_response(source)


@router.get("", response_model=list[IncomeSourceResponse])
async def list_income(db: AsyncSession = Depends(get_db)):
    """List all active income sources."""
    result = await db.execute(
        select(IncomeSource)
        .where(IncomeSource.is_active == True)
        .order_by(IncomeSource.name)
    )
    return [_to_response(s) for s in result.scalars().all()]


@router.get("/monthly", response_model=MonthlyIncomeResponse)
async def monthly_income(db: AsyncSession = Depends(get_db)):
    """
    Calculate total monthly income across all active sources.
    Bi-weekly: amount x 26 / 12. Weekly: amount x 52 / 12.
    """
    result = await db.execute(
        select(IncomeSource).where(IncomeSource.is_active == True)
    )
    sources = result.scalars().all()
    responses = [_to_response(s) for s in sources]
    total = round(sum(r.monthly_amount for r in responses), 2)

    return MonthlyIncomeResponse(total_monthly_income=total, sources=responses)


@router.put("/{source_id}", response_model=IncomeSourceResponse)
async def update_income(
    source_id: int, data: IncomeSourceUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an income source."""
    source = await db.get(IncomeSource, source_id)
    if not source or not source.is_active:
        raise HTTPException(status_code=404, detail="Income source not found")

    if data.name is not None:
        source.name = data.name
    if data.amount is not None:
        source.amount = data.amount
    if data.frequency is not None:
        source.frequency = data.frequency.value
    if data.is_variable is not None:
        source.is_variable = data.is_variable
    if data.is_active is not None:
        source.is_active = data.is_active

    await db.commit()
    await db.refresh(source)
    return _to_response(source)


@router.delete("/{source_id}", status_code=204)
async def delete_income(source_id: int, db: AsyncSession = Depends(get_db)):
    """Remove an income source."""
    source = await db.get(IncomeSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Income source not found")

    await db.delete(source)
    await db.commit()
