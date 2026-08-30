from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Platform Info', {'fields': ('role', 'is_email_verified')}),
    )
    list_display = UserAdmin.list_display + ('role', 'is_email_verified')
    list_filter = UserAdmin.list_filter + ('role', 'is_email_verified')


admin.site.register(User, CustomUserAdmin)
