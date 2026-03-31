"""
NotificationPref model — stores user notification preferences.
"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class NotificationPref(Base):
    __tablename__ = "notification_prefs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_type = Column(String(50), unique=True, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
