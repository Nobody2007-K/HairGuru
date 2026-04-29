"""
HAIRGURU - API Views
---------------------
REST API endpoints for the HAIRGURU backend.
"""

import os
import uuid
import logging
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q

from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    FaceShape, Hairstyle, FaceShapeRecommendation, FaceShapeAvoid,
    User, UserAnalysis, UserFavorite, UserFeedback,
)
from .serializers import (
    FaceShapeSerializer, FaceShapeDetailSerializer,
    HairstyleSerializer, HairstyleDetailSerializer,
    RecommendationSerializer, AvoidSerializer,
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserAnalysisSerializer, AnalysisResultSerializer,
    UserFavoriteSerializer, UserFeedbackSerializer,
)

logger = logging.getLogger(__name__)


# ============================================================
# Face Shapes
# ============================================================
class FaceShapeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/face-shapes/          — List all face shapes
    GET /api/face-shapes/{id}/     — Face shape detail with recommendations
    """
    queryset = FaceShape.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FaceShapeDetailSerializer
        return FaceShapeSerializer

    @action(detail=True, methods=['get'], url_path='recommendations')
    def recommendations(self, request, pk=None):
        """GET /api/face-shapes/{id}/recommendations/ — Recommended hairstyles."""
        face_shape = self.get_object()
        recs = FaceShapeRecommendation.objects.filter(
            face_shape=face_shape
        ).select_related('hairstyle').order_by('-score')
        serializer = RecommendationSerializer(recs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='avoid')
    def avoid(self, request, pk=None):
        """GET /api/face-shapes/{id}/avoid/ — Hairstyles to avoid."""
        face_shape = self.get_object()
        avoids = FaceShapeAvoid.objects.filter(
            face_shape=face_shape
        ).select_related('hairstyle')
        serializer = AvoidSerializer(avoids, many=True)
        return Response(serializer.data)


# ============================================================
# Hairstyles
# ============================================================
class HairstyleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/hairstyles/           — List all hairstyles (with filtering)
    GET /api/hairstyles/{id}/      — Hairstyle detail with compatibility info
    """
    queryset = Hairstyle.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HairstyleDetailSerializer
        return HairstyleSerializer

    def get_queryset(self):
        queryset = Hairstyle.objects.all()

        # Filter by gender
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(Q(gender=gender) | Q(gender='unisex'))

        # Filter by length
        length = self.request.query_params.get('length')
        if length:
            queryset = queryset.filter(length_category=length)

        # Filter by face shape name (recommended styles)
        face_shape = self.request.query_params.get('face_shape')
        if face_shape:
            queryset = queryset.filter(
                recommended_for__face_shape__name__iexact=face_shape
            )

        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.distinct()


