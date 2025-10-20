from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager
import os

# 🔹 Environment variable should contain your full Supabase connection URL
# Example: postgresql+asyncpg://postgres:<password>@<host>:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ FIXED ENGINE CONFIGURATION
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,                # detects invalid connections
    pool_reset_on_return="commit",     # clears asyncpg cached statements on commit
    future=True
)

# Session factory
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# Dependency injection for FastAPI
@asynccontextmanager
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
