"""
Notification system endpoints.
Manages notification preferences and checks for active notification triggers.
Triggers: budget danger zones, upcoming bills, goal milestones, etc.
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.notification_pref import NotificationPref
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense
from app.models.goal import Goal

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# All supported trigger types
TRIGGER_TYPES = [
    "transaction_confirm",
    "budget_warning",       # 80% threshold
    "budget_exceeded",      # 100%+
    "upcoming_bill",        # 1-3 days before recurring expense
    "savings_conflict",     # Goals exceed surplus
    "goal_milestone",       # 25%, 50%, 75%, 100% milestones
]


class PrefUpdate(BaseModel):
    trigger_type: str
    is_enabled: bool


@router.get("/preferences")
async def get_preferences(db: AsyncSession = Depends(get_db)):
    """Get all notification preferences. Initializes defaults if not set."""
    result = await db.execute(select(NotificationPref))
    prefs = {p.trigger_type: p.is_enabled for p in result.scalars().all()}

    # Initialize any missing trigger types as enabled
    for tt in TRIGGER_TYPES:
        if tt not in prefs:
            pref = NotificationPref(trigger_type=tt, is_enabled=True)
            db.add(pref)
            prefs[tt] = True
    await db.commit()

    return [{"trigger_type": tt, "is_enabled": prefs.get(tt, True)} for tt in TRIGGER_TYPES]


@router.put("/preferences")
async def update_preference(data: PrefUpdate, db: AsyncSession = Depends(get_db)):
    """Update a specific notification preference."""
    result = await db.execute(
        select(NotificationPref).where(NotificationPref.trigger_type == data.trigger_type)
    )
    pref = result.scalar_one_or_none()
    if pref:
        pref.is_enabled = data.is_enabled
    else:
        db.add(NotificationPref(trigger_type=data.trigger_type, is_enabled=data.is_enabled))
    await db.commit()
    return {"status": "ok"}


@router.get("/active")
async def get_active_notifications(db: AsyncSession = Depends(get_db)):
    """
    Check all trigger conditions and return active notifications.
    Frontend polls this endpoint to show alerts.
    """
    today = date.today()
    month_start = today.replace(day=1)
    notifications = []

    # Load preferences
    pref_result = await db.execute(select(NotificationPref))
    prefs = {p.trigger_type: p.is_enabled for p in pref_result.scalars().all()}

    # --- Budget warnings (80%+) and exceeded (100%+) ---
    if prefs.get("budget_warning", True) or prefs.get("budget_exceeded", True):
        cats = await db.execute(select(Category).where(Category.is_active == True, Category.budget_amount > 0))
        for cat in cats.scalars().all():
            spent_result = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0.0))
                .where(Transaction.type == "expense", Transaction.category_id == cat.id, Transaction.date >= month_start)
            )
            spent = spent_result.scalar()
            pct = (spent / cat.budget_amount) * 100 if cat.budget_amount > 0 else 0

            if pct >= 100 and prefs.get("budget_exceeded", True):
                notifications.append({"type": "budget_exceeded", "severity": "critical", "message": f"{cat.name} budget exceeded! ${spent:.2f} / ${cat.budget_amount:.2f} ({pct:.0f}%)"})
            elif pct >= 80 and prefs.get("budget_warning", True):
                notifications.append({"type": "budget_warning", "severity": "warning", "message": f"{cat.name} at {pct:.0f}% of budget (${spent:.2f} / ${cat.budget_amount:.2f})"})

    # --- Upcoming bills (1-3 days) ---
    if prefs.get("upcoming_bill", True):
        upcoming_result = await db.execute(
            select(RecurringExpense).where(
                RecurringExpense.is_active == True,
                RecurringExpense.next_payment_date >= today,
                RecurringExpense.next_payment_date <= today + timedelta(days=3),
            )
        )
        for bill in upcoming_result.scalars().all():
            days_until = (bill.next_payment_date - today).days
            notifications.append({
                "type": "upcoming_bill",
                "severity": "info",
                "message": f"{bill.name} (${bill.amount:.2f}) due in {days_until} day{'s' if days_until != 1 else ''}"
            })

    # --- Goal milestones ---
    if prefs.get("goal_milestone", True):
        goal_result = await db.execute(select(Goal).where(Goal.is_active == True))
        for goal in goal_result.scalars().all():
            if goal.target_amount > 0:
                pct = (goal.current_amount / goal.target_amount) * 100
                for milestone in [100, 75, 50, 25]:
                    if pct >= milestone:
                        notifications.append({
                            "type": "goal_milestone",
                            "severity": "success" if milestone == 100 else "info",
                            "message": f"Goal '{goal.name}' reached {milestone}%!" if milestone == 100 else f"Goal '{goal.name}' is {pct:.0f}% complete"
                        })
                        break

    return notifications
