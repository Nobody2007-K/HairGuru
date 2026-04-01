from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS
from .database import init_db
from .routes.admin import router as admin_router
from .routes.analyze import router as analyze_router
from .routes.auth import router as auth_router
from .routes.recommendations import router as recommendations_router
from .routes.tryon import router as tryon_router
from .routes.users import router as users_router
from .schemas import HealthResponse
from .services.face_shape_dlib import is_available as dlib_available
from .services.face_shape_mediapipe import is_available as mediapipe_available


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="HairGuru API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(recommendations_router)
app.include_router(tryon_router)
app.include_router(users_router)
app.include_router(admin_router)


@app.get("/api/health")
def health():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        engines={
            "mediapipe": mediapipe_available(),
            "dlib": dlib_available(),
        },
    )
