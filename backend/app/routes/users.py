from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Analysis, Recommendation, SavedStyle, User
from ..routes.auth import get_current_user
from ..schemas import SaveStyleRequest, SavedStyleResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )

    history = []
    for a in analyses:
        recs = (
            db.query(Recommendation)
            .filter(Recommendation.analysis_id == a.id)
            .all()
        )
        history.append({
            "id": a.id,
            "face_shape": a.face_shape,
            "confidence": a.confidence,
            "engine_used": a.engine_used,
            "created_at": a.created_at.isoformat(),
            "recommendations": [
                {"name": r.style_name, "match": r.match_score} for r in recs
            ],
        })

    return SavedStyleResponse(success=True, history=history)


@router.get("/saved")
def get_saved_styles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = (
        db.query(SavedStyle)
        .filter(SavedStyle.user_id == current_user.id)
        .order_by(SavedStyle.created_at.desc())
        .all()
    )

    return SavedStyleResponse(
        success=True,
        saved_styles=[
            {
                "id": s.id,
                "style_name": s.style_name,
                "style_id": s.style_id,
                "image_url": s.image_url,
                "created_at": s.created_at.isoformat(),
            }
            for s in saved
        ],
    )


@router.post("/saved")
def save_style(
    body: SaveStyleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(SavedStyle)
        .filter(
            SavedStyle.user_id == current_user.id,
            SavedStyle.style_name == body.style_name,
        )
        .first()
    )
    if existing:
        return SavedStyleResponse(success=True)

    saved = SavedStyle(
        user_id=current_user.id,
        style_name=body.style_name,
        style_id=body.style_id,
        image_url=body.image_url,
    )
    db.add(saved)
    db.commit()

    return SavedStyleResponse(success=True)


@router.delete("/saved/{style_id}")
def delete_saved_style(
    style_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedStyle)
        .filter(
            SavedStyle.id == style_id,
            SavedStyle.user_id == current_user.id,
        )
        .first()
    )
    if saved:
        db.delete(saved)
        db.commit()

    return SavedStyleResponse(success=True)
