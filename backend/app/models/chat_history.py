"""
ChatHistory model — stores conversation history between user and AI advisor.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
