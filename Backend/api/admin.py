"""
HAIRGURU - Django Admin Configuration
"""

from django.contrib import admin
from .models import (
    FaceShape, Hairstyle, FaceShapeRecommendation, FaceShapeAvoid,
    User, UserAnalysis, UserFavorite, UserFeedback,
)


@admin.register(FaceShape)
class FaceShapeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'note', 'created_at']
    search_fields = ['name']


@admin.register(Hairstyle)
class HairstyleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'gender', 'length_category', 'created_at']
    list_filter = ['gender', 'length_category']
    search_fields = ['name', 'description']


@admin.register(FaceShapeRecommendation)
class FaceShapeRecommendationAdmin(admin.ModelAdmin):
    list_display = ['id', 'face_shape', 'hairstyle', 'score']
    list_filter = ['face_shape']


@admin.register(FaceShapeAvoid)
class FaceShapeAvoidAdmin(admin.ModelAdmin):
    list_display = ['id', 'face_shape', 'hairstyle', 'reason']
    list_filter = ['face_shape']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'full_name', 'gender', 'created_at']
    search_fields = ['username', 'email', 'full_name']
    list_filter = ['gender']


@admin.register(UserAnalysis)
class UserAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'primary_shape', 'secondary_shape', 'analyzed_at']
    list_filter = ['primary_shape']


@admin.register(UserFavorite)
class UserFavoriteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'hairstyle', 'saved_at']


@admin.register(UserFeedback)
class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'hairstyle', 'rating', 'created_at']
    list_filter = ['rating']
