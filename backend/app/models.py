from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    avatar_initials = Column(String(4), nullable=True)
    password_hash = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    face_shape = Column(String(20), nullable=False)
    gender = Column(String(10), nullable=True)
    confidence = Column(Float, nullable=False)
    measurements = Column(Text, nullable=True)
    image_base64 = Column(Text, nullable=True)
    engine_used = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    style_name = Column(String(100), nullable=False)
    match_score = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=True)
    length = Column(String(20), nullable=True)
    hair_type = Column(String(20), nullable=True)
    maintenance = Column(String(20), nullable=True)
    image_url = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class SavedStyle(Base):
    __tablename__ = "saved_styles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    style_name = Column(String(100), nullable=False)
    style_id = Column(String(50), nullable=True)
    image_url = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
