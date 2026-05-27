"""Single source of truth for the hairstyle catalog.

Previously this list was duplicated (without gender) across the MediaPipe
service, the orchestrator fallback, and the recommendations route. It now lives
here once, including a ``gender`` field ("Men" / "Women" / "Unisex") that matches
the frontend catalog in ``Hairguru-main/src/lib/hairstyles.ts``.

``best_for`` tags are intentionally broad so that every (face shape, gender)
combination has at least a few viable matches.
"""

from __future__ import annotations

from typing import Any, Optional

# Canonical catalog. Snake_case keys are the internal/analysis shape; a camelCase
# view for the public recommendations endpoints is produced by ``to_camel``.
HAIRSTYLES: list[dict[str, Any]] = [
    {"id": "textured-crop", "name": "Textured Crop", "image": "/styles/Texture_Crop.jfif", "match": 96, "maintenance": "Low", "styling_time": "3 min", "best_for": ["Oval", "Square", "Heart", "Round"], "gender": "Men", "length": "Short", "hair_type": "Straight", "trending": True},
    {"id": "modern-quiff", "name": "Modern Quiff", "image": "/styles/Quiff.jfif", "match": 93, "maintenance": "Medium", "styling_time": "7 min", "best_for": ["Oval", "Oblong", "Square", "Heart"], "gender": "Men", "length": "Short", "hair_type": "Wavy", "trending": True},
    {"id": "side-part", "name": "Side Part", "image": "/styles/Side_Part.jfif", "match": 91, "maintenance": "Low", "styling_time": "4 min", "best_for": ["Oval", "Round", "Square", "Heart"], "gender": "Men", "length": "Short", "hair_type": "Straight"},
    {"id": "pompadour", "name": "Pompadour", "image": "/styles/pompadour.jfif", "match": 89, "maintenance": "High", "styling_time": "10 min", "best_for": ["Square", "Oval", "Oblong", "Round"], "gender": "Men", "length": "Medium", "hair_type": "Straight"},
    {"id": "buzz-cut", "name": "Buzz Cut", "image": "/styles/Buzz_Cut.jfif", "match": 84, "maintenance": "Low", "styling_time": "1 min", "best_for": ["Oval", "Square", "Round", "Diamond"], "gender": "Men", "length": "Short", "hair_type": "Straight"},
    {"id": "layered-cut", "name": "Layered Cut", "image": "/styles/Slick_back.jfif", "match": 95, "maintenance": "Medium", "styling_time": "8 min", "best_for": ["Oval", "Heart", "Round", "Square", "Oblong"], "gender": "Women", "length": "Long", "hair_type": "Wavy", "trending": True},
    {"id": "curtain-bangs", "name": "Curtain Bangs", "image": "/styles/Caesar.jfif", "match": 92, "maintenance": "Medium", "styling_time": "6 min", "best_for": ["Round", "Heart", "Oblong", "Oval"], "gender": "Unisex", "length": "Long", "hair_type": "Straight", "trending": True},
    {"id": "wolf-cut", "name": "Wolf Cut", "image": "/styles/Man_Bun.jfif", "match": 88, "maintenance": "Medium", "styling_time": "7 min", "best_for": ["Oval", "Square", "Round", "Heart"], "gender": "Unisex", "length": "Medium", "hair_type": "Wavy", "trending": True},
    {"id": "bob-cut", "name": "Bob Cut", "image": "/styles/Crew_Cut.jfif", "match": 90, "maintenance": "Low", "styling_time": "5 min", "best_for": ["Heart", "Oval", "Square", "Round"], "gender": "Women", "length": "Medium", "hair_type": "Straight"},
    {"id": "pixie-cut", "name": "Pixie Cut", "image": "/styles/Undercut_Fade.jfif", "match": 87, "maintenance": "Low", "styling_time": "4 min", "best_for": ["Heart", "Oval", "Oblong", "Round"], "gender": "Women", "length": "Short", "hair_type": "Straight"},
]


def _gender_matches(style_gender: str, wanted: Optional[str]) -> bool:
    """A style fits the wanted gender if it is that gender or Unisex."""
    if not wanted:
        return True
    return style_gender == wanted or style_gender == "Unisex"


def recommend(
    face_shape: Optional[str] = None,
    hair_type: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Return gender- and shape-aware recommendations (snake_case dicts).

    Filters by face shape, then by gender (matching gender + Unisex), then by
    hair type. Backfills with the best remaining gender-appropriate styles so the
    caller always gets a usable set instead of one or two results.
    """
    pool = list(HAIRSTYLES)

    shape_pool = [s for s in pool if face_shape in s.get("best_for", [])] if face_shape else pool
    if not shape_pool:
        shape_pool = pool

    gendered = [s for s in shape_pool if _gender_matches(s["gender"], gender)]

    if hair_type:
        typed = [s for s in gendered if s.get("hair_type", "").lower() == hair_type.lower()]
        if typed:
            gendered = typed

    results = list(gendered)

    # Backfill: if too few, add other gender-appropriate styles (any shape).
    if len(results) < min(limit, 4):
        extras = [
            s for s in pool
            if _gender_matches(s["gender"], gender) and s not in results
        ]
        extras.sort(key=lambda s: s.get("match", 0), reverse=True)
        results.extend(extras)

    results.sort(key=lambda s: s.get("match", 0), reverse=True)
    return results[:limit]


def to_camel(style: dict[str, Any]) -> dict[str, Any]:
    """camelCase view matching the frontend Hairstyle type / public API shape."""
    return {
        "id": style["id"],
        "name": style["name"],
        "image": style.get("image"),
        "match": style.get("match"),
        "maintenance": style.get("maintenance"),
        "stylingTime": style.get("styling_time"),
        "bestFor": style.get("best_for", []),
        "gender": style.get("gender"),
        "length": style.get("length"),
        "hairType": style.get("hair_type"),
        "trending": style.get("trending", False),
    }
