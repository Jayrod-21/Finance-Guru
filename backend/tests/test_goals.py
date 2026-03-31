"""
Tests for the financial goals API.
Covers progress calculations and feasibility checks.
"""
import pytest
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_create_goal(client):
    """Creating a goal should return progress calculations."""
    deadline = (date.today() + timedelta(days=365)).isoformat()
    resp = await client.post("/api/goals", json={
        "name": "Emergency Fund",
        "type": "savings",
        "target_amount": 10000,
        "current_amount": 2500,
        "deadline": deadline,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["progress_percentage"] == 25.0
    assert data["days_remaining"] is not None
    assert data["monthly_contribution_needed"] is not None
    assert data["monthly_contribution_needed"] > 0


@pytest.mark.asyncio
async def test_goal_100_percent(client):
    """A fully funded goal should show 100% progress."""
    resp = await client.post("/api/goals", json={
        "name": "Done Goal",
        "type": "savings",
        "target_amount": 1000,
        "current_amount": 1000,
    })
    data = resp.json()
    assert data["progress_percentage"] == 100.0


@pytest.mark.asyncio
async def test_goal_no_deadline(client):
    """A goal without a deadline should have null days_remaining."""
    resp = await client.post("/api/goals", json={
        "name": "Flexible Goal",
        "type": "custom",
        "target_amount": 5000,
        "current_amount": 0,
    })
    data = resp.json()
    assert data["days_remaining"] is None
    assert data["monthly_contribution_needed"] is None


@pytest.mark.asyncio
async def test_feasibility_no_data(client):
    """Feasibility with no income/goals should be feasible with zero surplus."""
    resp = await client.get("/api/goals/feasibility")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_feasible"] is True
    assert data["deficit"] == 0.0


@pytest.mark.asyncio
async def test_feasibility_with_income_and_goal(client):
    """Feasibility should correctly compare surplus to goal contributions."""
    # Add income
    await client.post("/api/income", json={"name": "Salary", "amount": 5000, "frequency": "monthly"})

    # Add goal with deadline
    deadline = (date.today() + timedelta(days=180)).isoformat()
    await client.post("/api/goals", json={
        "name": "Vacation",
        "type": "savings",
        "target_amount": 3000,
        "current_amount": 0,
        "deadline": deadline,
    })

    resp = await client.get("/api/goals/feasibility")
    data = resp.json()
    assert data["monthly_income"] == 5000.0
    # With no expenses, surplus should cover the goal
    assert data["is_feasible"] is True
