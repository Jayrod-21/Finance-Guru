"""
Category management endpoints.
Categories are user-created from a blank slate — no presets.
Soft-delete preserves categories referenced by historical transactions.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    """Create a new spending category."""
    category = Category(name=data.name, budget_amount=data.budget_amount or 0.0)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all active categories."""
    result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.name)
    )
    return result.scalars().all()


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a category's name or budget amount."""
    category = await db.get(Category, category_id)
    if not category or not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.name is not None:
        category.name = data.name
    if data.budget_amount is not None:
        category.budget_amount = data.budget_amount

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """Soft-delete a category (set is_active = false) to preserve historical data."""
    category = await db.get(Category, category_id)
    if not category or not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")

    category.is_active = False
    await db.commit()
