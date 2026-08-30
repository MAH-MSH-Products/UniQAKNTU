"""
users/auth_views.py
-------------------
Authentication API views:
  POST /api/auth/register/
  POST /api/auth/login/
  POST /api/auth/logout/
  POST /api/auth/verify-email/
  POST /api/auth/resend-otp/
  POST /api/auth/forgot-password/
  POST /api/auth/reset-password/
  GET  /api/auth/me/
  POST /api/auth/change-password/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    LogoutSerializer,
    VerifyEmailSerializer,
    ResendOTPSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    MeSerializer,
    ChangePasswordSerializer,
)
from .utils import (
    OTPType,
    OTPVerifyResult,
    generate_otp,
    store_otp,
    verify_otp,
    can_resend,
    increment_resend_count,
    send_otp_email,
)


# -------------------------------------------------
# Register
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Register a new user',
        description=(
            'Creates a new user account. A 6-digit OTP is sent to the provided '
            'email address. The user must verify their email before they can log in.'
        ),
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(description='User created. OTP sent to email.'),
            400: OpenApiResponse(description='Validation error.'),
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send email verification OTP
        otp = generate_otp()
        store_otp(user.id, OTPType.VERIFY_EMAIL, otp)
        send_otp_email(user, OTPType.VERIFY_EMAIL, otp)

        return Response(
            {'detail': 'Registration successful. A verification code has been sent to your email.'},
            status=status.HTTP_201_CREATED,
        )


# -------------------------------------------------
# Login
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Login with username or email',
        description=(
            'Authenticate with either a username or email address plus password. '
            'Returns a JWT access and refresh token pair. '
            'The account must have a verified email address.'
        ),
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description='JWT token pair returned.'),
            400: OpenApiResponse(description='Invalid credentials or unverified email.'),
            403: OpenApiResponse(description='Account locked due to too many failed attempts.'),
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': MeSerializer(user).data,
        }, status=status.HTTP_200_OK)


# -------------------------------------------------
# Logout
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Logout (blacklist refresh token)',
        description='Blacklists the provided refresh token, invalidating it for future use.',
        request=LogoutSerializer,
        responses={
            204: OpenApiResponse(description='Logged out successfully.'),
            400: OpenApiResponse(description='Invalid or already blacklisted token.'),
        },
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------------------------------
# Verify Email
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Verify email address with OTP',
        description=(
            'Submit the 6-digit OTP received by email to verify the account. '
            'After 5 wrong attempts the code is invalidated and a new one must be requested.'
        ),
        request=VerifyEmailSerializer,
        responses={
            200: OpenApiResponse(description='Email verified successfully.'),
            400: OpenApiResponse(description='Invalid OTP.'),
            404: OpenApiResponse(description='No account with this email.'),
            410: OpenApiResponse(description='OTP expired or already used.'),
            429: OpenApiResponse(description='Too many wrong attempts — code invalidated.'),
        },
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_email_verified:
            return Response(
                {'detail': 'This email address is already verified.'},
                status=status.HTTP_200_OK,
            )

        result = verify_otp(user.id, OTPType.VERIFY_EMAIL, otp)

        if result == OTPVerifyResult.SUCCESS:
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            return Response(
                {'detail': 'Email verified successfully. You can now log in.'},
                status=status.HTTP_200_OK,
            )

        if result == OTPVerifyResult.LOCKED:
            return Response(
                {
                    'detail': (
                        'Too many incorrect attempts. Your verification code has been '
                        'invalidated. Please request a new one.'
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if result == OTPVerifyResult.EXPIRED:
            return Response(
                {'detail': 'Verification code has expired or was already used. Please request a new one.'},
                status=status.HTTP_410_GONE,
            )

        # OTPVerifyResult.INVALID
        return Response(
            {'detail': 'Invalid verification code. Please check and try again.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


# -------------------------------------------------
# Resend OTP
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Resend OTP code',
        description=(
            'Resend an OTP to the given email. '
            'Limited to 3 requests per hour per OTP type. '
            'otp_type must be "verify_email" or "password_reset".'
        ),
        request=ResendOTPSerializer,
        responses={
            200: OpenApiResponse(description='OTP resent.'),
            400: OpenApiResponse(description='Validation error or already verified.'),
            404: OpenApiResponse(description='No account with this email.'),
            429: OpenApiResponse(description='Resend limit reached.'),
        },
    )
    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp_type = serializer.validated_data['otp_type']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return 200 to prevent email enumeration
            return Response(
                {'detail': 'If an account exists, a new code has been sent.'},
                status=status.HTTP_200_OK,
            )

        # Guard: don't resend verification to an already-verified account
        if otp_type == OTPType.VERIFY_EMAIL and user.is_email_verified:
            return Response(
                {'detail': 'This email is already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not can_resend(user.id, otp_type):
            return Response(
                {'detail': 'You have requested too many codes. Please try again in an hour.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        increment_resend_count(user.id, otp_type)
        otp = generate_otp()
        store_otp(user.id, otp_type, otp)
        send_otp_email(user, otp_type, otp)

        return Response(
            {'detail': 'If an account exists, a new code has been sent.'},
            status=status.HTTP_200_OK,
        )


# -------------------------------------------------
# Forgot Password
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Request a password reset OTP',
        description=(
            'Sends a password reset OTP to the given email address. '
            'Always returns 200 regardless of whether the email exists '
            '(prevents user enumeration).'
        ),
        request=ForgotPasswordSerializer,
        responses={
            200: OpenApiResponse(description='OTP sent if email exists.'),
        },
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        # Silently ignore unknown emails to prevent enumeration
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'If an account with this email exists, a reset code has been sent.'},
                status=status.HTTP_200_OK,
            )

        otp = generate_otp()
        store_otp(user.id, OTPType.PASSWORD_RESET, otp)
        send_otp_email(user, OTPType.PASSWORD_RESET, otp)

        return Response(
            {'detail': 'If an account with this email exists, a reset code has been sent.'},
            status=status.HTTP_200_OK,
        )


# -------------------------------------------------
# Reset Password
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Reset password using OTP',
        description=(
            'Provide the email, OTP received, and the new password to complete the reset. '
            'After 5 wrong attempts the code is invalidated and a new one must be requested.'
        ),
        request=ResetPasswordSerializer,
        responses={
            200: OpenApiResponse(description='Password reset successfully.'),
            400: OpenApiResponse(description='Invalid OTP or validation error.'),
            404: OpenApiResponse(description='No account with this email.'),
            410: OpenApiResponse(description='OTP expired or already used.'),
            429: OpenApiResponse(description='Too many wrong attempts — code invalidated.'),
        },
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = verify_otp(user.id, OTPType.PASSWORD_RESET, otp)

        if result == OTPVerifyResult.SUCCESS:
            user.set_password(new_password)
            user.save(update_fields=['password'])
            return Response(
                {'detail': 'Password reset successfully. You can now log in with your new password.'},
                status=status.HTTP_200_OK,
            )

        if result == OTPVerifyResult.LOCKED:
            return Response(
                {
                    'detail': (
                        'Too many incorrect attempts. Your reset code has been '
                        'invalidated. Please request a new one.'
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if result == OTPVerifyResult.EXPIRED:
            return Response(
                {'detail': 'Reset code has expired or was already used. Please request a new one.'},
                status=status.HTTP_410_GONE,
            )

        # OTPVerifyResult.INVALID
        return Response(
            {'detail': 'Invalid reset code. Please check and try again.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


# -------------------------------------------------
# Me (current user profile)
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Get current user profile',
        description='Returns the profile of the currently authenticated user.',
        responses={200: MeSerializer},
    )
    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# -------------------------------------------------
# Change Password
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Change password',
        description='Change the authenticated user password. Requires the current password.',
        request=ChangePasswordSerializer,
        responses={
            200: OpenApiResponse(description='Password changed successfully.'),
            400: OpenApiResponse(description='Wrong current password or validation error.'),
        },
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response(
            {'detail': 'Password changed successfully.'},
            status=status.HTTP_200_OK,
        )
