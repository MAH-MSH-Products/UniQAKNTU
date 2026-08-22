from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, UserRole

class UsersAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='student', password='testpassword123', role=UserRole.STUDENT)

    def test_get_jwt_token(self):
        url = '/api/auth/token/'
        data = {
            'username': 'student',
            'password': 'testpassword123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
