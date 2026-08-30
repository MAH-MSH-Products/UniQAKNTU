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
    SendOTPSerializer,
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
            'Returns a JWT access and refresh token pair with role embedded in the token. '
            'If the email is not verified, returns HTTP 403 with code="email_not_verified" '
            'so the frontend can redirect to the verification flow.'
        ),
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description='JWT token pair returned.'),
            400: OpenApiResponse(description='Invalid credentials.'),
            403: OpenApiResponse(description='Email not verified (code=email_not_verified) or account locked.'),
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})

        # Run validation — catch the unverified-email case specifically so we can
        # return a structured 403 that the frontend can act on (redirect to verify flow).
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as exc:
            errors = getattr(exc, 'detail', {})
            # DRF puts non-field errors under 'non_field_errors'
            non_field = errors.get('non_field_errors', [])
            for err in non_field:
                if getattr(err, 'code', None) == 'email_not_verified':
                    return Response(
                        {
                            'code': 'email_not_verified',
                            'detail': str(err),
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            raise  # re-raise any other validation error as normal 400

        user = serializer.validated_data['user']

        # Build JWT tokens and embed role as a custom claim so the frontend
        # can read the user's role directly from the token without an extra API call.
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role          # added to refresh token payload
        refresh.access_token['role'] = user.role   # added to access token payload

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
# Send OTP
# -------------------------------------------------

@extend_schema(tags=['Auth'])
class SendOTPView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Send or resend an OTP',
        description=(
            'Send an OTP to the given email address for the requested purpose. '
            'Use otp_type="verify_email" to get an email verification code, '
            'or otp_type="password_reset" to get a password reset code. '
            'Limited to 3 requests per hour per OTP type.'
        ),
        request=SendOTPSerializer,
        responses={
            200: OpenApiResponse(description='OTP sent successfully.'),
            400: OpenApiResponse(description='Validation error or email already verified.'),
            404: OpenApiResponse(description='No account found with this email.'),
            429: OpenApiResponse(description='Rate limit reached. Try again in an hour.'),
        },
    )
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp_type = serializer.validated_data['otp_type']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Guard: block sending verification OTP to an already-verified account
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
            {'detail': 'A new code has been sent to your email address.'},
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
