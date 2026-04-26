# 2legal2hack — Incident Response Tool

A locally-hosted GDPR/NIS2 incident response management tool for coordinating data breach response across 8 organizational roles.

## Quick Start

### Prerequisites

- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- Node.js 18+
- OpenAI API key

### Windows Installer

On Windows, you can use the small installer script from the project root:

```powershell
.\install-windows.cmd
```

It checks Python/Node/npm, creates the backend virtual environment, prepares local data folders, creates `backend\.env` if needed, installs backend and frontend dependencies, and can start both dev servers.

Useful options:

```powershell
.\install-windows.cmd -Run        # install, then start backend and frontend
.\install-windows.cmd -Run -Seed  # also seed demo data
.\install-windows.cmd -CheckOnly  # only check prerequisites
.\install-windows.cmd -NoRun      # install only
```

Manual setup is still available below.

### 1. Backend

```bash
cd backend
cp .env.example .env   # add your OPENAI_API_KEY
uv sync
uv run uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. The SQLite database is created automatically on first start.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Seed Demo Data (optional)

With the backend running:

```bash
curl -X POST http://localhost:8000/api/v1/seed
```

This creates 3 sample incidents at various stages with tasks, timeline events, and suggestions.

## Roles

| Role | Slug | Responsibility |
|------|------|----------------|
| **ISO** | `iso` | Central coordinator. Dispatches tasks, manages suggestions, generates reports |
| **CISO** | `ciso` | Final notification decision |
| **DPO** | `dpo` | GDPR notifiability assessment |
| **Legal** | `legal` | Risk classification |
| **IT-Sec** | `itsec` | Forensics & security reports |
| **SysAdmin** | `sysadmin` | Creates incidents, provides technical details |
| **Communications** | `communications` | Stakeholder communication strategy |
| **Compliance** | `compliance` | Regulatory sign-off |

## Features

- **Incident Lifecycle**: draft -> triage -> assessment -> decision -> notification -> closed
- **Countdown Timers**: Live GDPR 72h, NIS2 24h/72h/1-month deadlines with color-coded urgency
- **Task Dispatch**: ISO dispatches tasks to roles; roles respond inline
- **Knowledge Base (RAG)**: Upload documents (PDF, DOCX, TXT), ask role-aware questions via GPT-4o + ChromaDB
- **Suggestion Engine**: Hybrid rule-based (~15 workflow rules) + AI-augmented suggestions
- **Report Generation**: AI-generated incident reports with markdown editing and PDF export
- **Timeline**: Full audit trail of all actions

## Demo Walkthrough

1. Select **SysAdmin** -> create a new incident
2. Switch to **ISO** -> dispatch assessment tasks to DPO, Legal, IT-Sec
3. Switch to **DPO** -> respond to notifiability assessment task
4. Switch to **Legal** -> respond to risk classification task
5. Switch to **ISO** -> generate suggestions -> dispatch CISO decision task
6. Switch to **CISO** -> make notification decision
7. Switch to **ISO** -> upload documents to KB -> generate final report -> export PDF

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), SQLite, OpenAI GPT-4o, ChromaDB, fpdf2
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, react-markdown
- **Auth**: None (role selection via UI, `X-Role` header)
