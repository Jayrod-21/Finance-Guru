"""
Builds the financial context string injected into the AI system prompt.
Gathers current month's data: income, expenses by category, budgets,
goals, debts, and recurring expenses. Summarizes last 3 months if data is large.
"""
from datetime import date, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.models.income_source import IncomeSource
from app.models.recurring_expense import RecurringExpense
from app.models.goal import Goal
from app.models.debt import Debt

INCOME_MULTIPLIERS = {"weekly": 52 / 12, "biweekly": 26 / 12, "monthly": 1.0, "irregular": 1.0}
EXPENSE_MULTIPLIERS = {"weekly": 52 / 12, "monthly": 1.0, "quarterly": 1 / 3, "annual": 1 / 12}


async def build_financial_context(db: AsyncSession) -> str:
    """Build a structured text summary of the user's financial state."""
    today = date.today()
    month_start = today.replace(day=1)
    three_months_ago = (month_start - timedelta(days=90)).replace(day=1)

    sections = []

    # --- Income sources ---
    inc_result = await db.execute(select(IncomeSource).where(IncomeSource.is_active == True))
    sources = inc_result.scalars().all()
    total_monthly_income = sum(s.amount * INCOME_MULTIPLIERS.get(s.frequency, 1.0) for s in sources)
    income_lines = [f"  - {s.name}: ${s.amount:.2f}/{s.frequency} (${s.amount * INCOME_MULTIPLIERS.get(s.frequency, 1.0):.2f}/mo)" for s in sources]
    sections.append(f"MONTHLY INCOME: ${total_monthly_income:.2f}\n" + "\n".join(income_lines) if income_lines else f"MONTHLY INCOME: ${total_monthly_income:.2f} (no sources set)")

    # --- Recurring expenses ---
    rec_result = await db.execute(select(RecurringExpense).where(RecurringExpense.is_active == True))
    recurring = rec_result.scalars().all()
    total_recurring = sum(e.amount * EXPENSE_MULTIPLIERS.get(e.billing_cycle, 1.0) for e in recurring)
    rec_lines = [f"  - {e.name}: ${e.amount:.2f}/{e.billing_cycle} (${e.amount * EXPENSE_MULTIPLIERS.get(e.billing_cycle, 1.0):.2f}/mo)" for e in recurring]
    sections.append(f"MONTHLY RECURRING EXPENSES: ${total_recurring:.2f}\n" + "\n".join(rec_lines) if rec_lines else f"MONTHLY RECURRING EXPENSES: $0.00")

    # --- Categories & budgets ---
    cat_result = await db.execute(select(Category).where(Category.is_active == True))
    categories = cat_result.scalars().all()
    cat_map = {c.id: c for c in categories}

    spent_result = await db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount))
        .where(Transaction.type == "expense", Transaction.date >= month_start)
        .group_by(Transaction.category_id)
    )
    spent_map = {row[0]: row[1] for row in spent_result.all()}

    budget_lines = []
    for c in categories:
        spent = spent_map.get(c.id, 0)
        budget_lines.append(f"  - {c.name}: budget ${c.budget_amount:.2f}, spent ${spent:.2f}, remaining ${c.budget_amount - spent:.2f}")
    sections.append("CATEGORY BUDGETS (this month):\n" + "\n".join(budget_lines) if budget_lines else "CATEGORY BUDGETS: No categories set")

    # --- Current month transactions (last 50 for context) ---
    tx_result = await db.execute(
        select(Transaction)
        .where(Transaction.date >= month_start)
        .order_by(Transaction.date.desc())
        .limit(50)
    )
    txns = tx_result.scalars().all()
    tx_lines = [f"  - {t.date} | {t.type} | ${t.amount:.2f} | {cat_map.get(t.category_id, type('', (), {'name': 'Uncategorized'})()).name} | {t.description}" for t in txns]
    sections.append(f"RECENT TRANSACTIONS (this month, last 50):\n" + "\n".join(tx_lines) if tx_lines else "RECENT TRANSACTIONS: None this month")

    # --- 3 month summary ---
    summary_result = await db.execute(
        select(
            func.strftime("%Y-%m", Transaction.date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount)
        )
        .where(Transaction.date >= three_months_ago, Transaction.date < month_start)
        .group_by("month", Transaction.type)
    )
    month_data = {}
    for row in summary_result.all():
        month_data.setdefault(row[0], {})[row[1]] = row[2]
    if month_data:
        summary_lines = [f"  - {m}: income ${d.get('income', 0):.2f}, expenses ${d.get('expense', 0):.2f}" for m, d in sorted(month_data.items())]
        sections.append("LAST 3 MONTHS SUMMARY:\n" + "\n".join(summary_lines))

    # --- Goals ---
    goal_result = await db.execute(select(Goal).where(Goal.is_active == True))
    goals = goal_result.scalars().all()
    if goals:
        goal_lines = [f"  - {g.name} ({g.type}): ${g.current_amount:.2f} / ${g.target_amount:.2f} ({g.current_amount/g.target_amount*100:.1f}%){' deadline: ' + str(g.deadline) if g.deadline else ''}" for g in goals]
        sections.append("FINANCIAL GOALS:\n" + "\n".join(goal_lines))

    # --- Debts ---
    debt_result = await db.execute(select(Debt))
    debts = debt_result.scalars().all()
    if debts:
        debt_lines = [f"  - {d.name}: balance ${d.balance:.2f}, rate {d.interest_rate:.2f}%, min payment ${d.minimum_payment:.2f}" for d in debts]
        sections.append("DEBTS:\n" + "\n".join(debt_lines))

    # --- Net summary ---
    total_expenses_month = sum(spent_map.values())
    surplus = total_monthly_income - total_recurring - total_expenses_month
    sections.append(f"NET SUMMARY:\n  Monthly income: ${total_monthly_income:.2f}\n  Monthly recurring: ${total_recurring:.2f}\n  This month's spending: ${total_expenses_month:.2f}\n  Estimated surplus: ${surplus:.2f}")

    return "\n\n".join(sections)