# ============================================================
# Authentication
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    POST /api/auth/register/
    Body: { username, email, password, password_confirm, full_name?, gender? }
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Registration successful!',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    POST /api/auth/login/
    Body: { username, password }
    """
    serializer = UserLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    # Try to find user and check password
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    login(request, user)
    return Response({
        'message': 'Login successful!',
        'user': UserProfileSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """POST /api/auth/logout/"""
    logout(request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    GET  /api/auth/profile/ — Get current user profile
    PUT  /api/auth/profile/ — Update profile (full_name, gender, profile_image)
    """
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# Face Analysis (ML Inference)
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_face(request):
    """
    POST /api/analyze/
    Upload a face photo → get face shape prediction + hairstyle recommendations.

    Body (multipart/form-data): { image: <file> }

    Returns:
    {
        analysis_id, primary_shape, secondary_shape,
        probabilities, recommended_hairstyles, avoid_hairstyles,
        blended_recommendations
    }
    """
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided. Send as "image" in multipart form data.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    image_file = request.FILES['image']

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if image_file.content_type not in allowed_types:
        return Response(
            {'error': f'Invalid file type: {image_file.content_type}. Allowed: JPEG, PNG, WebP'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Save the uploaded image
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', str(request.user.id))
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}_{image_file.name}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, 'wb+') as dest:
        for chunk in image_file.chunks():
            dest.write(chunk)

    # Run ML inference
    try:
        probabilities = _predict_face_shape(filepath)
    except Exception as e:
        logger.error(f"ML inference failed: {e}")
        return Response(
            {'error': f'Face shape analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Get top-2 predictions
    sorted_probs = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    primary_name, primary_prob = sorted_probs[0]
    secondary_name, secondary_prob = sorted_probs[1]

    # Look up face shape IDs
    primary_shape = FaceShape.objects.filter(name=primary_name).first()
    secondary_shape = FaceShape.objects.filter(name=secondary_name).first()

    # Save analysis to DB
    analysis = UserAnalysis.objects.create(
        user=request.user,
        image_path=filepath,
        prob_heart=Decimal(str(round(probabilities.get('Heart', 0), 4))),
        prob_oblong=Decimal(str(round(probabilities.get('Oblong', 0), 4))),
        prob_oval=Decimal(str(round(probabilities.get('Oval', 0), 4))),
        prob_round=Decimal(str(round(probabilities.get('Round', 0), 4))),
        prob_square=Decimal(str(round(probabilities.get('Square', 0), 4))),
        primary_shape=primary_shape,
        secondary_shape=secondary_shape,
    )

    # Get recommended hairstyles for primary shape
    recommended = []
    if primary_shape:
        recs = FaceShapeRecommendation.objects.filter(
            face_shape=primary_shape
        ).select_related('hairstyle').order_by('-score')
        recommended = HairstyleSerializer([r.hairstyle for r in recs], many=True).data

    # Get hairstyles to avoid for primary shape
    avoid = []
    if primary_shape:
        avoids = FaceShapeAvoid.objects.filter(
            face_shape=primary_shape
        ).select_related('hairstyle')
        avoid = [
            {**HairstyleSerializer(a.hairstyle).data, 'reason': a.reason}
            for a in avoids
        ]

    # Get blended recommendations (top-2 shapes weighted by probability)
    blended = _get_blended_recommendations(
        primary_name, secondary_name, primary_prob, secondary_prob
    )

    return Response({
        'analysis_id': analysis.id,
        'primary_shape': primary_name,
        'primary_probability': round(primary_prob, 4),
        'secondary_shape': secondary_name,
        'secondary_probability': round(secondary_prob, 4),
        'probabilities': {k: round(v, 4) for k, v in probabilities.items()},
        'recommended_hairstyles': recommended,
        'avoid_hairstyles': avoid,
        'blended_recommendations': blended,
    }, status=status.HTTP_200_OK)


def _predict_face_shape(image_path: str) -> dict:
    """
    Run EfficientNet model inference on the image.
    Returns dict: { 'Heart': 0.20, 'Oblong': 0.25, 'Oval': 0.30, ... }

    If the model file is not found, falls back to a demo mode with
    random probabilities for development/testing.
    """
    classes = settings.FACE_SHAPE_CLASSES  # ['Heart', 'Oblong', 'Oval', 'Round', 'Square']
    model_path = settings.ML_MODEL_PATH

    if os.path.exists(model_path):
        try:
            import numpy as np
            import cv2
            import tensorflow as tf

            # Load model (cached after first call)
            if not hasattr(_predict_face_shape, '_model'):
                _predict_face_shape._model = tf.keras.models.load_model(model_path)
                logger.info(f"ML model loaded from {model_path}")

            model = _predict_face_shape._model

            # Preprocess image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image file")

            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (260, 260))
            img = img.astype('float32') / 255.0
            img = np.expand_dims(img, axis=0)

            # Predict
            predictions = model.predict(img, verbose=0)[0]
            return {cls: float(pred) for cls, pred in zip(classes, predictions)}

        except ImportError as e:
            logger.warning(f"ML dependencies not available: {e}. Using demo mode.")
        except Exception as e:
            logger.error(f"Model inference error: {e}")
            raise
    else:
        logger.warning(f"Model not found at {model_path}. Using demo mode.")

    # Demo mode fallback — random probabilities for development
    import random
    raw = [random.random() for _ in classes]
    total = sum(raw)
    return {cls: val / total for cls, val in zip(classes, raw)}


def _get_blended_recommendations(shape1_name, shape2_name, prob1, prob2):
    """
    Blend recommendations from two face shapes weighted by their
    prediction probabilities. Mirrors db_helper.get_recommendations_for_top2().
    """
    p_sum = prob1 + prob2 if (prob1 + prob2) > 0 else 1.0
    w1, w2 = prob1 / p_sum, prob2 / p_sum

    scores = {}
    results = {}

    # Get recommendations for shape 1
    recs1 = FaceShapeRecommendation.objects.filter(
        face_shape__name=shape1_name
    ).select_related('hairstyle')

    for r in recs1:
        key = r.hairstyle.name
        scores[key] = scores.get(key, 0.0) + float(r.score) * w1
        results[key] = HairstyleSerializer(r.hairstyle).data

    # Get recommendations for shape 2
    recs2 = FaceShapeRecommendation.objects.filter(
        face_shape__name=shape2_name
    ).select_related('hairstyle')

    for r in recs2:
        key = r.hairstyle.name
        scores[key] = scores.get(key, 0.0) + float(r.score) * w2
        results[key] = HairstyleSerializer(r.hairstyle).data

    # Attach blended score and sort
    for key in results:
        results[key]['blended_score'] = round(scores[key], 4)

    sorted_recs = sorted(results.values(), key=lambda x: x['blended_score'], reverse=True)
    return sorted_recs


# ============================================================
# User Analysis History
# ============================================================
class UserAnalysisListView(generics.ListAPIView):
    """
    GET /api/analyses/ — List all analyses for the logged-in user.
    """
    serializer_class = UserAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAnalysis.objects.filter(
            user=self.request.user
        ).select_related('primary_shape', 'secondary_shape')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_detail(request, analysis_id):
    """
    GET /api/analyses/{id}/ — Get a specific analysis with full recommendations.
    """
    try:
        analysis = UserAnalysis.objects.select_related(
            'primary_shape', 'secondary_shape'
        ).get(id=analysis_id, user=request.user)
    except UserAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Build recommendations from stored shapes
    recommended = []
    avoid = []
    blended = []

    if analysis.primary_shape:
        recs = FaceShapeRecommendation.objects.filter(
            face_shape=analysis.primary_shape
        ).select_related('hairstyle').order_by('-score')
        recommended = HairstyleSerializer([r.hairstyle for r in recs], many=True).data

        avoids = FaceShapeAvoid.objects.filter(
            face_shape=analysis.primary_shape
        ).select_related('hairstyle')
        avoid = [
            {**HairstyleSerializer(a.hairstyle).data, 'reason': a.reason}
            for a in avoids
        ]

    if analysis.primary_shape and analysis.secondary_shape:
        blended = _get_blended_recommendations(
            analysis.primary_shape.name,
            analysis.secondary_shape.name,
            float(getattr(analysis, f'prob_{analysis.primary_shape.name.lower()}')),
            float(getattr(analysis, f'prob_{analysis.secondary_shape.name.lower()}')),
        )

    return Response({
        'analysis': UserAnalysisSerializer(analysis).data,
        'recommended_hairstyles': recommended,
        'avoid_hairstyles': avoid,
        'blended_recommendations': blended,
    })


# ============================================================
# Favorites
# ============================================================
class UserFavoriteViewSet(viewsets.ModelViewSet):
    """
    GET    /api/favorites/       — List user's favorite hairstyles
    POST   /api/favorites/       — Add a favorite { hairstyle_id }
    DELETE /api/favorites/{id}/  — Remove a favorite
    """
    serializer_class = UserFavoriteSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return UserFavorite.objects.filter(
            user=self.request.user
        ).select_related('hairstyle')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        hairstyle_id = request.data.get('hairstyle_id')
        if not hairstyle_id:
            return Response(
                {'error': 'hairstyle_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if hairstyle exists
        if not Hairstyle.objects.filter(id=hairstyle_id).exists():
            return Response(
                {'error': 'Hairstyle not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check for duplicates
        if UserFavorite.objects.filter(
            user=request.user, hairstyle_id=hairstyle_id
        ).exists():
            return Response(
                {'message': 'Already in favorites.'},
                status=status.HTTP_200_OK
            )

        favorite = UserFavorite.objects.create(
            user=request.user, hairstyle_id=hairstyle_id
        )
        serializer = self.get_serializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================================
# Feedback
# ============================================================
class UserFeedbackViewSet(viewsets.ModelViewSet):
    """
    GET  /api/feedback/       — List user's feedback
    POST /api/feedback/       — Submit feedback { analysis, hairstyle, rating, comment? }
    """
    serializer_class = UserFeedbackSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        return UserFeedback.objects.filter(
            user=self.request.user
        ).select_related('analysis', 'hairstyle')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================
# Health Check
# ============================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """GET /api/health/ — API health check."""
    return Response({
        'status': 'healthy',
        'service': 'HAIRGURU API',
        'version': '1.0.0',
    })
