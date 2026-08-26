from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import UserRole

User = get_user_model()

class UserAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='adminuser', password='pwd', role=UserRole.ADMIN)
        self.moderator = User.objects.create_user(username='moduser', password='pwd', role=UserRole.MODERATOR)
        self.student = User.objects.create_user(username='studentuser', password='pwd', role=UserRole.STUDENT)
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

