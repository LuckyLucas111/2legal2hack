from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import incidents, tasks, timeline, dashboard, documents, knowledge_base, suggestions, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Incident Response Tool", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(tasks.router)
app.include_router(timeline.router)
app.include_router(dashboard.router)
app.include_router(documents.router)
app.include_router(knowledge_base.router)
app.include_router(suggestions.router)
app.include_router(reports.router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/seed")
async def seed_demo_data():
    from app.seed.demo_data import seed
    await seed()
    return {"status": "seeded"}
