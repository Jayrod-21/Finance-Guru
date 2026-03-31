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

### 2026-03-31 — Phases 1-6 Complete Build (v0.7)

**Session Type:** Development (Full Build)
**Claude Model Used:** Opus 4
**Status:** Phase 6 — Complete (Phases 1-6 all done)

#### Work Completed

**Phase 1 — MVP Foundation:**
- Project directory structure (backend/, frontend/, data/, docker/)
- Dockerfiles for backend (Python 3.12/FastAPI) and frontend (Node 20/React 18)
- docker-compose.yml with both services + SQLite volume mount
- SQLAlchemy async models: Category, Transaction
- Database auto-initialization via lifespan event
- Transaction Ledger API: full CRUD + running balance + filters
- Category Management API: CRUD with soft delete
- Budget System API: overview + danger zones (80%/95%/100%)
- React frontend: Dashboard, Quick Add, Transaction List, Budget View, Categories
- Dark/light mode toggle with localStorage persistence

**Phase 2 — Recurring Expenses + Income:**
- RecurringExpense model with billing cycle support (weekly/monthly/quarterly/annual)
- IncomeSource model with frequency normalization (biweekly: amount x 26/12)
- CRUD APIs for both + upcoming payments endpoint + monthly income calculation
- Frontend pages: Recurring Expenses, Income management
- Dashboard updated: monthly income, recurring total, net income cards

**Phase 3 — Goals + Debt Tracking:**
- Goal model: savings/debt_payoff/custom types, deadline, progress tracking
- Debt model: interest rate, minimum payment, payoff projections
- Amortization-based payoff calculation
- Feasibility endpoint: checks budget surplus vs goal contributions
- Frontend pages: Goals with progress bars, Debts with payoff projections
- Dashboard: goal progress summary with feasibility alert

**Phase 4 — AI Chatbox:**
- Anthropic API key storage with Fernet encryption
- API key validation on entry (test API call)
- Chat endpoint: builds full financial context, calls Claude Sonnet 4
- System prompt with budgeting-only guardrails (no investment advice)
- Smart context: current month detail + 3-month rolling summary
- Chat history stored in SQLite for conversation continuity
- Frontend: Chat page with message display, quick action buttons, Settings page

**Phase 5 — Analytics + Visualizations:**
- Analytics API: top categories, frequency analysis, largest purchases
- Weekly (8-week) and monthly (6-month) spending comparisons
- "Did you know" insights generation from spending patterns
- End-of-month balance projection based on daily spending pace
- Budget burn rate calculation (actual vs expected pace)
- Recharts visualizations: bar charts, line charts, treemap (NO PIE CHARTS)
- Analytics page with insights cards, projection, burn rate gauge

**Phase 6 — Notifications + History:**
- MonthlySnapshot model with JSON blobs for category/goal/debt data
- Snapshot generation API (manual trigger, defaults to previous month)
- History browser with side-by-side month comparison
- Notification preference system with per-trigger toggles
- Active notification polling: budget warnings, upcoming bills, goal milestones
- Frontend: History page, Notifications page with toggle switches

#### Decisions Made
- SQLAlchemy async with aiosqlite for non-blocking DB access
- Soft delete for categories to preserve historical transactions
- Transaction entry resets amount/desc/category but keeps date/type for speed
- Budget calculation scoped to current calendar month
- Fernet symmetric encryption for API key storage (key file in data dir)
- AI context includes last 50 transactions + 3-month summary for efficiency
- Notifications use polling model (GET /api/notifications/active) for simplicity

#### Files Created/Modified (total: 50+ files)
- Backend: 10 models, 10 routers, 6 schemas, 2 services, main.py, database.py
- Frontend: 14 pages, 1 component, 1 service, App.js, routing
- Infrastructure: 2 Dockerfiles, docker-compose.yml, .gitignore
- Documentation: financial-guru-context.md, financial-guru-history.md

#### Next Steps
- Phase 7: UI polish, testing, desktop packaging
- Add keyboard shortcuts for quick transaction entry
- Write tests for balance calculations, budget logic, projection math
- Evaluate Electron vs Tauri for desktop packaging
- Accessibility pass (ARIA labels, focus management)

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
| Recurring expenses module          | Phase 2     | ✅ Complete  | 2026-03-31     |
| Income management page             | Phase 2     | ✅ Complete  | 2026-03-31     |
| Category management system         | Phase 2     | ✅ Complete  | 2026-03-31     |
| Financial goals module             | Phase 3     | ✅ Complete  | 2026-03-31     |
| Debt tracking module               | Phase 3     | ✅ Complete  | 2026-03-31     |
| AI chatbox integrated              | Phase 4     | ✅ Complete  | 2026-03-31     |
| Analytics dashboard                | Phase 5     | ✅ Complete  | 2026-03-31     |
| Visualizations (no pie charts)     | Phase 5     | ✅ Complete  | 2026-03-31     |
| Push notifications working         | Phase 6     | ✅ Complete  | 2026-03-31     |
| Monthly snapshots automated        | Phase 6     | ✅ Complete  | 2026-03-31     |
| Light/dark mode toggle             | Phase 1     | ✅ Complete  | 2026-03-31     |
| Full testing & polish              | Phase 7     | ⬜ Pending   |                |
| Desktop packaging                  | Phase 7     | ⬜ Pending   |                |
