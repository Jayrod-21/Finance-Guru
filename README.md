# Financial Guru

A local-first personal finance command center with real-time balance tracking, category-based budgeting, and an AI-powered financial advisor.

## Features

- **Transaction Ledger** — Manual entry with running balance calculation
- **Category Budgets** — Per-category spending limits with danger zone alerts (80%/95%/100%)
- **Recurring Expenses** — Track subscriptions and bills with billing cycle normalization
- **Income Management** — Multiple sources with bi-weekly/weekly/monthly frequency support
- **Financial Goals** — Savings targets with progress tracking and feasibility assessment
- **Debt Tracking** — Interest calculations and amortization-based payoff projections
- **AI Financial Advisor** — Claude Sonnet 4 chatbox for budget optimization and goal guidance
- **Analytics Dashboard** — Bar charts, treemaps, line charts, burn rate, and spending insights
- **Monthly Snapshots** — Historical financial records with side-by-side comparison
- **Notifications** — Budget warnings, upcoming bills, and goal milestone alerts
- **Dark/Light Mode** — Toggle with persistent preference

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Backend    | Python 3.12+ / FastAPI         |
| Frontend   | React 18+ / Tailwind CSS       |
| Database   | SQLite (async via aiosqlite)   |
| AI         | Anthropic Claude Sonnet 4      |
| Charts     | Recharts                       |
| Container  | Docker + Docker Compose        |

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Run

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Database

SQLite database is persisted at `./data/financial_guru.db` via Docker volume mount. Tables are auto-created on first startup.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── database.py          # SQLAlchemy async engine + session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API endpoint handlers
│   │   └── services/            # Business logic (encryption, AI context)
│   ├── tests/                   # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # React page components
│   │   ├── components/          # Shared UI components
│   │   └── services/api.js      # Axios API client
│   ├── Dockerfile
│   └── package.json
├── data/                        # SQLite database (Docker volume)
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint                        | Description                          |
|--------|--------------------------------|--------------------------------------|
| POST   | /api/transactions              | Add transaction                      |
| GET    | /api/transactions              | List with filters                    |
| GET    | /api/transactions/balance      | Running balance                      |
| POST   | /api/categories                | Create category                      |
| GET    | /api/categories                | List active categories               |
| GET    | /api/budgets/overview          | Budget vs spent per category         |
| GET    | /api/budgets/danger-zones      | Categories at 80%+ usage             |
| POST   | /api/recurring                 | Add recurring expense                |
| GET    | /api/recurring/upcoming        | Next 30 days of payments             |
| POST   | /api/income                    | Add income source                    |
| GET    | /api/income/monthly            | Total monthly income                 |
| POST   | /api/goals                     | Create financial goal                |
| GET    | /api/goals/feasibility         | Check if goals are affordable        |
| POST   | /api/debts                     | Add debt                             |
| POST   | /api/chat                      | Send message to AI advisor           |
| GET    | /api/analytics/top-categories  | Most spent categories                |
| GET    | /api/analytics/projection      | End-of-month balance projection      |
| GET    | /api/analytics/burn-rate       | Budget burn rate                     |
| GET    | /api/snapshots                 | Browse monthly snapshots             |
| GET    | /api/notifications/active      | Current alert conditions             |

## AI Advisor

The AI chatbox uses Anthropic Claude Sonnet 4. To use it:

1. Go to **Settings** and enter your Anthropic API key
2. The key is encrypted at rest using Fernet symmetric encryption
3. Navigate to **AI Advisor** to chat

The AI has access to your full financial data and provides:
- Budget optimization suggestions
- Goal feasibility assessments
- Category recommendations
- Spending pattern analysis

**Guardrails:** The AI provides budgeting and goal guidance only. It will not give investment advice, stock recommendations, or crypto advice.

## Keyboard Shortcuts

| Shortcut       | Action                    |
|---------------|---------------------------|
| Ctrl+N / Cmd+N | Quick add transaction     |

## Development

### Seed Data

Populate the database with realistic sample data for development and demos:

```bash
cd backend
python -m app.seed
```

Creates 8 categories, ~100+ transactions (3 months), recurring expenses, income sources, goals, and debts.

## Testing

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

41 tests covering:
- **Unit tests:** transactions, categories, budgets, debts, goals, recurring expenses, income calculations
- **Integration tests:** transaction-to-budget flow, transaction-to-analytics flow, income-to-feasibility flow, balance after edit/delete, notification triggers

## Design Principles

1. **Speed of entry > everything** — Transaction entry optimized for < 10 seconds
2. **No pie charts** — Bar charts, treemaps, line charts only
3. **Privacy first** — All data local, API key encrypted, no external sharing
4. **AI as advisor, not authority** — Suggestions only, user decides
5. **Categories from blank slate** — No presets, AI recommends on request
