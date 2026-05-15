"""Reference hairstyle templates for the face-swap try-on.

Each try-on style maps to a real photo (face visible) already in the repo. The
user's face is swapped onto this template, so the result shows the user wearing
that hairstyle. Higher-res src/assets photos are preferred; small public/styles
thumbnails are fallbacks.

Illustration assets (e.g. style-bob.jpg, style-pixie.jpg) are intentionally
excluded — InsightFace cannot reliably detect a face in a drawing.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from ..config import HAIRGURU_MAIN

# style name -> path relative to Hairguru-main (real photos with a visible face)
_TEMPLATES: dict[str, str] = {
    # Men-oriented cuts
    "Buzz Cut": "src/assets/style-buzz.jpg",
    "Textured Crop": "src/assets/style-textured-crop.jpg",
    "Pompadour": "src/assets/style-pompadour.jpg",
    "Quiff": "src/assets/style-quiff.jpg",
    "Wolf Cut": "src/assets/style-wolf.jpg",
    "Side Part": "src/assets/style-side-part.jpg",
    "Slick Back": "public/styles/Slick_back.jfif",
    "Crew Cut": "public/styles/Crew_Cut.jfif",
    "Low Fade": "public/styles/Low_Fade.jfif",
    "Mid Fade": "public/styles/Mid_Fade.jfif",
    "High Fade": "public/styles/High_Fade.jfif",
    "French Crop": "public/styles/Caesar.jfif",
    # Women-oriented cut (real photo)
    "Layered": "src/assets/style-layered.jpg",
}


def all_styles() -> list[str]:
    return list(_TEMPLATES.keys())


def template_path(style_name: str) -> Optional[Path]:
    rel = _TEMPLATES.get(style_name)
    if not rel:
        return None
    p = HAIRGURU_MAIN / rel
    return p if p.exists() else None
