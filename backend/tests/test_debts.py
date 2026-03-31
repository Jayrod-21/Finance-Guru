"""
Tests for the debt tracking API.
Covers payoff projections and interest calculations.
"""
import pytest


@pytest.mark.asyncio
async def test_create_debt(client):
    """Creating a debt should return calculated monthly interest and payoff."""
    resp = await client.post("/api/debts", json={
        "name": "Credit Card",
        "balance": 5000,
        "interest_rate": 18.0,
        "minimum_payment": 150,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["balance"] == 5000.0
    assert data["interest_rate"] == 18.0
    # Monthly interest = 5000 * (18/100/12) = 75.0
    assert data["monthly_interest"] == 75.0
    # Should have a payoff projection
    assert data["payoff_months"] is not None
    assert data["payoff_months"] > 0
    assert data["total_interest_cost"] > 0


@pytest.mark.asyncio
async def test_zero_interest_debt(client):
    """A zero-interest debt should have a simple payoff calculation."""
    resp = await client.post("/api/debts", json={
        "name": "Friend Loan",
        "balance": 1000,
        "interest_rate": 0,
        "minimum_payment": 200,
    })
    data = resp.json()
    assert data["monthly_interest"] == 0.0
    assert data["payoff_months"] == 5  # 1000 / 200 = 5
    assert data["total_interest_cost"] == 0.0


@pytest.mark.asyncio
async def test_payment_less_than_interest(client):
    """If payment doesn't cover interest, payoff should be None."""
    resp = await client.post("/api/debts", json={
        "name": "Big Debt",
        "balance": 10000,
        "interest_rate": 24.0,
        "minimum_payment": 100,
    })
    data = resp.json()
    # Monthly interest = 10000 * 24/100/12 = 200. Payment of 100 < 200.
    assert data["monthly_interest"] == 200.0
    assert data["payoff_months"] is None
    assert data["total_interest_cost"] is None


@pytest.mark.asyncio
async def test_no_payment_debt(client):
    """A debt with zero payment should have no payoff projection."""
    resp = await client.post("/api/debts", json={
        "name": "Stale Debt",
        "balance": 500,
        "interest_rate": 10,
        "minimum_payment": 0,
    })
    data = resp.json()
    assert data["payoff_months"] is None


@pytest.mark.asyncio
async def test_update_debt_balance(client):
    """Updating a debt balance should recalculate projections."""
    create = await client.post("/api/debts", json={
        "name": "Card", "balance": 2000, "interest_rate": 12, "minimum_payment": 100,
    })
    debt_id = create.json()["id"]

    resp = await client.put(f"/api/debts/{debt_id}", json={"balance": 1000})
    assert resp.status_code == 200
    assert resp.json()["balance"] == 1000.0
    # Monthly interest should be halved: 1000 * 12/100/12 = 10
    assert resp.json()["monthly_interest"] == 10.0
