"""Scale-invariant facial geometry features for face-shape classification.

This module is the single source of truth for the feature vector used by BOTH
the training script (``backend/scripts/train_face_shape.py``) and inference
(``face_shape_mediapipe.py``), so the two can never drift apart.

Input: ``landmarks`` is a list of dicts ``{"x": px, "y": px, ...}`` in pixel
coordinates, exactly as produced by the MediaPipe FaceLandmarker mapping in
``face_shape_mediapipe.detect`` (468 FaceMesh points).
"""

from __future__ import annotations

import math
from typing import Sequence

import numpy as np

FEATURE_VERSION = 3

# MediaPipe FaceMesh (468) landmark indices used for face-shape geometry.
CHIN = 152            # bottom of the chin
FOREHEAD_TOP = 10     # top-center of the forehead
GLABELLA = 168        # bridge of the nose, between the eyes
SUBNASALE = 2         # base of the nose
CHEEK_L, CHEEK_R = 234, 454      # widest point of the face (zygomatic) -> reference
JAW_UP_L, JAW_UP_R = 58, 288     # upper jaw / gonial angle
JAW_LOW_L, JAW_LOW_R = 172, 397  # lower jaw
JAW_CHIN_L, JAW_CHIN_R = 149, 378  # jaw near the chin
FOREHEAD_L, FOREHEAD_R = 21, 251   # upper forehead corners
TEMPLE_L, TEMPLE_R = 54, 284       # temples / hairline
BROW_L, BROW_R = 70, 300           # brow line
LOWCHEEK_L, LOWCHEEK_R = 132, 361  # lower cheek
EYE_OUT_L, EYE_OUT_R = 33, 263     # outer eye corners (inter-ocular reference)

# Order is fixed and must match between training and inference.
FEATURE_NAMES = [
    "length_ratio",
    "forehead_brow_w",
    "temple_w",
    "brow_w",
    "jaw_upper_w",
    "jaw_lower_w",
    "jaw_chin_w",
    "lowcheek_w",
    "chin_taper",
    "forehead_to_jaw",
    "jawlower_to_jawupper",
    "forehead_to_temple",
    "interocular_to_cheek",
    "length_over_interocular",
    "vthird_forehead",
    "vthird_mid",
    "vthird_lower",
    "chin_angle",
    "jaw_angle_left",
    "jaw_angle_right",
    "cheek_over_jawupper",
    "cheek_over_forehead",
    "forehead_over_lowcheek",
    "jawchin_taper",
    "width_variation",
    "forehead_dominance",
]


def _pt(landmarks: Sequence[dict], i: int) -> tuple[float, float]:
    lm = landmarks[i]
    return float(lm["x"]), float(lm["y"])


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _angle(vertex: tuple[float, float], p1: tuple[float, float], p2: tuple[float, float]) -> float:
    """Angle (degrees) at ``vertex`` formed by the rays to ``p1`` and ``p2``."""
    v1 = (p1[0] - vertex[0], p1[1] - vertex[1])
    v2 = (p2[0] - vertex[0], p2[1] - vertex[1])
    n1 = math.hypot(*v1)
    n2 = math.hypot(*v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)
    cos = max(-1.0, min(1.0, cos))
    return math.degrees(math.acos(cos))


def compute_feature_vector(landmarks: Sequence[dict]) -> tuple[list[str], np.ndarray]:
    """Return (feature_names, values) for the given pixel-space landmarks."""
    P = lambda i: _pt(landmarks, i)  # noqa: E731

    cheek = _dist(P(CHEEK_L), P(CHEEK_R)) or 1.0
    interocular = _dist(P(EYE_OUT_L), P(EYE_OUT_R)) or 1.0

    length = _dist(P(FOREHEAD_TOP), P(CHIN))
    forehead_brow = _dist(P(FOREHEAD_L), P(FOREHEAD_R))
    temple = _dist(P(TEMPLE_L), P(TEMPLE_R))
    brow = _dist(P(BROW_L), P(BROW_R))
    jaw_upper = _dist(P(JAW_UP_L), P(JAW_UP_R)) or 1.0
    jaw_lower = _dist(P(JAW_LOW_L), P(JAW_LOW_R))
    jaw_chin = _dist(P(JAW_CHIN_L), P(JAW_CHIN_R))
    lowcheek = _dist(P(LOWCHEEK_L), P(LOWCHEEK_R))

    third_total = length or 1.0
    vthird_forehead = _dist(P(FOREHEAD_TOP), P(GLABELLA)) / third_total
    vthird_mid = _dist(P(GLABELLA), P(SUBNASALE)) / third_total
    vthird_lower = _dist(P(SUBNASALE), P(CHIN)) / third_total

    chin_angle = _angle(P(CHIN), P(JAW_LOW_L), P(JAW_LOW_R))
    jaw_angle_left = _angle(P(JAW_LOW_L), P(JAW_UP_L), P(CHIN))
    jaw_angle_right = _angle(P(JAW_LOW_R), P(JAW_UP_R), P(CHIN))

    values = [
        length / cheek,                       # length_ratio
        forehead_brow / cheek,                # forehead_brow_w
        temple / cheek,                       # temple_w
        brow / cheek,                         # brow_w
        jaw_upper / cheek,                    # jaw_upper_w
        jaw_lower / cheek,                    # jaw_lower_w
        jaw_chin / cheek,                     # jaw_chin_w
        lowcheek / cheek,                     # lowcheek_w
        (cheek - jaw_lower) / cheek,          # chin_taper
        forehead_brow / jaw_upper,            # forehead_to_jaw
        jaw_lower / jaw_upper,                # jawlower_to_jawupper
        forehead_brow / (temple or 1.0),      # forehead_to_temple
        interocular / cheek,                  # interocular_to_cheek
        length / interocular,                 # length_over_interocular
        vthird_forehead,                      # vthird_forehead
        vthird_mid,                           # vthird_mid
        vthird_lower,                         # vthird_lower
        chin_angle / 180.0,                   # chin_angle
        jaw_angle_left / 180.0,               # jaw_angle_left
        jaw_angle_right / 180.0,              # jaw_angle_right
        cheek / jaw_upper,                    # cheek_over_jawupper
        cheek / (forehead_brow or 1.0),       # cheek_over_forehead
        forehead_brow / (lowcheek or 1.0),    # forehead_over_lowcheek
        (cheek - jaw_chin) / cheek,           # jawchin_taper
        float(np.std([                        # width_variation (uniform=round, varied=heart/diamond)
            forehead_brow / cheek, temple / cheek, 1.0,
            jaw_upper / cheek, jaw_lower / cheek, jaw_chin / cheek,
        ])),
        # forehead_dominance: how much the forehead exceeds the average of the
        # cheek + jaw region (strongly positive for Heart).
        (forehead_brow - (jaw_upper + jaw_lower) / 2.0) / cheek,  # forehead_dominance
    ]

    return list(FEATURE_NAMES), np.asarray(values, dtype=np.float64)
