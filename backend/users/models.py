from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


from django.contrib.auth.models import UserManager as DefaultUserManager

class UserManager(DefaultUserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, password, **extra_fields)

class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    MODERATOR = 'MODERATOR', 'Moderator'
    ADMIN = 'ADMIN', 'Admin'


class User(AbstractUser):
    objects = UserManager()

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
