from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
HAIRGURU_MAIN = ROOT_DIR / "Hairguru-main"
AI_ENGINE_DIR = HAIRGURU_MAIN / "ai-engine"
HAIR_STYLE_REC_DIR = ROOT_DIR / "Hair_Style_Recommendation"
HAIRFAST_API_URL = os.environ.get("HAIRFAST_API_URL", "http://localhost:8000")

# Path to the MediaPipe FaceLandmarker model. The pip package does not bundle
# this file, so it is downloaded into backend/models. Override with an env var
# if you store it elsewhere.
MODELS_DIR = BACKEND_DIR / "models"
FACE_LANDMARKER_MODEL = os.environ.get(
    "FACE_LANDMARKER_MODEL", str(MODELS_DIR / "face_landmarker.task")
)

# Trained face-shape classifier (scikit-learn pipeline saved with joblib).
# Produced by backend/scripts/train_face_shape.py. If the file is absent the
# MediaPipe service falls back to its rule-based heuristic.
FACE_SHAPE_MODEL = os.environ.get(
    "FACE_SHAPE_MODEL", str(MODELS_DIR / "face_shape_model.joblib")
)

# Gender (male/female) detection via InsightFace.
ENABLE_GENDER = os.environ.get("ENABLE_GENDER", "1") not in ("0", "false", "False", "")
# Where InsightFace caches its downloaded models (defaults to ~/.insightface).
INSIGHTFACE_HOME = os.environ.get("INSIGHTFACE_HOME")

# Virtual try-on via InsightFace face-swap (inswapper). Lightweight CPU model;
# download once with scripts/download_tryon_model.py. If absent, try-on is disabled.
ENABLE_TRYON = os.environ.get("ENABLE_TRYON", "1") not in ("0", "false", "False", "")
INSWAPPER_MODEL = os.environ.get("INSWAPPER_MODEL", str(MODELS_DIR / "inswapper_128.onnx"))

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{ROOT_DIR / 'backend' / 'hairguru.db'}")

SECRET_KEY = os.environ.get("SECRET_KEY", "hairguru-dev-secret-key-change-in-production")
ALGORITHM = "HS256"

FACE_DETECTION_ENGINE = os.environ.get("FACE_DETECTION_ENGINE", "auto")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
