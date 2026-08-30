"""
users/utils.py
--------------
OTP utilities for the authentication system.

Security design:
  - OTPs are stored as sha256(otp) in cache -- never in plaintext.
  - Cache keys are namespaced by user_id + otp_type.
  - Resend counters use a separate key with a 1-hour TTL.
  - Failed-attempt counters invalidate the OTP after OTP_MAX_VERIFY_ATTEMPTS
    wrong guesses (default 5), forcing the attacker to request a new code.
    Combined with the resend limit (3/hour) this makes brute-forcing infeasible.
"""

import hashlib
import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings


# -------------------------------------------------
# OTP Types
# -------------------------------------------------

class OTPType:
    VERIFY_EMAIL = 'verify_email'
    PASSWORD_RESET = 'password_reset'
    CHANGE_EMAIL = 'change_email'

    ALL = {VERIFY_EMAIL, PASSWORD_RESET, CHANGE_EMAIL}


# -------------------------------------------------
# Cache key helpers
# -------------------------------------------------

def _otp_cache_key(user_id: str, otp_type: str) -> str:
    """Cache key for the hashed OTP value."""
    return f'otp:{otp_type}:{user_id}'


def _resend_count_cache_key(user_id: str, otp_type: str) -> str:
    """Cache key for the resend attempt counter (TTL = 1 hour)."""
    return f'otp_resend_count:{otp_type}:{user_id}'


def _otp_fail_count_cache_key(user_id: str, otp_type: str) -> str:
    """Cache key for the wrong-guess counter (TTL mirrors OTP TTL)."""
    return f'otp_fails:{otp_type}:{user_id}'


# -------------------------------------------------
# OTP Generation & Storage
# -------------------------------------------------

def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def _hash_otp(otp: str) -> str:
    """Return sha256 hex digest of the OTP string."""
    return hashlib.sha256(otp.encode()).hexdigest()


def store_otp(user_id: str, otp_type: str, otp: str) -> None:
    """
    Store a hashed OTP in cache with the configured expiry.
    Any previously stored OTP for this user+type is overwritten.
    Also resets the failed-attempt counter so a fresh code starts clean.
    """
    expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 600)
    uid = str(user_id)
    cache.set(_otp_cache_key(uid, otp_type), _hash_otp(otp), timeout=expiry)
    # Reset brute-force counter whenever a new OTP is issued
    cache.delete(_otp_fail_count_cache_key(uid, otp_type))


# -------------------------------------------------
# OTP Verification -- with brute-force protection
# -------------------------------------------------

class OTPVerifyResult:
    """Result codes returned by verify_otp."""
    SUCCESS = 'success'   # OTP matched and consumed
    INVALID = 'invalid'   # Wrong code, attempts remaining
    LOCKED  = 'locked'    # Too many failures -- OTP invalidated, request a new one
    EXPIRED = 'expired'   # No OTP in cache (expired or already consumed)


_DEFAULT_MAX_FAILS = 5  # locked after this many wrong guesses


def verify_otp(user_id: str, otp_type: str, submitted_otp: str) -> str:
    """
    Verify a submitted OTP against the stored hash.

    Returns an OTPVerifyResult constant:
      SUCCESS  -- correct; OTP and fail counter deleted (single-use).
      INVALID  -- wrong code; fail counter incremented, attempts remain.
      LOCKED   -- fail limit reached; OTP deleted, user must request a new one.
      EXPIRED  -- no OTP in cache (expired, consumed, or already locked).

    Brute-force defence:
      After OTP_MAX_VERIFY_ATTEMPTS (default 5) wrong guesses the OTP is
      deleted from cache. The attacker must trigger a new code, which is
      itself limited to 3 resends per hour.
    """
    uid = str(user_id)
    otp_key  = _otp_cache_key(uid, otp_type)
    fail_key = _otp_fail_count_cache_key(uid, otp_type)
    max_fails = getattr(settings, 'OTP_MAX_VERIFY_ATTEMPTS', _DEFAULT_MAX_FAILS)

    stored_hash = cache.get(otp_key)
    if stored_hash is None:
        return OTPVerifyResult.EXPIRED

    if stored_hash == _hash_otp(submitted_otp):
        # Correct -- consume OTP and reset fail counter
        cache.delete_many([otp_key, fail_key])
        return OTPVerifyResult.SUCCESS

    # Wrong guess -- increment fail counter with same TTL as OTP
    expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 600)
    fail_count = cache.get(fail_key, 0) + 1
    cache.set(fail_key, fail_count, timeout=expiry)

    if fail_count >= max_fails:
        # Threshold reached -- burn the OTP to stop further guessing
        cache.delete_many([otp_key, fail_key])
        return OTPVerifyResult.LOCKED

    return OTPVerifyResult.INVALID


# -------------------------------------------------
# Resend Rate Limiting
# -------------------------------------------------

def get_resend_count(user_id: str, otp_type: str) -> int:
    """Return how many resend requests have been made in the last hour."""
    return cache.get(_resend_count_cache_key(str(user_id), otp_type), 0)


