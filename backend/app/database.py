"""
Database configuration and session management.
Uses SQLAlchemy async engine with aiosqlite for non-blocking SQLite access.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# SQLite database path — persisted via Docker volume mount
DATABASE_URL = "sqlite+aiosqlite:///./data/financial_guru.db"

engine = create_async_engine(DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency that provides an async database session per request."""
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables on first startup if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
