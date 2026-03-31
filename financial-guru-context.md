# Financial Guru — Project Context & Summary

**Purpose:** This file provides quick context for any Claude Code session working on Financial Guru. Read this FIRST before starting any task. It contains the project's identity, current state, architectural decisions, and critical constraints.

---

## What Is Financial Guru?

A local-first personal finance command center that solves one core problem: **you never know where your money actually is right now.** Banking apps lag, transactions pend, and existing tools show you yesterday's data. Financial Guru gives you a real-time, manually-maintained ledger with AI-powered budgeting guidance.

## Who Is It For?

Solo user. One person tracking their personal finances on their local machine. No multi-user, no cloud sync, no accounts system (for now).

## Current State

**Phase:** Phases 1-7 Complete (All Core Features + Testing + Polish)
**Version:** v1.0
**Last Updated:** 2026-03-31

## Architecture Overview

- **Backend:** Python 3.12+ / FastAPI (port 8000)
- **Frontend:** React 18+ / Tailwind CSS (port 3000)
- **Database:** SQLite via SQLAlchemy async + aiosqlite
- **Container:** Docker + Docker Compose
- **AI:** Anthropic Claude Sonnet 4 (Phase 4)

## Critical Constraints

1. **NO PIE CHARTS** — bar charts, treemaps, sankey diagrams, line charts only
2. **Quick entry is king** — Transaction entry must take < 10 seconds
3. **AI stays in its lane** — Budgeting and goal guidance ONLY
4. **Categories are user-created** — No presets, blank slate
5. **All data local** — SQLite on machine, except Anthropic API calls
6. **Monthly budget reset** — No rollover
