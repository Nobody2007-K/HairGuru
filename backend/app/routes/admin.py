from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Analysis, Recommendation, SavedStyle, User
from ..routes.auth import get_current_user
from ..schemas import AdminStatsResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_analyses = db.query(func.count(Analysis.id)).scalar() or 0
    total_saved = db.query(func.count(SavedStyle.id)).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_analyses = (
        db.query(func.count(Analysis.id))
        .filter(Analysis.created_at >= today_start)
        .scalar()
        or 0
    )

    shape_distribution = (
        db.query(Analysis.face_shape, func.count(Analysis.id).label("count"))
        .group_by(Analysis.face_shape)
        .order_by(func.count(Analysis.id).desc())
        .all()
    )

    popular_styles = (
        db.query(Recommendation.style_name, func.count(Recommendation.id).label("count"))
        .group_by(Recommendation.style_name)
        .order_by(func.count(Recommendation.id).desc())
        .limit(5)
        .all()
    )

    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )

    return AdminStatsResponse(
        success=True,
        stats={
            "total_users": total_users,
            "total_analyses": total_analyses,
            "total_saved": total_saved,
            "today_analyses": today_analyses,
            "shape_distribution": [
                {"name": s[0] or "Unknown", "value": s[1]} for s in shape_distribution
            ],
            "popular_styles": [
                {"name": s[0], "count": s[1]} for s in popular_styles
            ],
            "recent_users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "display_name": u.display_name,
                    "avatar_initials": u.avatar_initials,
                    "created_at": u.created_at.isoformat(),
                }
                for u in recent_users
            ],
        },
    )
