# HairGuru AI Engine

This package contains the Python face shape detection and hairstyle recommendation engine.

## What it does

- Uses MediaPipe Face Mesh to detect facial landmarks from an image.
- Analyzes face geometry with landmark heuristics.
- Classifies the face shape into common categories.
- Recommends hairstyles that best match the detected face shape.

## Installation

```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

```bash
python -m ai_engine path/to/photo.jpg --hair-type wavy
```

Or from Python:

```python
from ai_engine import analyze_face_shape

result = analyze_face_shape("photo.jpg", hair_type="Wavy")
print(result.face_shape)
print([s.name for s in result.recommendations])
```

## Notes

The current Python implementation is the active AI engine. The previous TypeScript face-shape proof-of-concept is preserved in `legacy-ts/` for reference.

This implementation is inspired by the GitHub face-shape detection + hairstyle recommendation concept and was reworked into a Python-based engine for the project.
