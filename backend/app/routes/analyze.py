from __future__ import annotations

import base64
import json
from typing import Optional

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Analysis, Recommendation
from ..schemas import AnalyzeRequest, AnalyzeResponse
from ..services.face_shape_orchestrator import detect_face_shape

router = APIRouter(prefix="/api", tags=["analyze"])


def _style_slug(name: str) -> str:
    """Convert a style display name into its slug id (e.g. "Curtain Bangs" -> "curtain-bangs")."""
    import re

    return re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")


def _normalize_gender(value: Optional[str]) -> Optional[str]:
    """Map any gender input to the canonical "Men"/"Women" (or None)."""
    if not value:
        return None
    v = value.strip().lower()
    if v in ("men", "man", "male", "m"):
        return "Men"
    if v in ("women", "woman", "female", "f"):
        return "Women"
    return None


def _get_user_id(auth_header: Optional[str] = None) -> Optional[int]:
    if not auth_header:
        return None

    from jose import JWTError, jwt

    from ..config import ALGORITHM, SECRET_KEY

    token = auth_header
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        return None


@router.post("/analyze")
def analyze_face(body: AnalyzeRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(raw)
    except Exception:
        return AnalyzeResponse(success=False, error="Invalid base64 image data")

    # Determine gender: explicit user override wins, otherwise auto-detect.
    gender = _normalize_gender(body.gender)
    gender_confidence: Optional[float] = 1.0 if gender else None
    if not gender:
        from ..services.gender_insightface import detect as detect_gender

        gender_result = detect_gender(image_bytes)
        if gender_result:
            gender = gender_result.get("gender")
            gender_confidence = gender_result.get("confidence")

    result = detect_face_shape(
        image_bytes, hair_type=body.hair_type, engine=body.engine or "auto", gender=gender
    )

    user_id = _get_user_id(authorization)

    analysis = Analysis(
        user_id=user_id,
        face_shape=result.get("face_shape", "Unknown"),
        gender=gender,
        confidence=result.get("confidence", 0.0),
        measurements=json.dumps(result.get("measurements", {})),
        image_base64=body.image_base64[:500],
        engine_used=result.get("engine_used", "unknown"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    recs = result.get("recommendations", [])
    for rec in recs:
        db_rec = Recommendation(
            analysis_id=analysis.id,
            user_id=user_id,
            style_name=rec.get("name", ""),
            match_score=rec.get("match", 0),
            gender=rec.get("gender"),
            length=rec.get("length"),
            hair_type=rec.get("hair_type"),
            maintenance=rec.get("maintenance"),
        )
        db.add(db_rec)

    db.commit()

    return AnalyzeResponse(
        success=True,
        analysis_id=analysis.id,
        face_shape=result.get("face_shape"),
        gender=gender,
        gender_confidence=gender_confidence,
        confidence=result.get("confidence"),
        measurements=result.get("measurements", {}),
        recommendations=recs,
        engine_used=result.get("engine_used", "unknown"),
    )


@router.get("/analyze/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        return AnalyzeResponse(success=False, error="Analysis not found")

    recs = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).all()
    recommendations = [
        dict(
            # Stable style slug (e.g. "curtain-bangs") so the frontend can match
            # the recommendation to its local image instead of a DB row id.
            id=_style_slug(r.style_name),
            name=r.style_name,
            match=r.match_score,
            gender=r.gender,
            length=r.length,
            hair_type=r.hair_type,
            maintenance=r.maintenance,
            best_for=[analysis.face_shape] if analysis.face_shape else [],
        )
        for r in recs
    ]

    return AnalyzeResponse(
        success=True,
        analysis_id=analysis.id,
        face_shape=analysis.face_shape,
        gender=analysis.gender,
        confidence=analysis.confidence,
        recommendations=recommendations,
        engine_used=analysis.engine_used,
    )
