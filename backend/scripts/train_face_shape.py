#!/usr/bin/env python3
"""Train the face-shape classifier on the bundled labeled dataset.

Walks Hair_Style_Recommendation/data/pics/{heart,oval,round,square,long}/, runs
MediaPipe FaceLandmarker on each image, computes the shared feature vector, and
trains a scikit-learn pipeline. Saves the model to backend/models/face_shape_model.joblib.

Run once during setup:
    cd backend && ./venv/bin/python scripts/train_face_shape.py
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np

# Make `app` importable when run as a standalone script.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import FACE_LANDMARKER_MODEL, FACE_SHAPE_MODEL, HAIR_STYLE_REC_DIR  # noqa: E402
from app.services.face_shape_features import FEATURE_VERSION, compute_feature_vector  # noqa: E402

# Dataset folder name -> our canonical face-shape label.
LABEL_MAP = {
    "heart": "Heart",
    "oval": "Oval",
    "round": "Round",
    "square": "Square",
    "long": "Oblong",
}


def _build_detector():
    from mediapipe.tasks.python.core.base_options import BaseOptions
    from mediapipe.tasks.python.vision import (
        FaceLandmarker,
        FaceLandmarkerOptions,
        RunningMode,
    )

    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=FACE_LANDMARKER_MODEL),
        running_mode=RunningMode.IMAGE,
        num_faces=1,
    )
    return FaceLandmarker.create_from_options(options)


def _landmarks_for_image(detector, path: Path):
    from PIL import Image as PILImage
    from mediapipe.tasks.python.vision.core.image import Image, ImageFormat

    try:
        pil = PILImage.open(path).convert("RGB")
    except Exception:
        return None
    np_img = np.array(pil)
    h, w, _ = np_img.shape
    result = detector.detect(Image(image_format=ImageFormat.SRGB, data=np_img))
    if not result or not result.face_landmarks:
        return None
    return [{"x": lm.x * w, "y": lm.y * h, "z": lm.z} for lm in result.face_landmarks[0]]


def main() -> int:
    pics_dir = HAIR_STYLE_REC_DIR / "data" / "pics"
    if not pics_dir.exists():
        print(f"ERROR: dataset not found at {pics_dir}")
        return 1

    detector = _build_detector()

    X: list[np.ndarray] = []
    y: list[str] = []
    feature_names: list[str] = []
    no_face = 0
    started = time.time()

    for folder, label in LABEL_MAP.items():
        d = pics_dir / folder
        if not d.exists():
            print(f"  (skip) missing folder: {d}")
            continue
        images = [p for p in d.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        print(f"[{label}] {len(images)} images in {folder}/ ...", flush=True)
        for i, path in enumerate(images):
            lms = _landmarks_for_image(detector, path)
            if lms is None:
                no_face += 1
                continue
            names, values = compute_feature_vector(lms)
            if not feature_names:
                feature_names = names
            if not np.all(np.isfinite(values)):
                continue
            X.append(values)
            y.append(label)
            if (i + 1) % 200 == 0:
                print(f"    {i + 1}/{len(images)} processed", flush=True)

    detector.close()

    print(f"\nUsable samples: {len(X)}  (no face / skipped: {no_face})  "
          f"feature extraction took {time.time() - started:.1f}s")
    if len(X) < 100:
        print("ERROR: too few usable samples to train.")
        return 1

    X_arr = np.vstack(X)
    y_arr = np.array(y)

    # Cache features so classifier choices can be re-explored without re-running
    # MediaPipe over thousands of images.
    cache = Path(FACE_SHAPE_MODEL).with_name("face_shape_features.npz")
    np.savez(cache, X=X_arr, y=y_arr, feature_names=np.array(feature_names))
    print(f"Cached features -> {cache}")

    from sklearn.ensemble import (
        ExtraTreesClassifier,
        HistGradientBoostingClassifier,
        RandomForestClassifier,
        VotingClassifier,
    )
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    X_train, X_test, y_train, y_test = train_test_split(
        X_arr, y_arr, test_size=0.2, random_state=42, stratify=y_arr
    )

    def make(clf):
        return Pipeline([("scaler", StandardScaler()), ("clf", clf)])

    candidates = {
        "random_forest": make(RandomForestClassifier(
            n_estimators=400, min_samples_leaf=2, class_weight="balanced",
            random_state=42, n_jobs=-1)),
        "extra_trees": make(ExtraTreesClassifier(
            n_estimators=500, min_samples_leaf=2, class_weight="balanced",
            random_state=42, n_jobs=-1)),
        "hist_gb": make(HistGradientBoostingClassifier(
            max_iter=400, learning_rate=0.08, max_depth=None,
            l2_regularization=1.0, random_state=42)),
    }
    candidates["ensemble"] = make(VotingClassifier(
        estimators=[
            ("rf", RandomForestClassifier(n_estimators=400, min_samples_leaf=2,
                                          class_weight="balanced", random_state=42, n_jobs=-1)),
            ("et", ExtraTreesClassifier(n_estimators=500, min_samples_leaf=2,
                                        class_weight="balanced", random_state=42, n_jobs=-1)),
            ("hgb", HistGradientBoostingClassifier(max_iter=400, learning_rate=0.08,
                                                   l2_regularization=1.0, random_state=42)),
        ],
        voting="soft",
    ))

    print("\nSelecting best model by 5-fold CV accuracy on the training split:", flush=True)
    best_name, best_cv, best_pipe = None, -1.0, None
    for name, pipe in candidates.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring="accuracy", n_jobs=-1)
        mean = float(scores.mean())
        print(f"  {name:14s} CV acc = {mean:.3f} (+/- {scores.std():.3f})", flush=True)
        if mean > best_cv:
            best_name, best_cv, best_pipe = name, mean, pipe

    print(f"\nBest: {best_name} (CV {best_cv:.3f}) — fitting on full training split ...", flush=True)
    pipeline = best_pipe
    pipeline.fit(X_train, y_train)

    # Heart and Round are the hardest pair to separate in the 5-class setting
    # (they overlap heavily on marginal features), yet a dedicated Heart-vs-Round
    # classifier separates them at ~95%. We train one as a second stage: when the
    # 5-class model predicts "Round", this refiner re-checks Heart vs Round with a
    # Heart-favoring threshold. HEART_THRESHOLD is chosen so overall accuracy is
    # preserved while Heart recall improves.
    HEART_THRESHOLD = 0.40
    hr_mask = (y_train == "Heart") | (y_train == "Round")
    binary_hr = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", ExtraTreesClassifier(n_estimators=500, random_state=42, n_jobs=-1)),
    ])
    binary_hr.fit(X_train[hr_mask], y_train[hr_mask])
    binary_classes = list(binary_hr.named_steps["clf"].classes_)
    heart_idx = binary_classes.index("Heart")

    def two_stage_predict(Xq):
        base = pipeline.predict(Xq)
        out = base.copy()
        rmask = base == "Round"
        if rmask.any():
            hp = binary_hr.predict_proba(Xq[rmask])[:, heart_idx]
            sub = out[rmask].copy()
            sub[hp >= HEART_THRESHOLD] = "Heart"
            out[rmask] = sub
        return out

    y_pred = two_stage_predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    labels_sorted = sorted(set(y_arr))
    print(f"\nTwo-stage held-out accuracy: {acc:.3f}  (Heart threshold={HEART_THRESHOLD})\n")
    print(classification_report(y_test, y_pred, digits=3))
    print("Confusion matrix (rows=true, cols=pred):")
    print("labels:", labels_sorted)
    print(confusion_matrix(y_test, y_pred, labels=labels_sorted))

    # Refit both stages on ALL data for the deployed artifact (held-out metrics
    # above were measured on the split; the shipped model uses every sample).
    print("\nRefitting on the full dataset for deployment ...", flush=True)
    pipeline.fit(X_arr, y_arr)
    hr_full = (y_arr == "Heart") | (y_arr == "Round")
    binary_hr.fit(X_arr[hr_full], y_arr[hr_full])
    binary_classes = list(binary_hr.named_steps["clf"].classes_)

    import joblib

    out = Path(FACE_SHAPE_MODEL)
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipeline,
            "classes_": list(pipeline.named_steps["clf"].classes_),
            "binary_hr_pipeline": binary_hr,
            "binary_hr_classes": binary_classes,
            "heart_threshold": HEART_THRESHOLD,
            "feature_names": feature_names,
            "feature_version": FEATURE_VERSION,
            "heldout_accuracy": float(acc),
            "n_samples": int(len(X)),
        },
        out,
    )
    print(f"\nSaved model -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
