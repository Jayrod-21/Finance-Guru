"""
Transaction ledger endpoints.
Supports CRUD operations with filtering and running balance calculation.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import (
    BalanceResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    data: TransactionCreate, db: AsyncSession = Depends(get_db)
):
    """Add a new transaction to the ledger."""
    transaction = Transaction(
        date=data.date,
        amount=data.amount,
        description=data.description or "",
        type=data.type.value,
        category_id=data.category_id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(db: AsyncSession = Depends(get_db)):
    """
    Calculate running balance across all transactions.
    Balance = total income - total expenses.
    """
    # Sum all income
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.type == "income"
        )
    )
    total_income = income_result.scalar()

    # Sum all expenses
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.type == "expense"
        )
    )
    total_expenses = expense_result.scalar()

    return BalanceResponse(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        balance=round(total_income - total_expenses, 2),
    )


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    date_start: Optional[date] = Query(None),
    date_end: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List transactions with optional filters.
    Supports filtering by date range, category, amount range, and type.
    """
    query = select(Transaction)

    # Apply filters conditionally
    if date_start:
        query = query.where(Transaction.date >= date_start)
    if date_end:
        query = query.where(Transaction.date <= date_end)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.where(Transaction.amount <= max_amount)
    if type is not None:
        query = query.where(Transaction.type == type)

    query = query.order_by(Transaction.date.desc(), Transaction.id.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int, data: TransactionUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an existing transaction."""
    transaction = await db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if data.date is not None:
        transaction.date = data.date
    if data.amount is not None:
        transaction.amount = data.amount
    if data.description is not None:
        transaction.description = data.description
    if data.type is not None:
        transaction.type = data.type.value
    if data.category_id is not None:
        transaction.category_id = data.category_id

    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: int, db: AsyncSession = Depends(get_db)
):
    """Delete a transaction from the ledger."""
    transaction = await db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()
