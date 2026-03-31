"""
Development seed script — populates the database with realistic sample data.
Run with: python -m app.seed
Creates categories, transactions, recurring expenses, income sources, goals, and debts.
"""
import asyncio
from datetime import date, timedelta
import random

from app.database import engine, async_session, Base
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense
from app.models.income_source import IncomeSource
from app.models.goal import Goal
from app.models.debt import Debt


async def seed():
    """Populate the database with sample data for development and demos."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count = await db.execute(select(func.count()).select_from(Category))
        if count.scalar() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database with sample data...")

        # --- Categories ---
        categories = [
            Category(name="Groceries", budget_amount=600),
            Category(name="Dining Out", budget_amount=300),
            Category(name="Transportation", budget_amount=200),
            Category(name="Entertainment", budget_amount=150),
            Category(name="Utilities", budget_amount=250),
            Category(name="Shopping", budget_amount=200),
            Category(name="Health", budget_amount=100),
            Category(name="Coffee", budget_amount=80),
        ]
        db.add_all(categories)
        await db.flush()
        print(f"  Created {len(categories)} categories")

        cat_map = {c.name: c.id for c in categories}

        # --- Transactions (last 3 months) ---
        today = date.today()
        transactions = []

        # Income transactions
        for month_offset in range(3):
            pay_date = today.replace(day=1) - timedelta(days=30 * month_offset)
            transactions.append(Transaction(date=pay_date.replace(day=1), amount=3200, description="Paycheck", type="income"))
            transactions.append(Transaction(date=pay_date.replace(day=15), amount=3200, description="Paycheck", type="income"))

        # Expense transactions — realistic variety
        expense_templates = [
            ("Groceries", ["Whole Foods", "Trader Joe's", "Costco run", "Weekly groceries", "Farmers market"]),
            ("Dining Out", ["Chipotle", "Pizza night", "Thai takeout", "Sushi dinner", "Brunch with friends", "Coffee shop lunch"]),
            ("Transportation", ["Gas station", "Uber ride", "Parking", "Car wash", "Bus pass"]),
            ("Entertainment", ["Netflix", "Movie tickets", "Concert tickets", "Bowling night", "Book purchase"]),
            ("Utilities", ["Electric bill", "Water bill", "Internet", "Phone bill"]),
            ("Shopping", ["Amazon order", "New shoes", "Target run", "Gift for friend", "Clothing"]),
            ("Health", ["Pharmacy", "Gym membership", "Doctor copay", "Vitamins"]),
            ("Coffee", ["Starbucks", "Local cafe", "Morning coffee", "Afternoon latte", "Espresso"]),
        ]

        for month_offset in range(3):
            month_start = today.replace(day=1) - timedelta(days=30 * month_offset)
            for cat_name, descriptions in expense_templates:
                # Generate 3-8 transactions per category per month
                num_txns = random.randint(3, 8) if cat_name in ["Groceries", "Coffee", "Dining Out"] else random.randint(1, 4)
                for _ in range(num_txns):
                    day = random.randint(1, 28)
                    tx_date = month_start.replace(day=day)
                    if tx_date > today:
                        continue
                    amount_ranges = {
                        "Groceries": (25, 120), "Dining Out": (12, 65), "Transportation": (8, 55),
                        "Entertainment": (10, 50), "Utilities": (40, 100), "Shopping": (15, 80),
                        "Health": (10, 60), "Coffee": (4, 8),
                    }
                    low, high = amount_ranges.get(cat_name, (10, 50))
                    amount = round(random.uniform(low, high), 2)
                    desc = random.choice(descriptions)
                    transactions.append(Transaction(
                        date=tx_date, amount=amount, description=desc,
                        type="expense", category_id=cat_map[cat_name],
                    ))

        db.add_all(transactions)
        print(f"  Created {len(transactions)} transactions")

        # --- Recurring Expenses ---
        recurring = [
            RecurringExpense(name="Rent", amount=1400, billing_cycle="monthly", next_payment_date=today.replace(day=1) + timedelta(days=32), category_id=None),
            RecurringExpense(name="Car Insurance", amount=480, billing_cycle="quarterly", next_payment_date=today + timedelta(days=45)),
            RecurringExpense(name="Netflix", amount=15.99, billing_cycle="monthly", next_payment_date=today + timedelta(days=12), category_id=cat_map["Entertainment"]),
            RecurringExpense(name="Spotify", amount=10.99, billing_cycle="monthly", next_payment_date=today + timedelta(days=8), category_id=cat_map["Entertainment"]),
            RecurringExpense(name="Gym", amount=45, billing_cycle="monthly", next_payment_date=today + timedelta(days=5), category_id=cat_map["Health"]),
            RecurringExpense(name="Phone Plan", amount=65, billing_cycle="monthly", next_payment_date=today + timedelta(days=18), category_id=cat_map["Utilities"]),
            RecurringExpense(name="Renter's Insurance", amount=180, billing_cycle="annual", next_payment_date=today + timedelta(days=120)),
        ]
        db.add_all(recurring)
        print(f"  Created {len(recurring)} recurring expenses")

        # --- Income Sources ---
        income_sources = [
            IncomeSource(name="Day Job", amount=3200, frequency="biweekly", is_variable=False),
            IncomeSource(name="Freelance Design", amount=800, frequency="monthly", is_variable=True),
        ]
        db.add_all(income_sources)
        print(f"  Created {len(income_sources)} income sources")

        # --- Goals ---
        goals = [
            Goal(name="Emergency Fund", type="savings", target_amount=10000, current_amount=3500, deadline=today + timedelta(days=365)),
            Goal(name="Vacation Fund", type="savings", target_amount=3000, current_amount=800, deadline=today + timedelta(days=180)),
            Goal(name="Pay Off Credit Card", type="debt_payoff", target_amount=4200, current_amount=1800, deadline=today + timedelta(days=270)),
        ]
        db.add_all(goals)
        print(f"  Created {len(goals)} goals")

        # --- Debts ---
        debts = [
            Debt(name="Credit Card", balance=4200, interest_rate=19.99, minimum_payment=120),
            Debt(name="Student Loan", balance=15000, interest_rate=5.5, minimum_payment=280),
            Debt(name="Car Loan", balance=8500, interest_rate=4.2, minimum_payment=350),
        ]
        db.add_all(debts)
        print(f"  Created {len(debts)} debts")

        await db.commit()
        print("\nSeed complete! Start the app and explore the data.")


if __name__ == "__main__":
    asyncio.run(seed())
