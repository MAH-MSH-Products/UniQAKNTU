from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    MODERATOR = 'MODERATOR', 'Moderator'
    ADMIN = 'ADMIN', 'Admin'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Override email to enforce uniqueness at the database level
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
    )
    is_email_verified = models.BooleanField(
        default=False,
        help_text='Whether the user has confirmed ownership of their email address.',
    )

    def is_student(self):
        return self.role == UserRole.STUDENT

    def is_moderator(self):
        return self.role == UserRole.MODERATOR

    def is_admin(self):
        return self.role == UserRole.ADMIN
