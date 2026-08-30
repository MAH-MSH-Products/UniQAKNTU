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
    SendOTPView,
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

    # OTP dispatch (email verification & password reset)
    path('send-otp/', SendOTPView.as_view(), name='auth-send-otp'),

    # Email verification & password reset (consume the OTP)
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),

    # Authenticated user
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
