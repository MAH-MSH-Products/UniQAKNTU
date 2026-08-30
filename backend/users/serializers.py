from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, UserRole
from .utils import OTPType


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Existing Serializers (unchanged)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'date_joined']
        read_only_fields = fields


class ChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)


class UserStatsSerializer(serializers.Serializer):
    total_answers = serializers.IntegerField(read_only=True)
    total_upvotes = serializers.IntegerField(read_only=True)
    total_accepted_answers = serializers.IntegerField(read_only=True)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Auth Serializers
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm password',
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        # Run Django built-in password validators
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_email_verified=False,
        )
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        label='Username or Email',
        help_text='Enter your username or email address.',
    )
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        identifier = attrs.get('identifier', '').strip()
        password = attrs.get('password', '')

        username_for_auth = identifier
        if '@' in identifier:
            try:
                user_obj = User.objects.get(email__iexact=identifier)
                username_for_auth = user_obj.username
            except User.DoesNotExist:
                pass

        user = authenticate(
            request=self.context.get('request'),
            username=username_for_auth,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                'Invalid credentials. Please check your username/email and password.',
                code='authorization',
            )

        if not user.is_email_verified:
            raise serializers.ValidationError(
                'Email address is not verified. Please verify your email before logging in.',
                code='email_not_verified',
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'This account has been disabled.',
                code='disabled',
            )

        attrs['user'] = user
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.lower()


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_type = serializers.ChoiceField(
        choices=[(t, t) for t in OTPType.ALL],
        help_text='Type of OTP to send: "verify_email" or "password_reset".',
    )

    def validate_email(self, value):
        return value.lower()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm new password',
    )

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm new password',
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        help_text='The refresh token to blacklist.',
    )


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_email_verified', 'date_joined',
        ]
        read_only_fields = fields

class ChangeEmailRequestSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )
    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class ChangeEmailVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(min_length=6, max_length=6)

class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name']

    def validate_username(self, value):
        user = self.instance
        if user and User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value
