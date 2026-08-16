from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model extending AbstractUser with RBAC fields."""
    is_instructor = models.BooleanField(default=False)
    is_student = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'user'
        verbose_name_plural = 'users'
    
    def __str__(self):
        return self.username


class RoleRequest(models.Model):
    """Model for handling student requests to become instructors."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Role Request'
        verbose_name_plural = 'Role Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.status}"
