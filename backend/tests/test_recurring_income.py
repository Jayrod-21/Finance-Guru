"""
Tests for recurring expenses and income source APIs.
Covers monthly cost normalization and frequency calculations.
"""
import pytest


@pytest.mark.asyncio
async def test_recurring_monthly_cost(client):
    """Monthly cost should equal amount for monthly billing cycle."""
    resp = await client.post("/api/recurring", json={
        "name": "Netflix", "amount": 15.99, "billing_cycle": "monthly",
    })
    assert resp.status_code == 201
    assert resp.json()["monthly_cost"] == 15.99


@pytest.mark.asyncio
async def test_recurring_annual_cost(client):
    """Annual billing should be divided by 12 for monthly cost."""
    resp = await client.post("/api/recurring", json={
        "name": "Insurance", "amount": 1200, "billing_cycle": "annual",
    })
    assert resp.json()["monthly_cost"] == 100.0  # 1200 / 12


@pytest.mark.asyncio
async def test_recurring_quarterly_cost(client):
    """Quarterly billing should be divided by 3 for monthly cost."""
    resp = await client.post("/api/recurring", json={
        "name": "Gym", "amount": 90, "billing_cycle": "quarterly",
    })
    assert resp.json()["monthly_cost"] == 30.0  # 90 / 3


@pytest.mark.asyncio
async def test_recurring_weekly_cost(client):
    """Weekly billing should be multiplied by 52/12 for monthly cost."""
    resp = await client.post("/api/recurring", json={
        "name": "Cleaning", "amount": 50, "billing_cycle": "weekly",
    })
    expected = round(50 * 52 / 12, 2)  # ~216.67
    assert resp.json()["monthly_cost"] == expected


@pytest.mark.asyncio
async def test_income_monthly(client):
    """Monthly income should equal the entered amount."""
    resp = await client.post("/api/income", json={
        "name": "Salary", "amount": 5000, "frequency": "monthly",
    })
    assert resp.json()["monthly_amount"] == 5000.0


@pytest.mark.asyncio
async def test_income_biweekly(client):
    """Bi-weekly income should be normalized: amount * 26 / 12."""
    resp = await client.post("/api/income", json={
        "name": "Paycheck", "amount": 2000, "frequency": "biweekly",
    })
    expected = round(2000 * 26 / 12, 2)  # ~4333.33
    assert resp.json()["monthly_amount"] == expected


@pytest.mark.asyncio
async def test_income_weekly(client):
    """Weekly income should be normalized: amount * 52 / 12."""
    resp = await client.post("/api/income", json={
        "name": "Freelance", "amount": 500, "frequency": "weekly",
    })
    expected = round(500 * 52 / 12, 2)  # ~2166.67
    assert resp.json()["monthly_amount"] == expected


@pytest.mark.asyncio
async def test_monthly_income_total(client):
    """GET /api/income/monthly should sum all normalized monthly amounts."""
    await client.post("/api/income", json={"name": "Salary", "amount": 5000, "frequency": "monthly"})
    await client.post("/api/income", json={"name": "Side Gig", "amount": 1000, "frequency": "biweekly"})

    resp = await client.get("/api/income/monthly")
    data = resp.json()
    expected_total = round(5000 + 1000 * 26 / 12, 2)
    assert data["total_monthly_income"] == expected_total
    assert len(data["sources"]) == 2
