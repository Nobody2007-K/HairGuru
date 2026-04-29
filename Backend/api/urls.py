"""
HAIRGURU - API URL Configuration
----------------------------------
All endpoints prefixed with /api/ (set in hairguru/urls.py).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Router for ViewSets
router = DefaultRouter()
router.register(r'face-shapes', views.FaceShapeViewSet, basename='faceshape')
router.register(r'hairstyles', views.HairstyleViewSet, basename='hairstyle')
router.register(r'favorites', views.UserFavoriteViewSet, basename='favorite')
router.register(r'feedback', views.UserFeedbackViewSet, basename='feedback')

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health-check'),

    # Authentication
    path('auth/register/', views.register_user, name='auth-register'),
    path('auth/login/', views.login_user, name='auth-login'),
    path('auth/logout/', views.logout_user, name='auth-logout'),
    path('auth/profile/', views.user_profile, name='auth-profile'),

    # Face Analysis (ML)
    path('analyze/', views.analyze_face, name='analyze-face'),

    # Analysis History
    path('analyses/', views.UserAnalysisListView.as_view(), name='analysis-list'),
    path('analyses/<int:analysis_id>/', views.analysis_detail, name='analysis-detail'),

    # Router URLs (face-shapes, hairstyles, favorites, feedback)
    path('', include(router.urls)),
]
