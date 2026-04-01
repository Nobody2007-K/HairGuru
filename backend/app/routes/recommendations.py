from __future__ import annotations

from typing import Optional

from fastapi import APIRouter

from ..schemas import RecommendationResponse
from ..services.hairstyles_db import HAIRSTYLES, recommend, to_camel

router = APIRouter(prefix="/api", tags=["recommendations"])


@router.get("/recommendations")
def get_recommendations(
    face_shape: Optional[str] = None,
    hair_type: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 10,
):
    results = recommend(face_shape=face_shape, hair_type=hair_type, gender=gender, limit=limit)
    return RecommendationResponse(
        success=True,
        face_shape=face_shape,
        recommendations=[to_camel(s) for s in results],
    )


@router.get("/hairstyles")
def get_all_hairstyles():
    return {"success": True, "hairstyles": [to_camel(s) for s in HAIRSTYLES]}
