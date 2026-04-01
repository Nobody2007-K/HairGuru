from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


class FaceShape(str, Enum):
    OVAL = "Oval"
    ROUND = "Round"
    SQUARE = "Square"
    HEART = "Heart"
    OBLONG = "Oblong"
    DIAMOND = "Diamond"


@dataclass
class HairstyleRecommendation:
    id: str
    name: str
    match: int
    best_for: List[FaceShape]
    hair_type: str
    length: str
    maintenance: str


HAIRSTYLES: List[HairstyleRecommendation] = [
    HairstyleRecommendation(
        id="curtain-bangs",
        name="Curtain Bangs",
        match=92,
        best_for=[FaceShape.ROUND, FaceShape.HEART],
        hair_type="Straight",
        length="Long",
        maintenance="Medium",
    ),
    HairstyleRecommendation(
        id="textured-crop",
        name="Textured Crop",
        match=96,
        best_for=[FaceShape.OVAL, FaceShape.SQUARE],
        hair_type="Straight",
        length="Short",
        maintenance="Low",
    ),
    HairstyleRecommendation(
        id="wolf-cut",
        name="Wolf Cut",
        match=88,
        best_for=[FaceShape.OVAL, FaceShape.SQUARE],
        hair_type="Wavy",
        length="Medium",
        maintenance="Medium",
    ),
    HairstyleRecommendation(
        id="modern-quiff",
        name="Modern Quiff",
        match=93,
        best_for=[FaceShape.OVAL, FaceShape.OBLONG],
        hair_type="Wavy",
        length="Short",
        maintenance="Medium",
    ),
    HairstyleRecommendation(
        id="undercut",
        name="Undercut",
        match=91,
        best_for=[FaceShape.OVAL, FaceShape.SQUARE],
        hair_type="Straight",
        length="Short",
        maintenance="Medium",
    ),
    HairstyleRecommendation(
        id="crew-cut",
        name="Crew Cut",
        match=89,
        best_for=[FaceShape.OVAL, FaceShape.ROUND],
        hair_type="Straight",
        length="Short",
        maintenance="Low",
    ),
]


def recommend_hairstyles(face_shape: FaceShape, hair_type: Optional[str] = None) -> List[HairstyleRecommendation]:
    candidates = [style for style in HAIRSTYLES if face_shape in style.best_for]
    if hair_type:
        filtered = [
            style
            for style in candidates
            if style.hair_type.lower() == hair_type.lower()
        ]
    else:
        filtered = candidates

    if filtered:
        result = filtered
    elif candidates:
        result = candidates
    else:
        result = HAIRSTYLES

    return sorted(result, key=lambda style: style.match, reverse=True)[:5]
