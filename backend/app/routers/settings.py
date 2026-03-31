"""
Settings endpoints — manages user preferences and API key storage.
API key is encrypted at rest using Fernet symmetric encryption.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.setting import Setting
from app.services.encryption import encrypt, decrypt

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ApiKeyRequest(BaseModel):
    api_key: str


class ApiKeyStatus(BaseModel):
    is_set: bool


@router.post("/apikey")
async def store_api_key(data: ApiKeyRequest, db: AsyncSession = Depends(get_db)):
    """Store the Anthropic API key encrypted. Validates by testing a lightweight API call."""
    # Validate key by attempting to create a client
    import anthropic
    try:
        client = anthropic.Anthropic(api_key=data.api_key)
        # Make a minimal API call to verify the key works
        client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid API key: {str(e)}")

    # Store encrypted key
    encrypted = encrypt(data.api_key)
    result = await db.execute(select(Setting).where(Setting.key == "anthropic_api_key"))
    existing = result.scalar_one_or_none()

    if existing:
        existing.value = encrypted
    else:
        db.add(Setting(key="anthropic_api_key", value=encrypted))

    await db.commit()
    return {"status": "ok", "message": "API key stored successfully"}


@router.get("/apikey/status", response_model=ApiKeyStatus)
async def api_key_status(db: AsyncSession = Depends(get_db)):
    """Check if an API key is configured (never returns the key itself)."""
    result = await db.execute(select(Setting).where(Setting.key == "anthropic_api_key"))
    existing = result.scalar_one_or_none()
    return ApiKeyStatus(is_set=existing is not None)


async def get_api_key(db: AsyncSession) -> str:
    """Internal helper to retrieve and decrypt the stored API key."""
    result = await db.execute(select(Setting).where(Setting.key == "anthropic_api_key"))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured. Go to Settings to add it.")
    return decrypt(setting.value)
