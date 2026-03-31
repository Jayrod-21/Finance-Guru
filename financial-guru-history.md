# Financial Guru — Project History

**Purpose:** This file tracks all decisions, milestones, changes, and progress throughout the Financial Guru project. Update this file after every development session, overnight task, or significant decision.

---

## Changelog

### 2026-03-30 — Project Ideation & Planning (v0.1)

**Session Type:** Planning / Ideation (Claude.ai Chat)
**Status:** Pre-Development

#### Decisions Made
1. Tech stack finalized: Python 3.12+ / FastAPI, React 18+ / Tailwind CSS, SQLite, Anthropic Claude Sonnet 4
2. Core feature set defined across 7 phases
3. NO PIE CHARTS — hard rule
4. Quick transaction entry is #1 UX priority
5. Categories built from blank slate — AI recommends on query
6. All data local, API key encrypted at rest

---

### 2026-03-31 — Phase 1 MVP Foundation (v0.2)

**Session Type:** Development
**Claude Model Used:** Opus 4
**Status:** Phase 1 — Complete

#### Work Completed
- Created full project directory structure (backend/, frontend/, data/, docker/)
- Backend Dockerfile (Python 3.12, FastAPI, uvicorn with hot reload)
- Frontend Dockerfile (Node 20, React 18)
- docker-compose.yml with both services + SQLite volume mount (./data:/app/data)
- SQLAlchemy async models: Category, Transaction
- Database auto-initialization on startup via lifespan event
- Transaction Ledger API: full CRUD + running balance endpoint
  - POST/GET/PUT/DELETE /api/transactions
  - GET /api/transactions/balance (income - expenses)
  - Filtering by date range, category, amount range, type
- Category Management API: full CRUD with soft delete
  - POST/GET/PUT/DELETE /api/categories
  - Soft delete preserves historical transaction references
- Budget System API:
  - GET /api/budgets/overview — per-category budget vs spent with status
  - GET /api/budgets/danger-zones — categories at 80%+ usage
  - Danger zone thresholds: 80% warning, 95% critical, 100% exceeded
- Pydantic request/response schemas for all endpoints
- CORS middleware configured for frontend communication
- Health check endpoint at /api/health
- React frontend with Tailwind CSS:
  - Navigation bar with route links and dark/light mode toggle
  - Dashboard: running balance card, budget overview summary, recent transactions
  - Quick Add Transaction: type toggle, large amount input, date/category/description, keyboard-friendly
  - Transaction List: filterable table (type, category, date range) with delete
  - Budget View: aggregate summary cards + per-category progress bars with danger zone colors
  - Categories page: create, inline edit, and delete categories
- API service layer (axios) with all endpoint functions
- Dark mode support via Tailwind `dark:` classes with localStorage persistence

#### Decisions Made
- Used SQLAlchemy async with aiosqlite for non-blocking DB access
- Soft delete for categories to preserve historical transaction integrity
- Transaction entry form resets amount/description/category after submit but keeps date and type for rapid consecutive entries
- Budget calculation scoped to current calendar month (1st to today)

#### Files Changed
- Created: backend/Dockerfile, backend/requirements.txt, backend/app/main.py
- Created: backend/app/database.py, backend/app/models/category.py, backend/app/models/transaction.py
- Created: backend/app/schemas/transaction.py, backend/app/schemas/category.py, backend/app/schemas/budget.py
- Created: backend/app/routers/transactions.py, backend/app/routers/categories.py, backend/app/routers/budgets.py
- Created: frontend/Dockerfile, frontend/package.json, frontend/tailwind.config.js, frontend/postcss.config.js
- Created: frontend/public/index.html, frontend/src/index.js, frontend/src/index.css, frontend/src/App.js
- Created: frontend/src/components/Navbar.js, frontend/src/services/api.js
- Created: frontend/src/pages/Dashboard.js, frontend/src/pages/TransactionEntry.js
- Created: frontend/src/pages/TransactionList.js, frontend/src/pages/BudgetView.js, frontend/src/pages/Categories.js
- Created: docker-compose.yml, .gitignore, data/.gitkeep
- Created: financial-guru-context.md, financial-guru-history.md

#### Next Steps
- Phase 2: Recurring expenses + income management
- Add seed script for development testing (optional)
- Consider adding keyboard shortcuts for transaction entry (Ctrl+N)

---

## Milestone Tracker

| Milestone                          | Target Phase | Status      | Date Completed |
|------------------------------------|-------------|-------------|----------------|
| Project planning complete          | Pre-dev     | ✅ Complete  | 2026-03-30     |
| Docker environment setup           | Phase 1     | ✅ Complete  | 2026-03-31     |
| Database schema implemented        | Phase 1     | ✅ Complete  | 2026-03-31     |
| Transaction ledger functional      | Phase 1     | ✅ Complete  | 2026-03-31     |
| Running balance working            | Phase 1     | ✅ Complete  | 2026-03-31     |
| Basic budget system functional     | Phase 1     | ✅ Complete  | 2026-03-31     |
| Recurring expenses module          | Phase 2     | ⬜ Pending   |                |
| Income management page             | Phase 2     | ⬜ Pending   |                |
| Category management system         | Phase 2     | ⬜ Pending   |                |
| Financial goals module             | Phase 3     | ⬜ Pending   |                |
| Debt tracking module               | Phase 3     | ⬜ Pending   |                |
| AI chatbox integrated              | Phase 4     | ⬜ Pending   |                |
| Analytics dashboard                | Phase 5     | ⬜ Pending   |                |
| Visualizations (no pie charts)     | Phase 5     | ⬜ Pending   |                |
| Push notifications working         | Phase 6     | ⬜ Pending   |                |
| Monthly snapshots automated        | Phase 6     | ⬜ Pending   |                |
| Light/dark mode toggle             | Phase 7     | ⬜ Pending   |                |
| Full testing & polish              | Phase 7     | ⬜ Pending   |                |
| Desktop packaging                  | Phase 7     | ⬜ Pending   |                |
