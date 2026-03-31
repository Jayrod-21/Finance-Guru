"""
Integration tests — full flows from transaction entry through budget updates and analytics.
Verifies that creating transactions correctly propagates to budget calculations,
analytics endpoints, and notification triggers.
"""
import pytest
from datetime import date


@pytest.mark.asyncio
async def test_transaction_to_budget_flow(client):
    """
    Full flow: create category with budget → add expenses → verify budget overview
    shows correct spent/remaining amounts and correct danger zone status.
    """
    # Create category with $200 budget
    cat = await client.post("/api/categories", json={"name": "Food", "budget_amount": 200})
    cat_id = cat.json()["id"]
    today = date.today().isoformat()

    # Add several expense transactions
    await client.post("/api/transactions", json={"date": today, "amount": 50, "type": "expense", "category_id": cat_id, "description": "Groceries"})
    await client.post("/api/transactions", json={"date": today, "amount": 30, "type": "expense", "category_id": cat_id, "description": "Takeout"})
    await client.post("/api/transactions", json={"date": today, "amount": 90, "type": "expense", "category_id": cat_id, "description": "Costco"})

    # Check budget overview — should be at 85% (warning zone)
    budget = await client.get("/api/budgets/overview")
    data = budget.json()
    assert data["total_budget"] == 200.0
    assert data["total_spent"] == 170.0
    assert data["total_remaining"] == 30.0

    cat_budget = data["categories"][0]
    assert cat_budget["spent_this_month"] == 170.0
    assert cat_budget["percentage_used"] == 85.0
    assert cat_budget["status"] == "warning"

    # Check danger zones — should appear
    danger = await client.get("/api/budgets/danger-zones")
    assert len(danger.json()["danger_zones"]) == 1


@pytest.mark.asyncio
async def test_transaction_to_analytics_flow(client):
    """
    Full flow: create categories and transactions → verify analytics endpoints
    return correct top categories and frequency data.
    """
    today = date.today().isoformat()

    # Create two categories
    food = await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    coffee = await client.post("/api/categories", json={"name": "Coffee", "budget_amount": 100})
    food_id = food.json()["id"]
    coffee_id = coffee.json()["id"]

    # Add transactions — food has higher total, coffee has higher frequency
    await client.post("/api/transactions", json={"date": today, "amount": 120, "type": "expense", "category_id": food_id, "description": "Whole Foods"})
    await client.post("/api/transactions", json={"date": today, "amount": 85, "type": "expense", "category_id": food_id, "description": "Trader Joes"})

    for i in range(5):
        await client.post("/api/transactions", json={"date": today, "amount": 5.50, "type": "expense", "category_id": coffee_id, "description": f"Starbucks #{i+1}"})

    # Top categories by total — Food should be first ($205 > $27.50)
    top = await client.get("/api/analytics/top-categories")
    assert len(top.json()) == 2
    assert top.json()[0]["category_name"] == "Food"
    assert top.json()[0]["total"] == 205.0

    # Frequency — Coffee should be first (5 transactions > 2)
    freq = await client.get("/api/analytics/frequency")
    assert freq.json()[0]["category_name"] == "Coffee"
    assert freq.json()[0]["count"] == 5
    assert freq.json()[0]["average"] == 5.5

    # Largest — should be the $120 Whole Foods purchase
    largest = await client.get("/api/analytics/largest")
    assert largest.json()[0]["amount"] == 120.0
    assert largest.json()[0]["description"] == "Whole Foods"


@pytest.mark.asyncio
async def test_income_to_feasibility_flow(client):
    """
    Full flow: add income → add recurring expenses → add goal → verify
    feasibility correctly determines if goals are affordable.
    """
    deadline = "2027-03-31"

    # Add income: $5000/month
    await client.post("/api/income", json={"name": "Salary", "amount": 5000, "frequency": "monthly"})

    # Add recurring expenses: $2500/month total
    await client.post("/api/recurring", json={"name": "Rent", "amount": 1500, "billing_cycle": "monthly"})
    await client.post("/api/recurring", json={"name": "Utilities", "amount": 200, "billing_cycle": "monthly"})
    await client.post("/api/recurring", json={"name": "Insurance", "amount": 2400, "billing_cycle": "annual"})  # $200/mo
    await client.post("/api/recurring", json={"name": "Subscriptions", "amount": 600, "billing_cycle": "annual"})  # $50/mo

    # Add some expense transactions this month
    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 500, "type": "expense"})
    await client.post("/api/transactions", json={"date": today, "amount": 300, "type": "expense"})

    # Add a savings goal needing ~$625/mo (7500 over 12 months)
    await client.post("/api/goals", json={
        "name": "Emergency Fund", "type": "savings",
        "target_amount": 7500, "current_amount": 0, "deadline": deadline,
    })

    # Check feasibility
    resp = await client.get("/api/goals/feasibility")
    data = resp.json()

    assert data["monthly_income"] == 5000.0
    # Recurring: 1500 + 200 + (2400/12) + (600/12) = 1500 + 200 + 200 + 50 = 1950
    assert data["monthly_recurring"] == 1950.0
    assert data["monthly_expenses"] == 800.0
    # Surplus = 5000 - 1950 - 800 = 2250. Goal needs ~625/mo. Should be feasible.
    assert data["monthly_surplus"] == 2250.0
    assert data["is_feasible"] is True


@pytest.mark.asyncio
async def test_balance_reflects_all_operations(client):
    """
    Balance should correctly update after adding, editing, and deleting transactions.
    """
    # Start with an income entry
    inc = await client.post("/api/transactions", json={"date": "2026-03-01", "amount": 5000, "type": "income"})
    inc_id = inc.json()["id"]

    # Add two expenses
    exp1 = await client.post("/api/transactions", json={"date": "2026-03-02", "amount": 200, "type": "expense"})
    exp2 = await client.post("/api/transactions", json={"date": "2026-03-03", "amount": 300, "type": "expense"})
    exp1_id = exp1.json()["id"]
    exp2_id = exp2.json()["id"]

    # Balance should be 5000 - 200 - 300 = 4500
    bal = await client.get("/api/transactions/balance")
    assert bal.json()["balance"] == 4500.0

    # Edit expense1 to be larger
    await client.put(f"/api/transactions/{exp1_id}", json={"amount": 500})

    # Balance should be 5000 - 500 - 300 = 4200
    bal = await client.get("/api/transactions/balance")
    assert bal.json()["balance"] == 4200.0

    # Delete expense2
    await client.delete(f"/api/transactions/{exp2_id}")

    # Balance should be 5000 - 500 = 4500
    bal = await client.get("/api/transactions/balance")
    assert bal.json()["balance"] == 4500.0


@pytest.mark.asyncio
async def test_notification_triggers(client):
    """
    Notifications should fire for budget warnings and goal milestones.
    """
    today = date.today().isoformat()

    # Create category with low budget, then overspend
    cat = await client.post("/api/categories", json={"name": "Coffee", "budget_amount": 50})
    cat_id = cat.json()["id"]

    await client.post("/api/transactions", json={"date": today, "amount": 55, "type": "expense", "category_id": cat_id})

    # Create a goal that's 75% complete
    await client.post("/api/goals", json={
        "name": "Save $1000", "type": "savings",
        "target_amount": 1000, "current_amount": 750,
    })

    # Check notifications
    resp = await client.get("/api/notifications/active")
    notifications = resp.json()

    # Should have budget exceeded + goal milestone
    types = [n["type"] for n in notifications]
    assert "budget_exceeded" in types
    assert "goal_milestone" in types
