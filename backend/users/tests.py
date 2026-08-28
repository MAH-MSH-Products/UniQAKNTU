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


    def test_me_stats(self):
        from qna.models import Answer, Question, Vote, PostStatus
        from django.contrib.contenttypes.models import ContentType
        self.client.force_authenticate(user=self.student)
        q = Question.objects.create(author=self.student, title='Q1')
        Answer.objects.create(author=self.student, question=q, status=PostStatus.APPROVED, is_accepted=True)
        Answer.objects.create(author=self.student, question=q, status=PostStatus.APPROVED, is_accepted=False)
        Answer.objects.create(author=self.admin, question=q, status=PostStatus.APPROVED) # Another user's answer
        
        Vote.objects.create(user=self.admin, content_type=ContentType.objects.get_for_model(Question), object_id=q.id, value=1)
        
        response = self.client.get('/api/users/me/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_answers'], 2)
        self.assertEqual(response.data['total_accepted_answers'], 1)
        self.assertEqual(response.data['total_upvotes'], 1)

