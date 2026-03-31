"""
AI chatbox endpoints.
Sends user messages to Anthropic Claude Sonnet 4 with full financial context.
System prompt enforces budgeting-only guardrails — no investment advice.
"""
import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_history import ChatHistory
from app.routers.settings import get_api_key
from app.services.ai_context import build_financial_context

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT_TEMPLATE = """You are a personal financial advisor built into the Financial Guru app.

ROLE & PERSONALITY:
- You are helpful, direct, and slightly witty
- You use the user's actual numbers — never generic advice
- You are encouraging but honest about financial realities

ACCESS:
You have full access to the user's financial data, provided below. Reference specific numbers, categories, and trends in your responses.

CAPABILITIES:
- Budget optimization: Identify where the user is overspending and suggest reallocation
- Goal realism assessment: Evaluate whether savings goals are achievable given current income and expenses
- Category recommendations: Analyze transaction descriptions and suggest logical category groupings
- Spending pattern analysis: Identify trends, frequent purchases, and areas of concern
- Where-to-cut suggestions: Specific, actionable recommendations for reducing spending

GUARDRAILS — STRICTLY ENFORCED:
- You provide budgeting and goal guidance ONLY
- NEVER give investment advice, stock recommendations, or crypto advice
- NEVER recommend specific financial products, funds, or securities
- If asked about investments, respond: "I focus on budgeting and goal planning. For investment advice, please consult a certified financial planner."
- You are NOT a certified financial planner — make this clear if asked

CURRENT FINANCIAL DATA:
{financial_context}
"""


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class ChatHistoryItem(BaseModel):
    user_message: str
    ai_response: str
    created_at: str

    model_config = {"from_attributes": True}


@router.post("", response_model=ChatResponse)
async def chat(data: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a message to the AI advisor. Builds financial context,
    includes recent chat history for continuity, and calls Anthropic API.
    """
    api_key = await get_api_key(db)

    # Build financial context
    financial_context = await build_financial_context(db)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(financial_context=financial_context)

    # Get recent chat history for conversation continuity (last 10 exchanges)
    history_result = await db.execute(
        select(ChatHistory).order_by(ChatHistory.id.desc()).limit(10)
    )
    history = list(reversed(history_result.scalars().all()))

    # Build messages array with history
    messages = []
    for h in history:
        messages.append({"role": "user", "content": h.user_message})
        messages.append({"role": "assistant", "content": h.ai_response})
    messages.append({"role": "user", "content": data.message})

    # Call Anthropic API
    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        ai_response = response.content[0].text
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid API key. Please update in Settings.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    # Store in chat history
    chat_entry = ChatHistory(user_message=data.message, ai_response=ai_response)
    db.add(chat_entry)
    await db.commit()

    return ChatResponse(response=ai_response)


@router.get("/history", response_model=list[ChatHistoryItem])
async def get_chat_history(db: AsyncSession = Depends(get_db)):
    """Retrieve past chat messages, most recent last."""
    result = await db.execute(select(ChatHistory).order_by(ChatHistory.id.asc()))
    items = result.scalars().all()
    return [
        ChatHistoryItem(
            user_message=h.user_message,
            ai_response=h.ai_response,
            created_at=str(h.created_at) if h.created_at else "",
        )
        for h in items
    ]
