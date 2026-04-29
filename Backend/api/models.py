"""
HAIRGURU - Django Models
-------------------------
Maps directly to the existing PostgreSQL schema (schema.sql).
Uses `db_table` Meta to connect to the already-created tables.
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ============================================================
# Custom User Manager
# ============================================================
class UserManager(BaseUserManager):
    """Custom manager for HAIRGURU User model (UUID-based)."""

    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)


# ============================================================
# 1. Face Shapes
# ============================================================
class FaceShape(models.Model):
    """Stores the 5 face shape categories."""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True, help_text='Styling tip for this shape')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'face_shapes'
        ordering = ['id']
        verbose_name_plural = 'Face Shapes'

    def __str__(self):
        return self.name


# ============================================================
# 2. Hairstyles
# ============================================================
class Hairstyle(models.Model):
    """Stores all hairstyle entries with metadata."""

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('unisex', 'Unisex'),
    ]
    LENGTH_CHOICES = [
        ('short', 'Short'),
        ('medium', 'Medium'),
        ('long', 'Long'),
    ]

    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='unisex')
    length_category = models.CharField(max_length=20, choices=LENGTH_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hairstyles'
        ordering = ['id']

    def __str__(self):
        return self.name


# ============================================================
# 3. Face Shape Recommendations (Many-to-Many)
# ============================================================
class FaceShapeRecommendation(models.Model):
    """Which hairstyles are recommended for which face shapes."""
    face_shape = models.ForeignKey(
        FaceShape, on_delete=models.CASCADE, related_name='recommendations'
    )
    hairstyle = models.ForeignKey(
        Hairstyle, on_delete=models.CASCADE, related_name='recommended_for'
    )
    score = models.DecimalField(max_digits=3, decimal_places=2, default=1.00,
                                help_text='Relevance weight 0-1')

    class Meta:
        db_table = 'face_shape_recommendations'
        unique_together = ('face_shape', 'hairstyle')
        ordering = ['-score']

    def __str__(self):
        return f"{self.face_shape.name} → {self.hairstyle.name} ({self.score})"


# ============================================================
# 4. Hairstyles to Avoid per Face Shape
# ============================================================
class FaceShapeAvoid(models.Model):
    """Hairstyles to avoid for specific face shapes, with reasons."""
    face_shape = models.ForeignKey(
        FaceShape, on_delete=models.CASCADE, related_name='avoids'
    )
    hairstyle = models.ForeignKey(
        Hairstyle, on_delete=models.CASCADE, related_name='avoided_for'
    )
    reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'face_shape_avoid'
        unique_together = ('face_shape', 'hairstyle')

    def __str__(self):
        return f"{self.face_shape.name} ✗ {self.hairstyle.name}"


# ============================================================
# 5. Users (Custom User Model with UUID)
# ============================================================
class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model matching the existing users table schema."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255, db_column='password_hash')
    full_name = models.CharField(max_length=200, blank=True, null=True)
    gender = models.CharField(
        max_length=20, choices=[('male', 'Male'), ('female', 'Female'), ('unisex', 'Unisex')],
        default='unisex'
    )
    profile_image = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Django auth fields (not in original schema but needed for Django)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    @property
    def password(self):
        return self.password_hash

    @password.setter
    def password(self, raw_password):
        self.password_hash = raw_password

    def set_password(self, raw_password):
        """Hash and store the password."""
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        """Verify a password against the stored hash."""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


# ============================================================
# 6. User Face Analyses
# ============================================================
class UserAnalysis(models.Model):
    """Stores ML prediction results for each user photo analysis."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    image_path = models.TextField()
    # Probabilities from the face shape model
    prob_heart = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    prob_oblong = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    prob_oval = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    prob_round = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    prob_square = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    # Top predictions
    primary_shape = models.ForeignKey(
        FaceShape, on_delete=models.SET_NULL, null=True,
        related_name='primary_analyses', db_column='primary_shape_id'
    )
    secondary_shape = models.ForeignKey(
        FaceShape, on_delete=models.SET_NULL, null=True,
        related_name='secondary_analyses', db_column='secondary_shape_id'
    )
    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_analyses'
        ordering = ['-analyzed_at']
        verbose_name_plural = 'User Analyses'

    def __str__(self):
        return f"Analysis #{self.pk} for {self.user.username}"


# ============================================================
# 7. User Favorites
# ============================================================
class UserFavorite(models.Model):
    """Bookmarked/saved hairstyles for a user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    hairstyle = models.ForeignKey(Hairstyle, on_delete=models.CASCADE, related_name='favorited_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_favorites'
        unique_together = ('user', 'hairstyle')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} ♥ {self.hairstyle.name}"


# ============================================================
# 8. User Feedback
# ============================================================
class UserFeedback(models.Model):
    """Ratings and comments on hairstyle recommendations."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    analysis = models.ForeignKey(UserAnalysis, on_delete=models.CASCADE, related_name='feedbacks')
    hairstyle = models.ForeignKey(Hairstyle, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField(help_text='Rating from 1 to 5')
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_feedback'
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback by {self.user.username} - {self.rating}★"
