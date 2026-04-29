"""
HAIRGURU - API Serializers
----------------------------
DRF serializers for all models + auth + analysis endpoints.
"""

from rest_framework import serializers
from .models import (
    FaceShape, Hairstyle, FaceShapeRecommendation, FaceShapeAvoid,
    User, UserAnalysis, UserFavorite, UserFeedback,
)


# ============================================================
# Face Shapes
# ============================================================
class FaceShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaceShape
        fields = ['id', 'name', 'description', 'note', 'created_at', 'updated_at']


class FaceShapeDetailSerializer(serializers.ModelSerializer):
    """Face shape with its recommended and avoid hairstyles."""
    recommended_hairstyles = serializers.SerializerMethodField()
    avoid_hairstyles = serializers.SerializerMethodField()

    class Meta:
        model = FaceShape
        fields = [
            'id', 'name', 'description', 'note',
            'recommended_hairstyles', 'avoid_hairstyles',
            'created_at', 'updated_at',
        ]

    def get_recommended_hairstyles(self, obj):
        recs = FaceShapeRecommendation.objects.filter(
            face_shape=obj
        ).select_related('hairstyle').order_by('-score')
        return RecommendationSerializer(recs, many=True).data

    def get_avoid_hairstyles(self, obj):
        avoids = FaceShapeAvoid.objects.filter(
            face_shape=obj
        ).select_related('hairstyle')
        return AvoidSerializer(avoids, many=True).data


# ============================================================
# Hairstyles
# ============================================================
class HairstyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hairstyle
        fields = [
            'id', 'name', 'description', 'image_url',
            'gender', 'length_category', 'created_at', 'updated_at',
        ]


class HairstyleDetailSerializer(serializers.ModelSerializer):
    """Hairstyle with face shape compatibility info."""
    recommended_for_shapes = serializers.SerializerMethodField()
    avoid_for_shapes = serializers.SerializerMethodField()

    class Meta:
        model = Hairstyle
        fields = [
            'id', 'name', 'description', 'image_url',
            'gender', 'length_category',
            'recommended_for_shapes', 'avoid_for_shapes',
            'created_at', 'updated_at',
        ]

    def get_recommended_for_shapes(self, obj):
        recs = FaceShapeRecommendation.objects.filter(
            hairstyle=obj
        ).select_related('face_shape')
        return [
            {'face_shape': r.face_shape.name, 'score': str(r.score)}
            for r in recs
        ]

    def get_avoid_for_shapes(self, obj):
        avoids = FaceShapeAvoid.objects.filter(
            hairstyle=obj
        ).select_related('face_shape')
        return [
            {'face_shape': a.face_shape.name, 'reason': a.reason}
            for a in avoids
        ]


# ============================================================
# Recommendations & Avoids
# ============================================================
class RecommendationSerializer(serializers.ModelSerializer):
    hairstyle = HairstyleSerializer(read_only=True)

    class Meta:
        model = FaceShapeRecommendation
        fields = ['id', 'hairstyle', 'score']


class AvoidSerializer(serializers.ModelSerializer):
    hairstyle = HairstyleSerializer(read_only=True)

    class Meta:
        model = FaceShapeAvoid
        fields = ['id', 'hairstyle', 'reason']


# ============================================================
# User Auth
# ============================================================
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'full_name', 'gender',
        ]
        read_only_fields = ['id']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'gender',
            'profile_image', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'username', 'email', 'created_at']


# ============================================================
# User Analysis
# ============================================================
class UserAnalysisSerializer(serializers.ModelSerializer):
    primary_shape_name = serializers.CharField(
        source='primary_shape.name', read_only=True, default=None
    )
    secondary_shape_name = serializers.CharField(
        source='secondary_shape.name', read_only=True, default=None
    )

    class Meta:
        model = UserAnalysis
        fields = [
            'id', 'user', 'image_path',
            'prob_heart', 'prob_oblong', 'prob_oval', 'prob_round', 'prob_square',
            'primary_shape', 'primary_shape_name',
            'secondary_shape', 'secondary_shape_name',
            'analyzed_at',
        ]
        read_only_fields = ['id', 'analyzed_at']


class AnalysisResultSerializer(serializers.Serializer):
    """Serializer for the face analysis API response."""
    analysis_id = serializers.IntegerField()
    primary_shape = serializers.CharField()
    secondary_shape = serializers.CharField()
    probabilities = serializers.DictField()
    recommended_hairstyles = serializers.ListField()
    avoid_hairstyles = serializers.ListField()
    blended_recommendations = serializers.ListField()


# ============================================================
# Favorites
# ============================================================
class UserFavoriteSerializer(serializers.ModelSerializer):
    hairstyle = HairstyleSerializer(read_only=True)
    hairstyle_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = UserFavorite
        fields = ['id', 'hairstyle', 'hairstyle_id', 'saved_at']
        read_only_fields = ['id', 'saved_at']


# ============================================================
# Feedback
# ============================================================
class UserFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeedback
        fields = ['id', 'user', 'analysis', 'hairstyle', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