def increment_resend_count(user_id: str, otp_type: str) -> int:
    """
    Increment the resend counter for this user+type.
    The counter expires after 1 hour automatically.
    Returns the new count.
    """
    key = _resend_count_cache_key(str(user_id), otp_type)
    count = cache.get(key, 0) + 1
    cache.set(key, count, timeout=3600)  # 1 hour TTL
    return count


def can_resend(user_id: str, otp_type: str) -> bool:
    """Return True if the user is below the resend limit."""
    max_resends = getattr(settings, 'OTP_MAX_RESEND_PER_HOUR', 3)
    return get_resend_count(str(user_id), otp_type) < max_resends


# -------------------------------------------------
# Pending Email Storage (For Change Email Flow)
# -------------------------------------------------

def _pending_email_cache_key(user_id: str) -> str:
    return f'pending_email:{user_id}'


def store_pending_email(user_id: str, new_email: str) -> None:
    expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 600)
    cache.set(_pending_email_cache_key(str(user_id)), new_email, timeout=expiry)


def get_pending_email(user_id: str) -> str | None:
    return cache.get(_pending_email_cache_key(str(user_id)))


def clear_pending_email(user_id: str) -> None:
    cache.delete(_pending_email_cache_key(str(user_id)))


# -------------------------------------------------
# Email Sending
# -------------------------------------------------

_EMAIL_SUBJECTS = {
    OTPType.VERIFY_EMAIL: 'Verify your UniQAKNTU email address',
    OTPType.PASSWORD_RESET: 'Reset your UniQAKNTU password',
    OTPType.CHANGE_EMAIL: 'Confirm your new UniQAKNTU email address',
}

_EMAIL_BODIES = {
    OTPType.VERIFY_EMAIL: (
        'Hello {username},\n\n'
        'Your email verification code is:\n\n'
        '    {otp}\n\n'
        'This code expires in 10 minutes. Do not share it with anyone.\n\n'
        '-- The UniQAKNTU Team'
    ),
    OTPType.PASSWORD_RESET: (
        'Hello {username},\n\n'
        'Your password reset code is:\n\n'
        '    {otp}\n\n'
        'This code expires in 10 minutes. If you did not request a password reset, '
        'please ignore this email.\n\n'
        '-- The UniQAKNTU Team'
    ),
    OTPType.CHANGE_EMAIL: (
        'Hello {username},\n\n'
        'You requested to change your email address. Your verification code is:\n\n'
        '    {otp}\n\n'
        'This code expires in 10 minutes. If you did not request this, '
        'please secure your account immediately.\n\n'
        '-- The UniQAKNTU Team'
    ),
}


def send_otp_email(user, otp_type: str, otp: str, to_email: str = None) -> None:
    """
    Send an OTP email to the user.
    Uses Django configured EMAIL_BACKEND (console in dev, SMTP in prod).
    """
    subject = _EMAIL_SUBJECTS.get(otp_type, 'Your UniQAKNTU code')
    body = _EMAIL_BODIES.get(otp_type, 'Your code: {otp}').format(
        username=user.username,
        otp=otp,
    )
    recipient = to_email if to_email else user.email
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )


def send_security_alert_email(user, old_email: str, new_email: str) -> None:
    """
    Send a security alert to the user's old email address notifying them
    that their email was changed.
    """
    subject = 'Security Alert: Your UniQAKNTU email address was changed'
    body = (
        f'Hello {user.username},\n\n'
        f'The email address associated with your UniQAKNTU account was successfully changed '
        f'from {old_email} to {new_email}.\n\n'
        'If you did not make this change, please contact support immediately.\n\n'
        '-- The UniQAKNTU Team'
    )
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[old_email],
        fail_silently=False,
    )

# -------------------------------------------------
# Sensitive Action Protection
# -------------------------------------------------

def check_sensitive_password(user, password: str) -> bool:
    """
    Checks the user's password with brute-force protection.
    If the user fails too many times, raises a Throttled exception.
    """
    from rest_framework.exceptions import Throttled
    
    max_fails = getattr(settings, 'SENSITIVE_ACTION_MAX_FAILS', 5)
    lockout_time = getattr(settings, 'SENSITIVE_ACTION_LOCKOUT', 900) # 15 minutes
    cache_key = f'sensitive_fails:{user.id}'
    
    fails = cache.get(cache_key, 0)
    if fails >= max_fails:
        raise Throttled(detail='Too many incorrect password attempts. Please try again later.')
        
    if user.check_password(password):
        cache.delete(cache_key)
        return True
        
    cache.set(cache_key, fails + 1, timeout=lockout_time)
    return False


def custom_axes_lockout_response(request, credentials, *args, **kwargs):
    """
    Custom lockout response for django-axes to return a JSON 429 instead of HTML.
    """
    from django.http import JsonResponse
    from rest_framework import status
    return JsonResponse(
        {'detail': 'Too many failed login attempts. Please try again later.'},
        status=status.HTTP_429_TOO_MANY_REQUESTS
    )
