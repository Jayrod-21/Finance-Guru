"""
Tests for the budget system API.
Covers budget overview calculations and danger zone detection.
"""
import pytest
from datetime import date


@pytest.mark.asyncio
async def test_budget_overview_empty(client):
    """Empty budget overview should return zero totals."""
    resp = await client.get("/api/budgets/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_budget"] == 0.0
    assert data["total_spent"] == 0.0
    assert data["total_remaining"] == 0.0
    assert len(data["categories"]) == 0


@pytest.mark.asyncio
async def test_budget_overview_with_spending(client):
    """Budget overview should correctly calculate spent and remaining amounts."""
    # Create a category with $500 budget
    cat = await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    cat_id = cat.json()["id"]

    # Add expense transactions for this month
    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 150, "type": "expense", "category_id": cat_id})
    await client.post("/api/transactions", json={"date": today, "amount": 100, "type": "expense", "category_id": cat_id})

    resp = await client.get("/api/budgets/overview")
    data = resp.json()
    assert data["total_budget"] == 500.0
    assert data["total_spent"] == 250.0
    assert data["total_remaining"] == 250.0

    cat_overview = data["categories"][0]
    assert cat_overview["spent_this_month"] == 250.0
    assert cat_overview["remaining"] == 250.0
    assert cat_overview["percentage_used"] == 50.0
    assert cat_overview["status"] == "ok"


@pytest.mark.asyncio
async def test_danger_zone_warning(client):
    """Categories at 80%+ should appear in danger zones with warning status."""
    cat = await client.post("/api/categories", json={"name": "Food", "budget_amount": 100})
    cat_id = cat.json()["id"]

    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 85, "type": "expense", "category_id": cat_id})

    resp = await client.get("/api/budgets/danger-zones")
    data = resp.json()
    assert len(data["danger_zones"]) == 1
    assert data["danger_zones"][0]["status"] == "warning"


@pytest.mark.asyncio
async def test_danger_zone_critical(client):
    """Categories at 95%+ should have critical status."""
    cat = await client.post("/api/categories", json={"name": "Food", "budget_amount": 100})
    cat_id = cat.json()["id"]

    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 97, "type": "expense", "category_id": cat_id})

    resp = await client.get("/api/budgets/danger-zones")
    data = resp.json()
    assert len(data["danger_zones"]) == 1
    assert data["danger_zones"][0]["status"] == "critical"


@pytest.mark.asyncio
async def test_danger_zone_exceeded(client):
    """Categories at 100%+ should have exceeded status."""
    cat = await client.post("/api/categories", json={"name": "Food", "budget_amount": 100})
    cat_id = cat.json()["id"]

    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 110, "type": "expense", "category_id": cat_id})

    resp = await client.get("/api/budgets/danger-zones")
    data = resp.json()
    assert len(data["danger_zones"]) == 1
    assert data["danger_zones"][0]["status"] == "exceeded"


@pytest.mark.asyncio
async def test_income_not_counted_in_budget(client):
    """Income transactions should not count toward budget spending."""
    cat = await client.post("/api/categories", json={"name": "Salary", "budget_amount": 1000})
    cat_id = cat.json()["id"]

    today = date.today().isoformat()
    await client.post("/api/transactions", json={"date": today, "amount": 3000, "type": "income", "category_id": cat_id})

    resp = await client.get("/api/budgets/overview")
    cat_data = resp.json()["categories"][0]
    assert cat_data["spent_this_month"] == 0.0
