"""
Financial Guru — FastAPI application entry point.
Initializes the database on startup and mounts all API routers.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import categories, transactions, budgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Financial Guru",
    description="Local-first personal finance command center",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow frontend dev server to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}
