# HAIRGURU 💇‍♂️

**AI-Powered Hairstyle Recommendation System**

HAIRGURU is an intelligent web application that detects a user's face shape from a photo and recommends personalized hairstyles. It uses deep learning (EfficientNet) for face shape classification and a PostgreSQL-backed recommendation engine to suggest the best cuts while advising which styles to avoid.

> 🎓 *2nd Semester Innovation Project*

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Face Shape Classes](#face-shape-classes)
- [Model Training](#model-training)
- [Database](#database)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Team](#team)

---

## Features

- **Face Detection & Alignment** — Detect and crop faces using MediaPipe / face-alignment, with auto rotation correction via eye landmarks.
- **Face Shape Classification** — Classify into 5 categories (Heart, Oblong, Oval, Round, Square) using a fine-tuned EfficientNetB0 CNN.
- **Smart Recommendations** — Blend top-2 predicted shapes with confidence-weighted scoring for nuanced hairstyle suggestions.
- **Styles to Avoid** — Warn users about cuts that don't suit their face shape, with explanations.
- **User Accounts** — Save analysis history, bookmark favorite styles, and leave feedback.
- **PostgreSQL Database** — Fully relational database with 8 tables, performance indexes, and auto-update triggers.

---

## System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Backend    │────▶│   PostgreSQL DB  │
│  HTML / CSS  │     │ Python/Flask │     │   hairguru_db    │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                     ┌──────▼───────┐
                     │  AI/ML Model │
                     │ EfficientNet │
                     │  B0 (260px)  │
                     └──────────────┘
```

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| **Frontend**    | HTML, CSS (Responsive)                          |
| **Backend**     | Python (Flask / FastAPI)                        |
| **ML/AI**       | TensorFlow, EfficientNetB0, MediaPipe, OpenCV   |
| **Database**    | PostgreSQL 16, psycopg2                         |
| **Training**    | Google Colab (GPU), Keras                       |

---

## Project Structure

```
Innovation/
├── README.md                    # This file
├── faceshape_detection.ipynb    # Model training & inference notebook
│
├── Database/
│   ├── schema.sql               # PostgreSQL schema (8 tables)
│   ├── seed_data.sql            # Seed data (5 shapes, 22 hairstyles)
│   ├── db_config.py             # Connection configuration
│   ├── db_setup.py              # One-command DB setup script
│   ├── db_helper.py             # Reusable query functions
│   └── requirements.txt         # Python dependencies
│
├── Backend/                     # (API server - TBD)
├── Frontend/                    # (Web interface - TBD)
├── Documentation/               # Project documentation & reports
│   ├── HAIRGURU_Project_Document.md
│   ├── HAIRGURU_Project_Document.pdf
│   └── HAIRGURU_Documentation.html
│
├── archive/
│   └── FaceShape Dataset/       # Raw training images
│
└── MD files/                    # Planning & notes
```

---

## Face Shape Classes

| Shape    | Description                                                   | Styling Tip                                          |
|----------|---------------------------------------------------------------|------------------------------------------------------|
| **Heart**    | Wider forehead/cheekbones, narrowing to a pointed chin    | Soften wide forehead; keep top balanced              |
| **Oblong**   | Longer than wide, uniform width forehead to jaw           | Reduce face length; avoid excess height              |
| **Oval**     | Balanced proportions, slightly wider at cheekbones        | Most styles work — avoid extremes                    |
| **Round**    | Similar width & length, soft curved features              | Add height and angles to reduce roundness            |
| **Square**   | Strong angular jawline, forehead ≈ jaw width              | Texture and clean structure work best                |

---

## Model Training

Training is done in `faceshape_detection.ipynb` on Google Colab with GPU.

### Pipeline

1. **Preprocessing** — Face detection via MediaPipe, eye-alignment rotation, margin-based cropping, resize to 260×260.
2. **Dataset** — 5,000 images (4,000 train / 1,000 test) across 5 classes.
3. **Architecture** — EfficientNetB0 (ImageNet pretrained) with:
   - Data augmentation (flip, rotation, zoom, contrast)
   - GlobalAveragePooling2D → Dropout(0.30) → Dense(5, softmax)
4. **Training Strategy**:
   - **Stage 1**: Frozen backbone, lr=1e-3, 15 epochs
   - **Stage 2A**: Unfreeze top layers, lr=1e-5, 5 epochs
   - **Stage 2B**: Polish with lr=3e-6, 20 epochs
5. **Best Result**: ~56% accuracy (5-class problem, val set)

### Best Model

```
face_shape_b0_260_final.keras   (saved on Google Drive)
```

---

## Database

PostgreSQL database with 8 fully relational tables:

| Table                        | Description                              |
|------------------------------|------------------------------------------|
| `face_shapes`                | 5 face shape categories with notes       |
| `hairstyles`                 | 22 hairstyle entries with metadata       |
| `face_shape_recommendations` | Which styles suit which shapes (M:N)     |
| `face_shape_avoid`           | Styles to avoid per shape, with reasons  |
| `users`                      | User accounts (UUID primary key)         |
| `user_analyses`              | ML prediction history per photo          |
| `user_favorites`             | Bookmarked hairstyles                    |
| `user_feedback`              | Ratings & comments on recommendations    |

### ER Diagram (Simplified)

```
face_shapes ──┬── face_shape_recommendations ──── hairstyles
              └── face_shape_avoid ────────────── hairstyles

users ──┬── user_analyses (stores ML probabilities)
        ├── user_favorites ──── hairstyles
        └── user_feedback ───── hairstyles
```

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- PostgreSQL 14+ (running locally)

### 1. Clone / Open the Project

```bash
cd Innovation
```

### 2. Install Python Dependencies

```bash
pip install -r Database/requirements.txt
```

### 3. Configure Database Connection

Edit `Database/db_config.py` with your PostgreSQL credentials:

```python
DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "database": "hairguru_db",
    "user":     "postgres",
    "password": "your_password",
}
```

### 4. Create & Seed the Database

```bash
cd Database
python db_setup.py
```

To reset (drop & recreate):

```bash
python db_setup.py --reset
```

### 5. Verify

```bash
python db_helper.py
```

Expected output:

```
=== HAIRGURU DB Helper Demo ===

Face Shapes:
  1. Heart      - Soften wide forehead; keep top balanced.
  2. Oblong     - Reduce face length; avoid excess height.
  3. Oval       - Balanced face - most styles work, avoid extremes.
  4. Round      - Add height and angles to reduce roundness.
  5. Square     - Strong jaw works best with texture and clean structure.

Recommended for Square face:
  [+] Crew cut / Ivy League
  [+] Side part taper
  [+] Textured crop + mid fade

Blended Recommendations (Square 45%, Oblong 26%):
  [*] Crew cut / Ivy League (score: 0.6338)
  [*] Side part taper (score: 0.6338)
  ...
```

---

## Usage

### From Python (Backend Integration)

```python
from Database.db_helper import (
    get_recommended_hairstyles,
    get_avoid_hairstyles,
    get_recommendations_for_top2,
)

# Get recommendations for a single face shape
recs = get_recommended_hairstyles("Square")

# Get hairstyles to avoid
avoids = get_avoid_hairstyles("Round")

# Blend top-2 predictions from the model
blended = get_recommendations_for_top2("Square", "Oblong", 0.45, 0.26)
```

### Model Inference (from notebook)

```python
result = predict_and_recommend("path/to/photo.jpg")
print(result["top2_shapes"])    # [('Square', 0.45), ('Oblong', 0.26)]
print(result["recommended"])    # ['Crew cut / Ivy League', ...]
print(result["avoid"])          # ['Ultra boxy flat-top', ...]
```

---

## Team

**HAIRGURU** — 2nd Semester Innovation Project

---

*Built with ❤ using Python, TensorFlow, and PostgreSQL*
