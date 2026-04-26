# 2legal2hack — Incident Response Tool

A locally-hosted GDPR/NIS2 incident response management tool for coordinating data breach response across 8 organizational roles. Runs fully offline with mock AI responses — no API keys required.

## Quick Start

### Prerequisites

- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- Node.js 18+

### Windows Installer

On Windows, you can use the small installer script from the project root:

```powershell
.\install-windows.cmd
```

It checks Python/Node/npm, creates the backend virtual environment, prepares local data folders, installs backend and frontend dependencies, and can start both dev servers.

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

- **Countdown Timers**: Live GDPR 72h, NIS2 24h/72h/1-month deadlines with color-coded urgency
- **Task Dispatch**: ISO dispatches tasks to roles; roles respond inline with text or document uploads
- **Automatic Overview Updates**: Uploading documents or submitting task responses automatically extracts and populates incident fields (GDPR applicability, severity, risk classification, individuals affected, etc.)
- **Suggestion Engine**: Automatic task suggestions generated when the ISO views the Tasks tab. Hybrid rule-based (~15 workflow rules) + AI-generated suggestions that the ISO can edit, dispatch, or dismiss
- **Knowledge Base**: Upload documents (PDF, DOCX, TXT, MD) and ask role-aware questions via a chat interface. Document parsing is fully functional; responses currently use mock data
- **Report Generation**: Generate incident reports with markdown editing and PDF export. Report content currently uses mock data
- **Timeline**: Full audit trail of all actions
- **Sample Scenario**: Includes 10 synthesized documents for a Trade Republic USB incident walkthrough (`sample-documents/trade-republic-usb-incident/`)

## Demo Walkthrough

1. Select **SysAdmin** → create a new incident (or seed demo data for a pre-populated scenario)
2. Switch to **ISO** → open the Tasks tab to see automatic suggestions → dispatch tasks to IT-Sec, DPO, Legal
3. Switch to **IT-Sec** → respond to the forensic analysis task
4. Switch to **DPO** → respond to the notifiability assessment task (overview fields auto-update)
5. Switch to **Legal** → respond to the risk classification task (overview fields auto-update)
6. Switch to **ISO** → new suggestions appear (CISO decision, communications) → dispatch CISO decision task
7. Switch to **CISO** → make the notification decision
8. Switch to **ISO** → upload sample documents to KB → query the knowledge base → generate final report → export PDF

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), SQLite, sentence-transformers, fpdf2
- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS v4, shadcn/ui, react-markdown
- **AI**: Mock responses with architecture ready for OpenAI GPT integration (ChromaDB for RAG embeddings)
- **Auth**: None (role selection via UI, `X-Role` header)
