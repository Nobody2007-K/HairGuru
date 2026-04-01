from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# --- Auth ---
class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=4, max_length=100)
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_initials: Optional[str] = None
    created_at: datetime


class MeResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    stats: Optional[dict[str, Any]] = None


# --- Analysis ---
class AnalyzeRequest(BaseModel):
    image_base64: str = Field(min_length=100)
    hair_type: Optional[str] = None
    engine: Optional[str] = "auto"
    # Optional manual override ("Men"/"Women"); when omitted, gender is auto-detected.
    gender: Optional[str] = None


class AnalyzeResponse(BaseModel):
    success: bool
    analysis_id: Optional[int] = None
    face_shape: Optional[str] = None
    gender: Optional[str] = None
    gender_confidence: Optional[float] = None
    confidence: Optional[float] = None
    measurements: Optional[dict[str, Any]] = None
    recommendations: Optional[list[dict[str, Any]]] = None
    engine_used: Optional[str] = None
    error: Optional[str] = None


# --- Recommendations ---
class RecommendationResponse(BaseModel):
    success: bool
    face_shape: Optional[str] = None
    recommendations: Optional[list[dict[str, Any]]] = None
    error: Optional[str] = None


# --- Try-On ---
class TryOnRequest(BaseModel):
    image_base64: str
    hairstyle_name: str = Field(min_length=1)
    mime_type: Optional[str] = "image/jpeg"


class TryOnResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    details: Optional[str] = None


# --- Saved Styles ---
class SaveStyleRequest(BaseModel):
    style_name: str
    style_id: Optional[str] = None
    image_url: Optional[str] = None


class SavedStyleResponse(BaseModel):
    success: bool
    saved_styles: Optional[list[dict[str, Any]]] = None
    history: Optional[list[dict[str, Any]]] = None
    error: Optional[str] = None


# --- Admin ---
class AdminStatsResponse(BaseModel):
    success: bool
    stats: Optional[dict[str, Any]] = None
    error: Optional[str] = None


# --- Health ---
class HealthResponse(BaseModel):
    status: str
    version: str
    engines: dict[str, bool]
