from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User, UserRole
from .models import Question, Answer, SuggestedEdit, PostStatus
from django.contrib.contenttypes.models import ContentType

class QnAAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.student = User.objects.create_user(username='student', password='password', role=UserRole.STUDENT)
        self.admin = User.objects.create_user(username='admin', password='password', role=UserRole.ADMIN)

        # Create initial data
        self.question = Question.objects.create(
            author=self.student,
            title='Test Question',
            body='This is a test question.',
            status=PostStatus.APPROVED
        )

    def test_student_can_create_question(self):
        self.client.force_authenticate(user=self.student)
        url = '/api/questions/'
        data = {'title': 'New Question', 'body': 'New Body'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], PostStatus.PENDING)

    def test_student_cannot_edit_question_directly(self):
        self.client.force_authenticate(user=self.student)
        url = f'/api/questions/{self.question.id}/'
        data = {'body': 'Hacked body'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_edit_question_directly(self):
        self.client.force_authenticate(user=self.admin)
        url = f'/api/questions/{self.question.id}/'
        data = {'body': 'Admin fixed body'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.question.refresh_from_db()
        self.assertEqual(self.question.body, 'Admin fixed body')

    def test_student_suggest_edit_workflow(self):
        # 1. Student suggests an edit
        self.client.force_authenticate(user=self.student)
        url = f'/api/questions/{self.question.id}/suggest_edit/'
        data = {'proposed_text': 'Better question body'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        suggested_edit_id = response.data['suggested_edit_id']
        suggested_edit = SuggestedEdit.objects.get(id=suggested_edit_id)
        self.assertEqual(suggested_edit.status, PostStatus.PENDING)

        # 2. Student cannot approve it
        approve_url = f'/api/suggested-edits/{suggested_edit_id}/approve/'
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin approves it
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Verify original question is updated
        self.question.refresh_from_db()
        self.assertEqual(self.question.body, 'Better question body')
        
        # 5. Verify history was created (simple_history)
        self.assertTrue(self.question.history.count() > 1)
