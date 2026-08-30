"""
users/auth_urls.py
------------------
URL patterns for the authentication endpoints.
Mounted at /api/auth/ in core/urls.py
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .auth_views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ResendOTPView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    ChangePasswordView,
)

urlpatterns = [
    # Registration & login
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),

    # Token management
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Email verification
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),

    # Password reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),

    # Authenticated user
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
