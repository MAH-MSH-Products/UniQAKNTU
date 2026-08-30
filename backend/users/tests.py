from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import UserRole
from .utils import OTPType, store_otp, generate_otp

User = get_user_model()

# Use in-memory cache for all auth tests so Redis is not required
TEST_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}


class UserAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='adminuser', email='admin@test.com', password='pwd', role=UserRole.ADMIN,
            is_email_verified=True,
        )
        self.moderator = User.objects.create_user(
            username='moduser', email='mod@test.com', password='pwd', role=UserRole.MODERATOR,
            is_email_verified=True,
        )
        self.student = User.objects.create_user(
            username='studentuser', email='student@test.com', password='pwd', role=UserRole.STUDENT,
            is_email_verified=True,
        )
        self.url_list = '/api/users/'
        self.url_role = f'/api/users/{self.student.id}/role/'

    def test_student_cannot_access_user_list(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_access_user_list(self):
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_admin_can_access_user_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_filtering_and_searching(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url_list + '?role=STUDENT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['username'], 'studentuser')
        response = self.client.get(self.url_list + '?search=moduser')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['username'], 'moduser')

    def test_moderator_cannot_change_role(self):
        self.client.force_authenticate(user=self.moderator)
        response = self.client.patch(self.url_role, {'role': 'MODERATOR'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, UserRole.STUDENT)

    def test_admin_can_change_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self.url_role, {'role': 'MODERATOR'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, UserRole.MODERATOR)

    def test_change_role_invalid_choice(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self.url_role, {'role': 'SUPER_ADMIN'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_stats(self):
        from qna.models import Answer, Question, Vote, PostStatus
        from django.contrib.contenttypes.models import ContentType
        self.client.force_authenticate(user=self.student)
        q = Question.objects.create(author=self.student, title='Q1')
        Answer.objects.create(author=self.student, question=q, status=PostStatus.APPROVED, is_accepted=True)
        Answer.objects.create(author=self.student, question=q, status=PostStatus.APPROVED, is_accepted=False)
        Answer.objects.create(author=self.admin, question=q, status=PostStatus.APPROVED)  # Another user's answer

        Vote.objects.create(user=self.admin, content_type=ContentType.objects.get_for_model(Question), object_id=q.id, value=1)

        response = self.client.get('/api/users/me/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_answers'], 2)
        self.assertEqual(response.data['total_accepted_answers'], 1)
        self.assertEqual(response.data['total_upvotes'], 1)


@override_settings(CACHES=TEST_CACHES)
class AuthAPITests(TestCase):
    """
    Tests for the /api/auth/ endpoints.
    Runs against in-memory cache so no real Redis is needed.
    """

    REGISTER_URL = '/api/auth/register/'
    LOGIN_URL = '/api/auth/login/'
    LOGOUT_URL = '/api/auth/logout/'
    VERIFY_EMAIL_URL = '/api/auth/verify-email/'
    SEND_OTP_URL = '/api/auth/send-otp/'
    RESET_PASSWORD_URL = '/api/auth/reset-password/'
    ME_URL = '/api/auth/me/'
    CHANGE_PASSWORD_URL = '/api/auth/change-password/'

    VALID_PASSWORD = 'SecurePass123!'

    def setUp(self):
        self.client = APIClient()
        # A pre-verified user for login / authenticated endpoint tests
        self.verified_user = User.objects.create_user(
            username='verified', email='verified@test.com',
            password=self.VALID_PASSWORD, is_email_verified=True,
        )
        # An unverified user to test email-verification gate
        self.unverified_user = User.objects.create_user(
            username='unverified', email='unverified@test.com',
            password=self.VALID_PASSWORD, is_email_verified=False,
        )

    # â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_register_success(self):
        response = self.client.post(self.REGISTER_URL, {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': self.VALID_PASSWORD,
            'password2': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        new_user = User.objects.get(username='newuser')
        self.assertFalse(new_user.is_email_verified)

    def test_register_duplicate_email(self):
        response = self.client.post(self.REGISTER_URL, {
            'username': 'anotheruser',
            'email': 'verified@test.com',  # already taken
            'password': self.VALID_PASSWORD,
            'password2': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_duplicate_username(self):
        response = self.client.post(self.REGISTER_URL, {
            'username': 'verified',  # already taken
            'email': 'unique@test.com',
            'password': self.VALID_PASSWORD,
            'password2': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_password_mismatch(self):
        response = self.client.post(self.REGISTER_URL, {
            'username': 'mismatch',
            'email': 'mismatch@test.com',
            'password': self.VALID_PASSWORD,
            'password2': 'DifferentPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        response = self.client.post(self.REGISTER_URL, {
            'username': 'weakpass',
            'email': 'weakpass@test.com',
            'password': '123',
            'password2': '123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_login_blocked_unverified(self):
        """Unverified email â†’ 403 with machine-readable code so frontend can redirect."""
        response = self.client.post(self.LOGIN_URL, {
            'identifier': 'unverified',
            'password': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('code'), 'email_not_verified')

    def test_login_with_username(self):
        response = self.client.post(self.LOGIN_URL, {
            'identifier': 'verified',
            'password': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_email(self):
        response = self.client.post(self.LOGIN_URL, {
            'identifier': 'verified@test.com',
            'password': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_wrong_password(self):
        response = self.client.post(self.LOGIN_URL, {
            'identifier': 'verified',
            'password': 'WrongPassword!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_role_in_token(self):
        """JWT access and refresh tokens must contain the user's role and username as claims."""
        import base64, json

        response = self.client.post(self.LOGIN_URL, {
            'identifier': 'verified',
            'password': self.VALID_PASSWORD,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        def decode_payload(token: str) -> dict:
            payload_b64 = token.split('.')[1]
            padding = 4 - len(payload_b64) % 4
            payload_b64 += '=' * (padding % 4)
            return json.loads(base64.urlsafe_b64decode(payload_b64))

        access_payload = decode_payload(response.data['access'])
        refresh_payload = decode_payload(response.data['refresh'])

        self.assertIn('role', access_payload)
        self.assertIn('role', refresh_payload)
        self.assertEqual(access_payload['role'], self.verified_user.role)
        self.assertEqual(refresh_payload['role'], self.verified_user.role)

        self.assertIn('username', access_payload)
        self.assertIn('username', refresh_payload)
        self.assertEqual(access_payload['username'], self.verified_user.username)
        self.assertEqual(refresh_payload['username'], self.verified_user.username)


    # â”€â”€ Email Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_verify_email_success(self):
        otp = generate_otp()
        store_otp(self.unverified_user.id, OTPType.VERIFY_EMAIL, otp)

        response = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'unverified@test.com',
            'otp': otp,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.unverified_user.refresh_from_db()
        self.assertTrue(self.unverified_user.is_email_verified)

    def test_verify_email_wrong_otp(self):
        """Single wrong guess â†’ 400 INVALID, email stays unverified."""
        store_otp(self.unverified_user.id, OTPType.VERIFY_EMAIL, '123456')
        response = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'unverified@test.com',
            'otp': '000000',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.unverified_user.refresh_from_db()
        self.assertFalse(self.unverified_user.is_email_verified)

    def test_verify_email_expired_otp(self):
        """No OTP in cache (expired / not requested) â†’ 410 GONE."""
        response = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'unverified@test.com',
            'otp': '123456',
        })
        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_verify_email_lockout(self):
        """5 wrong guesses exhaust the limit â†’ 429 on the final attempt, OTP invalidated."""
        store_otp(self.unverified_user.id, OTPType.VERIFY_EMAIL, '999999')

        for i in range(4):
            resp = self.client.post(self.VERIFY_EMAIL_URL, {
                'email': 'unverified@test.com',
                'otp': '000000',
            })
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST,
                             msg=f'Expected 400 on attempt {i + 1}')

        # 5th attempt triggers lockout
        resp = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'unverified@test.com',
            'otp': '000000',
        })
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # OTP is now burned â€” correct code also returns EXPIRED (410)
        resp_correct = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'unverified@test.com',
            'otp': '999999',
        })
        self.assertEqual(resp_correct.status_code, status.HTTP_410_GONE)
        self.unverified_user.refresh_from_db()
        self.assertFalse(self.unverified_user.is_email_verified)

    def test_verify_email_unknown_email(self):
        response = self.client.post(self.VERIFY_EMAIL_URL, {
            'email': 'nobody@test.com',
            'otp': '123456',
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # â”€â”€ Send OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_send_otp_success(self):
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'unverified@test.com',
            'otp_type': OTPType.VERIFY_EMAIL,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_otp_unknown_email_returns_404(self):
        """Unknown email â†’ 404 (simpler; no enumeration protection needed here)."""
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'nobody@test.com',
            'otp_type': OTPType.VERIFY_EMAIL,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_send_otp_rate_limit(self):
        """Rate limit applies to all OTP types through the same endpoint."""
        for _ in range(3):
            self.client.post(self.SEND_OTP_URL, {
                'email': 'unverified@test.com',
                'otp_type': OTPType.VERIFY_EMAIL,
            })
        # 4th attempt should be rate-limited
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'unverified@test.com',
            'otp_type': OTPType.VERIFY_EMAIL,
        })
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_send_otp_already_verified(self):
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'verified@test.com',
            'otp_type': OTPType.VERIFY_EMAIL,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_otp_password_reset_success(self):
        """send-otp with otp_type=password_reset works for known email."""
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'verified@test.com',
            'otp_type': OTPType.PASSWORD_RESET,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_otp_password_reset_unknown_email(self):
        """password_reset for unknown email â†’ 404 (no forgot-password endpoint any more)."""
        response = self.client.post(self.SEND_OTP_URL, {
            'email': 'nobody@test.com',
            'otp_type': OTPType.PASSWORD_RESET,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # â”€â”€ Reset Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_reset_password_success(self):
        otp = generate_otp()
        store_otp(self.verified_user.id, OTPType.PASSWORD_RESET, otp)

        new_password = 'NewSecurePass456!'
        response = self.client.post(self.RESET_PASSWORD_URL, {
            'email': 'verified@test.com',
            'otp': otp,
            'new_password': new_password,
            'new_password2': new_password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Can now log in with new password
        login_resp = self.client.post(self.LOGIN_URL, {
            'identifier': 'verified',
            'password': new_password,
        })
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_reset_password_wrong_otp(self):
        """Single wrong guess â†’ 400 INVALID."""
        store_otp(self.verified_user.id, OTPType.PASSWORD_RESET, '123456')
        response = self.client.post(self.RESET_PASSWORD_URL, {
            'email': 'verified@test.com',
            'otp': '000000',
            'new_password': 'NewPass789!',
            'new_password2': 'NewPass789!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_lockout(self):
        """5 wrong guesses burn the reset OTP â†’ 429 on the 5th, then 410 on correct code."""
        store_otp(self.verified_user.id, OTPType.PASSWORD_RESET, '999999')

        for i in range(4):
            resp = self.client.post(self.RESET_PASSWORD_URL, {
                'email': 'verified@test.com',
                'otp': '000000',
                'new_password': 'NewPass789!',
                'new_password2': 'NewPass789!',
            })
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST,
                             msg=f'Expected 400 on attempt {i + 1}')

        # 5th attempt triggers lockout
        resp = self.client.post(self.RESET_PASSWORD_URL, {
            'email': 'verified@test.com',
            'otp': '000000',
            'new_password': 'NewPass789!',
            'new_password2': 'NewPass789!',
        })
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # Correct code after lockout is now EXPIRED (410)
        resp_correct = self.client.post(self.RESET_PASSWORD_URL, {
            'email': 'verified@test.com',
            'otp': '999999',
            'new_password': 'NewPass789!',
            'new_password2': 'NewPass789!',
        })
        self.assertEqual(resp_correct.status_code, status.HTTP_410_GONE)

    # â”€â”€ Me / Change Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def test_me_returns_profile(self):
        self.client.force_authenticate(user=self.verified_user)
        response = self.client.get(self.ME_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'verified')
        self.assertEqual(response.data['email'], 'verified@test.com')
        self.assertIn('is_email_verified', response.data)
        self.assertTrue(response.data['is_email_verified'])

    def test_me_requires_auth(self):
        response = self.client.get(self.ME_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.verified_user)
        new_password = 'ChangedPass999!'
        response = self.client.post(self.CHANGE_PASSWORD_URL, {
            'current_password': self.VALID_PASSWORD,
            'new_password': new_password,
            'new_password2': new_password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.verified_user.refresh_from_db()
        self.assertTrue(self.verified_user.check_password(new_password))

    def test_change_password_wrong_current(self):
        self.client.force_authenticate(user=self.verified_user)
        response = self.client.post(self.CHANGE_PASSWORD_URL, {
            'current_password': 'WrongCurrentPass!',
            'new_password': 'NewPass123!',
            'new_password2': 'NewPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -- Change Email ------------------------------------------

    CHANGE_EMAIL_REQUEST_URL = '/api/auth/change-email/request/'
    CHANGE_EMAIL_VERIFY_URL = '/api/auth/change-email/verify/'

    def test_change_email_request_success(self):
        self.client.force_authenticate(user=self.verified_user)
        response = self.client.post(self.CHANGE_EMAIL_REQUEST_URL, {
            'current_password': self.VALID_PASSWORD,
            'new_email': 'new_email@test.com',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check cache if pending email was stored
        from .utils import get_pending_email
        self.assertEqual(get_pending_email(self.verified_user.id), 'new_email@test.com')

    def test_change_email_request_duplicate(self):
        self.client.force_authenticate(user=self.verified_user)
        # unverified@test.com is already in use by self.unverified_user
        response = self.client.post(self.CHANGE_EMAIL_REQUEST_URL, {
            'current_password': self.VALID_PASSWORD,
            'new_email': 'unverified@test.com',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_email', response.data)

    def test_change_email_request_same_email(self):
        self.client.force_authenticate(user=self.verified_user)
        response = self.client.post(self.CHANGE_EMAIL_REQUEST_URL, {
            'current_password': self.VALID_PASSWORD,
            'new_email': 'verified@test.com',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_email_verify_success(self):
        self.client.force_authenticate(user=self.verified_user)
        from .utils import store_pending_email
        store_pending_email(self.verified_user.id, 'new_email@test.com')
        otp = generate_otp()
        store_otp(self.verified_user.id, OTPType.CHANGE_EMAIL, otp)

        response = self.client.post(self.CHANGE_EMAIL_VERIFY_URL, {
            'otp': otp,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.verified_user.refresh_from_db()
        self.assertEqual(self.verified_user.email, 'new_email@test.com')

    def test_sensitive_password_lockout(self):
        """5 wrong password guesses triggers 429 lockout for sensitive actions."""
        self.client.force_authenticate(user=self.verified_user)
        
        # Clear cache before testing to make sure state is clean
        from django.core.cache import cache
        cache.delete(f'sensitive_fails:{self.verified_user.id}')
        
        for i in range(6):
            resp = self.client.post(self.CHANGE_PASSWORD_URL, {
                'current_password': 'WrongPassword123!',
                'new_password': 'SuperSecretPass999!',
                'new_password2': 'SuperSecretPass999!',
            })
            if i < 5:
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST, msg=f"Attempt {i+1} failed")
            else:
                self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS, msg="Attempt 6 should be locked out")

        # After lockout, even correct password returns 429
        resp = self.client.post(self.CHANGE_PASSWORD_URL, {
            'current_password': self.VALID_PASSWORD,
            'new_password': 'SuperSecretPass999!',
            'new_password2': 'SuperSecretPass999!',
        })
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_me_update_username_success(self):
        self.client.force_authenticate(user=self.verified_user)
        response = self.client.patch(self.ME_URL, {'username': 'new_awesome_name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.verified_user.refresh_from_db()
        self.assertEqual(self.verified_user.username, 'new_awesome_name')

    def test_me_update_username_duplicate(self):
        self.client.force_authenticate(user=self.verified_user)
        # Try to take the unverified user's username
        response = self.client.patch(self.ME_URL, {'username': 'unverified'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
