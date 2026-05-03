from __future__ import annotations

from typing import Any, Optional

from ..config import FACE_DETECTION_ENGINE
from .face_shape_dlib import detect as dlib_detect, is_available as dlib_available
from .face_shape_mediapipe import detect as mediapipe_detect, is_available as mediapipe_available
from .hairstyles_db import recommend as _recommend_styles


def detect_face_shape(
    image_bytes: bytes,
    hair_type: Optional[str] = None,
    engine: str = "auto",
    gender: Optional[str] = None,
) -> dict[str, Any]:
    engine = engine or FACE_DETECTION_ENGINE

    result = None
    engine_used = None

    if engine in ("auto", "mediapipe") and mediapipe_available():
        result = mediapipe_detect(image_bytes, hair_type, gender)
        if result:
            engine_used = "mediapipe"

    if engine in ("auto", "dlib") and dlib_available() and (engine == "dlib" or not result):
        dlib_result = dlib_detect(image_bytes, hair_type, gender)
        if dlib_result:
            if result:
                if dlib_result.get("confidence", 0) > result.get("confidence", 0):
                    result = dlib_result
                    engine_used = "dlib"
                else:
                    engine_used = "mediapipe"
            else:
                result = dlib_result
                engine_used = "dlib"

    if not result:
        result = {
            "face_shape": "Oval",
            "confidence": 0.5,
            "recommendations": _recommend_styles(face_shape="Oval", hair_type=hair_type, gender=gender, limit=5),
            "measurements": {},
        }
        engine_used = "fallback"

    result["engine_used"] = engine_used
    return result
