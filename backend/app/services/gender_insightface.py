"""Gender (male/female) detection via InsightFace.

Uses the InsightFace ``buffalo_l`` pack (detection + gender/age) with onnxruntime
on CPU. The model is downloaded automatically to the InsightFace cache on first
use. Guarded imports mean a missing dependency simply disables the feature
instead of breaking the backend.

Output gender uses the frontend's vocabulary: "Men" / "Women".
"""

from __future__ import annotations

import io
import traceback
from typing import Any, Optional

import numpy as np
from PIL import Image as PILImage

_insightface_available = False
try:
    from insightface.app import FaceAnalysis  # noqa: F401

    _insightface_available = True
except Exception:
    pass

_app = None
_app_init_failed = False


def is_available() -> bool:
    from ..config import ENABLE_GENDER

    return bool(ENABLE_GENDER) and _insightface_available


def _get_app():
    """Lazily build the FaceAnalysis app (downloads model on first call)."""
    global _app, _app_init_failed
    if _app is not None or _app_init_failed:
        return _app

    try:
        from ..config import INSIGHTFACE_HOME

        kwargs: dict[str, Any] = {
            "name": "buffalo_l",
            # Skip the recognition embedding model — we only need detection + genderage.
            "allowed_modules": ["detection", "genderage"],
            "providers": ["CPUExecutionProvider"],
        }
        if INSIGHTFACE_HOME:
            kwargs["root"] = INSIGHTFACE_HOME

        app = FaceAnalysis(**kwargs)
        app.prepare(ctx_id=-1, det_size=(640, 640))
        _app = app
    except Exception:
        traceback.print_exc()
        _app_init_failed = True
        _app = None
    return _app


def _largest_face(faces):
    def area(f):
        x1, y1, x2, y2 = f.bbox
        return (x2 - x1) * (y2 - y1)

    return max(faces, key=area)


def detect(image_bytes: bytes) -> Optional[dict[str, Any]]:
    """Return {"gender": "Men"|"Women", "confidence": float} or None."""
    if not is_available():
        return None

    app = _get_app()
    if app is None:
        return None

    try:
        pil = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
        rgb = np.array(pil)
        bgr = rgb[:, :, ::-1]  # InsightFace expects BGR (OpenCV convention)

        faces = app.get(bgr)
        if not faces:
            return None

        face = _largest_face(faces)
        gender = "Men" if int(getattr(face, "gender", 1)) == 1 else "Women"
        confidence = round(float(getattr(face, "det_score", 0.9)), 3)
        return {"gender": gender, "confidence": confidence}
    except Exception:
        traceback.print_exc()
        return None
