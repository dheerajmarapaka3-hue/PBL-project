import os
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure cross-platform MIME type recognition for media streaming
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")

from app.config import settings
from app.database import Base, engine
import app.models  # Ensure all models are registered with Base.metadata

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.vitals import router as vitals_router
from app.api.documents import router as documents_router
from app.api.medicines import router as medicines_router
from app.api.nutrition import router as nutrition_router
from app.api.workouts import router as workouts_router
from app.api.meditation import router as meditation_router
from app.api.routines import router as routines_router
from app.api.goals import router as goals_router
from app.api.chat import router as chat_router
from app.api.exercises import router as exercises_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Your personal AI-powered health and wellness companion.",
    lifespan=lifespan,
)

# CORS setup - supports local development and configurable production domains
allowed_origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
}
if settings.frontend_url:
    for origin in settings.frontend_url.split(","):
        cleaned = origin.strip()
        if cleaned:
            allowed_origins.add(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# Root status
@app.get("/")
def root():
    return {
        "message": "Welcome to HealthMate AI API",
        "status": "running",
        "version": settings.app_version,
    }


@app.get("/api/v1/health")
def health_check():
    db_scheme = str(engine.url).split("://")[0] if "://" in str(engine.url) else "sqlite"
    db_type = "postgresql" if "postgres" in db_scheme else "sqlite"
    return {
        "status": "healthy",
        "service": "HealthMate AI API",
        "database": f"{db_type}_connected",
        "version": settings.app_version,
    }


# Include modular routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(vitals_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(medicines_router, prefix="/api/v1")
app.include_router(nutrition_router, prefix="/api/v1")
app.include_router(workouts_router, prefix="/api/v1")
app.include_router(exercises_router, prefix="/api/v1")
app.include_router(meditation_router, prefix="/api/v1")
app.include_router(routines_router, prefix="/api/v1")
app.include_router(goals_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")

# Mount exercise media files portably for high-performance direct streaming
BACKEND_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent

candidates_repdb = [
    Path(os.environ["REPDB_IMAGES_DIR"]) if os.environ.get("REPDB_IMAGES_DIR") else None,
    BACKEND_DIR / "static" / "exercises" / "repdb",
    WORKSPACE_DIR / "exercise-dataset-main" / "exercise-dataset-main" / "images" / "flat",
    WORKSPACE_DIR / "exercise-dataset-main" / "images" / "flat",
    Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\RepDB\exercise-dataset-main\images\flat"),
]
REPDB_IMAGES_DIR = next((p for p in candidates_repdb if p and p.is_dir()), None)

candidates_flow = [
    Path(os.environ["FLOW_ASSETS_DIR"]) if os.environ.get("FLOW_ASSETS_DIR") else None,
    BACKEND_DIR / "static" / "exercises" / "flow",
    WORKSPACE_DIR / "datasets" / "Flow" / "flow-exercise-dataset-main",
    Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\Flow\flow-exercise-dataset-main"),
]
FLOW_ASSETS_DIR = next((p for p in candidates_flow if p and p.is_dir()), None)

if REPDB_IMAGES_DIR and REPDB_IMAGES_DIR.exists():
    app.mount("/static/exercises/repdb", StaticFiles(directory=str(REPDB_IMAGES_DIR)), name="repdb_static")

if FLOW_ASSETS_DIR and FLOW_ASSETS_DIR.exists():
    app.mount("/static/exercises/flow", StaticFiles(directory=str(FLOW_ASSETS_DIR)), name="flow_static")
