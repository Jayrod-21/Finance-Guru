"""
Tests for the transaction ledger API.
Covers CRUD operations, balance calculation, and filtering.
"""
import pytest
from datetime import date


@pytest.mark.asyncio
async def test_create_transaction(client):
    """Creating a transaction should return 201 with the created data."""
    resp = await client.post("/api/transactions", json={
        "date": "2026-03-15",
        "amount": 50.00,
        "description": "Groceries",
        "type": "expense",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount"] == 50.00
    assert data["type"] == "expense"
    assert data["description"] == "Groceries"


@pytest.mark.asyncio
async def test_list_transactions(client):
    """Listing transactions should return all created entries."""
    await client.post("/api/transactions", json={"date": "2026-03-10", "amount": 100, "type": "income"})
    await client.post("/api/transactions", json={"date": "2026-03-11", "amount": 30, "type": "expense"})

    resp = await client.get("/api/transactions")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_filter_by_type(client):
    """Filtering by type should only return matching transactions."""
    await client.post("/api/transactions", json={"date": "2026-03-10", "amount": 100, "type": "income"})
    await client.post("/api/transactions", json={"date": "2026-03-11", "amount": 30, "type": "expense"})

    resp = await client.get("/api/transactions", params={"type": "income"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["type"] == "income"


@pytest.mark.asyncio
async def test_balance_calculation(client):
    """Balance should equal total income minus total expenses."""
    await client.post("/api/transactions", json={"date": "2026-03-01", "amount": 3000, "type": "income"})
    await client.post("/api/transactions", json={"date": "2026-03-02", "amount": 500, "type": "expense"})
    await client.post("/api/transactions", json={"date": "2026-03-03", "amount": 200, "type": "expense"})

    resp = await client.get("/api/transactions/balance")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_income"] == 3000.00
    assert data["total_expenses"] == 700.00
    assert data["balance"] == 2300.00


@pytest.mark.asyncio
async def test_balance_empty(client):
    """Balance with no transactions should be zero."""
    resp = await client.get("/api/transactions/balance")
    assert resp.status_code == 200
    data = resp.json()
    assert data["balance"] == 0.0


@pytest.mark.asyncio
async def test_update_transaction(client):
    """Updating a transaction should change the specified fields."""
    create = await client.post("/api/transactions", json={"date": "2026-03-15", "amount": 50, "type": "expense"})
    tx_id = create.json()["id"]

    resp = await client.put(f"/api/transactions/{tx_id}", json={"amount": 75, "description": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["amount"] == 75.0
    assert resp.json()["description"] == "Updated"


@pytest.mark.asyncio
async def test_delete_transaction(client):
    """Deleting a transaction should remove it from the list."""
    create = await client.post("/api/transactions", json={"date": "2026-03-15", "amount": 50, "type": "expense"})
    tx_id = create.json()["id"]

    resp = await client.delete(f"/api/transactions/{tx_id}")
    assert resp.status_code == 204

    listing = await client.get("/api/transactions")
    assert len(listing.json()) == 0


@pytest.mark.asyncio
async def test_delete_nonexistent(client):
    """Deleting a non-existent transaction should return 404."""
    resp = await client.delete("/api/transactions/999")
    assert resp.status_code == 404
