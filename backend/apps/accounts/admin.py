from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RoleRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_instructor', 'is_student']
    list_filter = ['is_staff', 'is_active', 'is_superuser', 'is_instructor', 'is_student']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Instructor Profile', {
            'fields': ('title', 'bio'),
            'description': 'Fields for instructor profile information'
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('RBAC Fields', {
            'fields': ('is_instructor', 'is_student'),
        }),
        ('Instructor Profile', {
            'fields': ('title', 'bio'),
        }),
    )


@admin.register(RoleRequest)
class RoleRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['user', 'status', 'created_at', 'introduction']
    ordering = ['-created_at']
    
    actions = ['approve_requests']
    
    def approve_requests(self, request, queryset):
        """Admin action to approve role requests and set user as instructor."""
        for role_request in queryset:
            if role_request.status == 'Pending':
                role_request.status = 'Approved'
                role_request.save()
                role_request.user.is_instructor = True
                role_request.user.is_student = False
                role_request.user.save()
        self.message_user(request, f"{queryset.count()} role request(s) approved successfully.")
    approve_requests.short_description = "Approve selected requests and grant instructor status"
