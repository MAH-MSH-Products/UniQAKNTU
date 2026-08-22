from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', _('Student')
        MODERATOR = 'MODERATOR', _('Moderator')
        ADMIN = 'ADMIN', _('Admin')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    def is_moderator(self):
        return self.role in [self.Role.MODERATOR, self.Role.ADMIN]

    def is_admin(self):
        return self.role == self.Role.ADMIN
