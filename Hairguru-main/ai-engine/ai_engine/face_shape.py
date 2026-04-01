from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import cv2
import mediapipe as mp

from .hairstyle_recommender import FaceShape, HairstyleRecommendation, recommend_hairstyles

mp_face_mesh = mp.solutions.face_mesh

LANDMARK_INDICES = {
    "left_jaw": 234,
    "right_jaw": 454,
    "chin": 152,
    "left_cheek": 93,
    "right_cheek": 323,
    "forehead_center": 10,
    "left_forehead": 127,
    "right_forehead": 356,
}


def _to_point(landmark: mp.framework.formats.landmark_pb2.NormalizedLandmark, width: int, height: int) -> Dict[str, float]:
    return {"x": landmark.x * width, "y": landmark.y * height}


def _distance(a: Dict[str, float], b: Dict[str, float]) -> float:
    return ((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2) ** 0.5


@dataclass
class FaceMeasurements:
    image_width: int
    image_height: int
    face_width_px: float
    face_height_px: float
    jaw_width_px: float
    forehead_width_px: float
    cheekbone_width_px: float
    face_width: float
    face_height: float
    jaw_width: float
    forehead_width: float
    width_to_height_ratio: float
    height_to_width_ratio: float
    jaw_to_cheek_ratio: float
    forehead_to_cheek_ratio: float
    forehead_to_jaw_ratio: float


def compute_face_measurements(landmarks: List[Dict[str, float]], width: int, height: int) -> FaceMeasurements:
    left_jaw = landmarks[LANDMARK_INDICES["left_jaw"]]
    right_jaw = landmarks[LANDMARK_INDICES["right_jaw"]]
    chin = landmarks[LANDMARK_INDICES["chin"]]
    left_cheek = landmarks[LANDMARK_INDICES["left_cheek"]]
    right_cheek = landmarks[LANDMARK_INDICES["right_cheek"]]
    forehead_center = landmarks[LANDMARK_INDICES["forehead_center"]]
    left_forehead = landmarks[LANDMARK_INDICES["left_forehead"]]
    right_forehead = landmarks[LANDMARK_INDICES["right_forehead"]]

    face_width_px = _distance(left_cheek, right_cheek)
    jaw_width_px = _distance(left_jaw, right_jaw)
    forehead_width_px = _distance(left_forehead, right_forehead)
    face_height_px = _distance(chin, forehead_center)
    cheekbone_width_px = face_width_px

    face_width = face_width_px / width if width else 0.0
    jaw_width = jaw_width_px / width if width else 0.0
    forehead_width = forehead_width_px / width if width else 0.0
    face_height = face_height_px / height if height else 0.0

    width_to_height_ratio = face_width / face_height if face_height else 0.0
    height_to_width_ratio = face_height / face_width if face_width else 0.0
    jaw_to_cheek_ratio = jaw_width / face_width if face_width else 0.0
    forehead_to_cheek_ratio = forehead_width / face_width if face_width else 0.0
    forehead_to_jaw_ratio = forehead_width / jaw_width if jaw_width else 0.0

    return FaceMeasurements(
        image_width=width,
        image_height=height,
        face_width_px=face_width_px,
        face_height_px=face_height_px,
        jaw_width_px=jaw_width_px,
        forehead_width_px=forehead_width_px,
        cheekbone_width_px=cheekbone_width_px,
        face_width=face_width,
        face_height=face_height,
        jaw_width=jaw_width,
        forehead_width=forehead_width,
        width_to_height_ratio=width_to_height_ratio,
        height_to_width_ratio=height_to_width_ratio,
        jaw_to_cheek_ratio=jaw_to_cheek_ratio,
        forehead_to_cheek_ratio=forehead_to_cheek_ratio,
        forehead_to_jaw_ratio=forehead_to_jaw_ratio,
    )


def log_face_measurements(image_path: str, measurements: FaceMeasurements, face_shape: FaceShape) -> None:
    print(f"Image: {image_path}")
    print(f"  image_width={measurements.image_width}, image_height={measurements.image_height}")
    print(f"  face_width_px={measurements.face_width_px:.2f}, face_height_px={measurements.face_height_px:.2f}")
    print(f"  jaw_width_px={measurements.jaw_width_px:.2f}, forehead_width_px={measurements.forehead_width_px:.2f}")
    print(f"  cheekbone_width_px={measurements.cheekbone_width_px:.2f}")
    print(f"  face_width_norm={measurements.face_width:.4f}, face_height_norm={measurements.face_height:.4f}")
    print(f"  jaw_width_norm={measurements.jaw_width:.4f}, forehead_width_norm={measurements.forehead_width:.4f}")
    print(f"  width_to_height_ratio={measurements.width_to_height_ratio:.4f}, height_to_width_ratio={measurements.height_to_width_ratio:.4f}")
    print(f"  jaw_to_cheek_ratio={measurements.jaw_to_cheek_ratio:.4f}, forehead_to_cheek_ratio={measurements.forehead_to_cheek_ratio:.4f}")
    print(f"  forehead_to_jaw_ratio={measurements.forehead_to_jaw_ratio:.4f}")
    print(f"  predicted_face_shape={face_shape.value}\n")


def detect_face_shape_from_measurements(measurements: FaceMeasurements) -> FaceShape:
    if measurements.height_to_width_ratio >= 1.55:
        return FaceShape.OBLONG

    if (
        0.95 <= measurements.jaw_to_cheek_ratio <= 1.05
        and 0.95 <= measurements.forehead_to_cheek_ratio <= 1.05
        and 0.95 <= measurements.height_to_width_ratio <= 1.15
    ):
        return FaceShape.SQUARE

    if (
        abs(measurements.height_to_width_ratio - 1.0) <= 0.10
        and abs(measurements.jaw_to_cheek_ratio - 1.0) <= 0.10
        and abs(measurements.forehead_to_cheek_ratio - 1.0) <= 0.10
    ):
        return FaceShape.ROUND

    if (
        measurements.forehead_to_cheek_ratio > 1.05
        and measurements.jaw_to_cheek_ratio < 0.85
        and measurements.height_to_width_ratio > 1.05
    ):
        return FaceShape.HEART

    if (
        measurements.face_width > measurements.forehead_width
        and measurements.face_width > measurements.jaw_width
        and measurements.forehead_to_cheek_ratio < 0.95
        and measurements.jaw_to_cheek_ratio < 0.95
        and measurements.height_to_width_ratio > 1.05
    ):
        return FaceShape.DIAMOND

    return FaceShape.OVAL


def detect_face_shape_from_landmarks(landmarks: List[Dict[str, float]], width: int, height: int) -> tuple[FaceShape, FaceMeasurements]:
    measurements = compute_face_measurements(landmarks, width, height)
    face_shape = detect_face_shape_from_measurements(measurements)
    return face_shape, measurements


@dataclass
class FaceAnalysis:
    face_shape: FaceShape
    confidence: float
    recommendations: List[HairstyleRecommendation]
    measurements: FaceMeasurements


def analyze_face_shape(image_path: str, hair_type: Optional[str] = None, debug: bool = False) -> FaceAnalysis:
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    height, width, _ = image.shape
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as face_mesh:
        result = face_mesh.process(image_rgb)
        if not result.multi_face_landmarks:
            raise ValueError("No face detected in the provided image.")

        face_landmarks = result.multi_face_landmarks[0].landmark
        mapped = [_to_point(lm, width, height) for lm in face_landmarks]
        face_shape, measurements = detect_face_shape_from_landmarks(mapped, width, height)
        recommendations = recommend_hairstyles(face_shape, hair_type)
        confidence = float(
            result.multi_face_landmarks[0].landmark[1].visibility
            if hasattr(result.multi_face_landmarks[0].landmark[1], "visibility")
            else 0.95
        )

        if debug:
            log_face_measurements(image_path, measurements, face_shape)

        return FaceAnalysis(
            face_shape=face_shape,
            confidence=confidence,
            recommendations=recommendations,
            measurements=measurements,
        )


def analyze_face_shape_json(image_path: str, hair_type: Optional[str] = None, debug: bool = False) -> Dict[str, Any]:
    analysis = analyze_face_shape(image_path, hair_type=hair_type, debug=debug)
    return {
        "faceShape": analysis.face_shape.value,
        "confidence": analysis.confidence,
        "recommendations": [rec.__dict__ for rec in analysis.recommendations],
        "measurements": {
            "face_width_px": analysis.measurements.face_width_px,
            "face_height_px": analysis.measurements.face_height_px,
            "jaw_width_px": analysis.measurements.jaw_width_px,
            "forehead_width_px": analysis.measurements.forehead_width_px,
            "cheekbone_width_px": analysis.measurements.cheekbone_width_px,
            "face_width_norm": analysis.measurements.face_width,
            "face_height_norm": analysis.measurements.face_height,
            "jaw_width_norm": analysis.measurements.jaw_width,
            "forehead_width_norm": analysis.measurements.forehead_width,
            "width_to_height_ratio": analysis.measurements.width_to_height_ratio,
            "height_to_width_ratio": analysis.measurements.height_to_width_ratio,
            "jaw_to_cheek_ratio": analysis.measurements.jaw_to_cheek_ratio,
            "forehead_to_cheek_ratio": analysis.measurements.forehead_to_cheek_ratio,
            "forehead_to_jaw_ratio": analysis.measurements.forehead_to_jaw_ratio,
        },
    }
