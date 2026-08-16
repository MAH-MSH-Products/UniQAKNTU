from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model extending AbstractUser."""
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'user'
        verbose_name_plural = 'users'
    
    def __str__(self):
        return self.username
