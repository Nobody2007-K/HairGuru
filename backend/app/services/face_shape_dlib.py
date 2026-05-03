from __future__ import annotations

import sys
import traceback
from pathlib import Path
from typing import Any, Optional

import numpy as np
from PIL import Image as PILImage

from ..config import HAIR_STYLE_REC_DIR

_dlib_available = False
_data_loaded = False
_scaler: Optional[StandardScaler] = None
_pca: Optional[PCA] = None
_mlp: Optional[MLPClassifier] = None
_feature_columns: list[str] = []
_all_features_csv: Optional[Path] = None
_face_recognition = None
pd = None
PCA = None
MLPClassifier = None
StandardScaler = None

# The optional dlib/scikit-learn engine depends on heavy packages that are not
# part of the base requirements (face_recognition + dlib, pandas, scikit-learn).
# Guard the imports so a missing dependency simply disables this engine instead
# of crashing the whole backend at import time.
try:
    import face_recognition as _fr
    import pandas as pd  # noqa: F811
    from sklearn.decomposition import PCA  # noqa: F811
    from sklearn.neural_network import MLPClassifier  # noqa: F811
    from sklearn.preprocessing import StandardScaler  # noqa: F811

    _face_recognition = _fr
    _dlib_available = True
except ImportError:
    pass


def _load_training_data():
    global _data_loaded, _scaler, _pca, _mlp, _feature_columns, _all_features_csv

    if _data_loaded:
        return True

    csv_path = HAIR_STYLE_REC_DIR / "all_features.csv"
    if not csv_path.exists():
        return False

    _all_features_csv = csv_path

    try:
        data = pd.read_csv(str(csv_path), index_col=None)
        if "Unnamed: 0" in data.columns:
            data = data.drop("Unnamed: 0", axis=1)

        data_clean = data.dropna(axis=0, how="any")

        feature_cols = [c for c in data_clean.columns if c not in ("filenum", "filename", "classified_shape")]
        _feature_columns = feature_cols

        X = data_clean[feature_cols]
        Y = data_clean["classified_shape"]

        _scaler = StandardScaler()
        X_scaled = _scaler.fit_transform(X)

        _pca = PCA(n_components=min(18, X_scaled.shape[1]), svd_solver="randomized", whiten=True)
        _pca.fit(X_scaled)

        X_scaled = X.to_numpy()

        _mlp = MLPClassifier(
            activation="relu",
            alpha=0.0001,
            batch_size="auto",
            beta_1=0.9,
            beta_2=0.999,
            early_stopping=False,
            epsilon=1e-08,
            hidden_layer_sizes=(60, 100, 30, 100),
            learning_rate="constant",
            learning_rate_init=0.01,
            max_iter=100,
            momentum=0.9,
            nesterovs_momentum=True,
            power_t=0.5,
            random_state=525,
            shuffle=True,
            solver="sgd",
            tol=0.0001,
            validation_fraction=0.1,
            verbose=False,
            warm_start=False,
        )
        _mlp.fit(X_scaled, Y)

        _data_loaded = True
        return True

    except Exception:
        traceback.print_exc()
        return False


def is_available() -> bool:
    return _dlib_available


def _extract_landmarks(image_bytes: bytes) -> Optional[list[float]]:
    try:
        pil_image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
        np_image = np.array(pil_image)

        face_landmarks_list = _face_recognition.face_landmarks(np_image)
        if not face_landmarks_list:
            return None

        landmarks = face_landmarks_list[0]
        pts = []

        facial_features = [
            "chin", "left_eyebrow", "right_eyebrow", "nose_bridge",
            "nose_tip", "left_eye", "right_eye", "top_lip", "bottom_lip",
        ]

        for feature in facial_features:
            for point in landmarks[feature]:
                pts.append(float(point[0]))
                pts.append(float(point[1]))

        return pts

    except Exception:
        traceback.print_exc()
        return None


import io


def _compute_features(pts: list[float]) -> list[float]:
    features = []

    for j in range(0, 17):
        if j != 16 and j != 17:
            px = pts[j * 2]
            py = pts[j * 2 + 1]
            chin_x = pts[16]
            chin_y = pts[17]
            x_diff = float(px - chin_x)
            y_diff = float(np.absolute(py - chin_y)) if py < chin_y else 0.1
            angle = np.absolute(np.degrees(np.arctan(x_diff / y_diff)))
            features.append(angle)

    a, b = pts[0], pts[1]
    c, d = pts[32], pts[33]
    e, f = pts[16], pts[17]
    g, h = pts[56], pts[57]

    face_width = np.sqrt(np.square(a - c) + np.square(b - d))
    face_height = np.sqrt(np.square(e - g) + np.square(f - h)) * 2
    features.append(face_width)
    features.append(face_height)
    features.append(face_height / face_width if face_width else 0)

    i, j = pts[12], pts[13]
    k, l = pts[20], pts[21]
    jaw_width = np.sqrt(np.square(i - k) + np.square(j - l))
    features.append(jaw_width)
    features.append(jaw_width / face_width if face_width else 0)

    m, n = pts[8], pts[9]
    o, p = pts[24], pts[25]
    mid_jaw = np.sqrt(np.square(m - o) + np.square(n - p))
    features.append(mid_jaw)
    features.append(mid_jaw / jaw_width if jaw_width else 0)

    return features


def detect(
    image_bytes: bytes, hair_type: Optional[str] = None, gender: Optional[str] = None
) -> Optional[dict[str, Any]]:
    if not _dlib_available:
        return None

    if not _load_training_data():
        return None

    try:
        pts = _extract_landmarks(image_bytes)
        if pts is None:
            return None

        features = _compute_features(pts)

        feature_array = np.array(features).reshape(1, -1)
        feature_scaled = _scaler.transform(feature_array)
        prediction = _mlp.predict(feature_scaled)
        face_shape = str(prediction[0]).capitalize()

        from ..config import HAIRGURU_MAIN
        sys.path.insert(0, str(HAIRGURU_MAIN / "ai-engine"))

        from ai_engine.hairstyle_recommender import FaceShape, HAIRSTYLES, recommend_hairstyles

        shape_map = {
            "Heart": FaceShape.HEART,
            "Long": FaceShape.OBLONG,
            "Oval": FaceShape.OVAL,
            "Round": FaceShape.ROUND,
            "Square": FaceShape.SQUARE,
        }

        fs_enum = shape_map.get(face_shape, FaceShape.OVAL)
        recs = recommend_hairstyles(fs_enum, hair_type)

        recommendations = []
        for rec in recs:
            recommendations.append({
                "id": rec.id,
                "name": rec.name,
                "match": rec.match,
                "best_for": [s.value for s in rec.best_for],
                "hair_type": rec.hair_type,
                "length": rec.length,
                "maintenance": rec.maintenance,
            })

        return {
            "face_shape": face_shape,
            "confidence": 0.92,
            "recommendations": recommendations,
            "measurements": {},
            "dlib_features": features,
        }

    except Exception:
        traceback.print_exc()
        return None
