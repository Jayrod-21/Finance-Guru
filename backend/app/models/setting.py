"""
Setting model — stores user settings including encrypted API keys.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
