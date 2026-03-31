"""
Tests for the category management API.
Covers CRUD operations and soft delete behavior.
"""
import pytest


@pytest.mark.asyncio
async def test_create_category(client):
    """Creating a category should return 201 with name and budget."""
    resp = await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Food"
    assert data["budget_amount"] == 500.0
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_categories(client):
    """Listing should return only active categories."""
    await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    await client.post("/api/categories", json={"name": "Transport", "budget_amount": 200})

    resp = await client.get("/api/categories")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_soft_delete(client):
    """Soft-deleting a category should hide it from listings."""
    create = await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    cat_id = create.json()["id"]

    delete_resp = await client.delete(f"/api/categories/{cat_id}")
    assert delete_resp.status_code == 204

    listing = await client.get("/api/categories")
    assert len(listing.json()) == 0


@pytest.mark.asyncio
async def test_update_category(client):
    """Updating a category should change the specified fields."""
    create = await client.post("/api/categories", json={"name": "Food", "budget_amount": 500})
    cat_id = create.json()["id"]

    resp = await client.put(f"/api/categories/{cat_id}", json={"name": "Groceries", "budget_amount": 600})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Groceries"
    assert resp.json()["budget_amount"] == 600.0
