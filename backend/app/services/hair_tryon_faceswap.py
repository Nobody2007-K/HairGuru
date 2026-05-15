"""Virtual hair try-on via InsightFace face-swap.

Swaps the user's face onto a curated real-photo template of the chosen
hairstyle, producing a realistic "you with this haircut". CPU-only; uses the
inswapper_128 model (download via scripts/download_tryon_model.py) plus the
buffalo_l detection + recognition models (auto-downloaded by InsightFace).

Scoped to the try-on feature with the app's own hairstyle templates only.
"""

from __future__ import annotations

import base64
import io
import traceback
from pathlib import Path
from typing import Any, Optional

import numpy as np
from PIL import Image as PILImage

from . import tryon_references

_insightface_available = False
try:
    import insightface  # noqa: F401
    from insightface.app import FaceAnalysis  # noqa: F401

    _insightface_available = True
except Exception:
    pass

_app = None            # FaceAnalysis (detection + recognition)
_swapper = None        # INSwapper model
_init_failed = False
_template_cache: dict[str, Any] = {}   # style -> (bgr_image, Face)


def is_available() -> bool:
    from ..config import ENABLE_TRYON, INSWAPPER_MODEL

    return bool(ENABLE_TRYON) and _insightface_available and Path(INSWAPPER_MODEL).exists()


def _load() -> bool:
    """Lazily build the detector + swapper. Returns True on success."""
    global _app, _swapper, _init_failed
    if _init_failed:
        return False
    if _app is not None and _swapper is not None:
        return True

    try:
        from insightface.model_zoo import get_model

        from ..config import INSIGHTFACE_HOME, INSWAPPER_MODEL

        kwargs: dict[str, Any] = {
            "name": "buffalo_l",
            # Need detection (kps for alignment) + recognition (identity embedding).
            "allowed_modules": ["detection", "recognition"],
            "providers": ["CPUExecutionProvider"],
        }
        if INSIGHTFACE_HOME:
            kwargs["root"] = INSIGHTFACE_HOME

        app = FaceAnalysis(**kwargs)
        app.prepare(ctx_id=-1, det_size=(640, 640))

        swapper = get_model(INSWAPPER_MODEL, providers=["CPUExecutionProvider"])

        _app = app
        _swapper = swapper
        return True
    except Exception:
        traceback.print_exc()
        _init_failed = True
        return False


def _pil_to_bgr(img: PILImage.Image) -> np.ndarray:
    rgb = np.array(img.convert("RGB"))
    return rgb[:, :, ::-1].copy()


def _largest_face(faces):
    def area(f):
        x1, y1, x2, y2 = f.bbox
        return (x2 - x1) * (y2 - y1)

    return max(faces, key=area)


def _template_face(style_name: str):
    """Return (template_bgr, template_face) for a style, cached. None if unusable."""
    if style_name in _template_cache:
        return _template_cache[style_name]

    path = tryon_references.template_path(style_name)
    if path is None:
        _template_cache[style_name] = None
        return None
    try:
        bgr = _pil_to_bgr(PILImage.open(path))
        faces = _app.get(bgr)
        if not faces:
            _template_cache[style_name] = None
            return None
        entry = (bgr, _largest_face(faces))
        _template_cache[style_name] = entry
        return entry
    except Exception:
        traceback.print_exc()
        _template_cache[style_name] = None
        return None


def _encode_png_bgr(bgr: np.ndarray) -> str:
    rgb = bgr[:, :, ::-1]
    buf = io.BytesIO()
    PILImage.fromarray(rgb).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


class TryOnError(Exception):
    """User-actionable try-on failure (e.g. no face detected)."""


def try_on(image_bytes: bytes, hairstyle_name: str) -> Optional[str]:
    """Swap the user's face onto the hairstyle template. Returns a PNG data URL.

    Raises TryOnError with a friendly message for recoverable issues; returns
    None only if the engine itself is unavailable.
    """
    if not is_available() or not _load():
        return None

    template = _template_face(hairstyle_name)
    if template is None:
        raise TryOnError(f"'{hairstyle_name}' isn't available for try-on right now.")
    template_bgr, template_face = template

    try:
        user_img = PILImage.open(io.BytesIO(image_bytes))
    except Exception as exc:  # noqa: BLE001
        raise TryOnError("Could not read your photo.") from exc

    user_bgr = _pil_to_bgr(user_img)
    user_faces = _app.get(user_bgr)
    if not user_faces:
        raise TryOnError("No face detected in your photo. Use a clear, front-facing photo.")
    user_face = _largest_face(user_faces)

    result_bgr = _swapper.get(template_bgr.copy(), template_face, user_face, paste_back=True)
    return _encode_png_bgr(result_bgr)


def supported_styles() -> list[str]:
    """Styles whose template currently yields a detectable face (validates lazily)."""
    if not is_available() or not _load():
        return []
    out = []
    for style in tryon_references.all_styles():
        if _template_face(style) is not None:
            out.append(style)
    return out
