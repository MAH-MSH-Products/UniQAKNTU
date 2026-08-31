from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from qna.models import SourceMaterial, Question, Answer, PostStatus

User = get_user_model()

class WidgetViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='testuser@test.com', password='pwd')

        # Create courses
        self.course1 = SourceMaterial.objects.create(title='Course 1')
        self.course2 = SourceMaterial.objects.create(title='Course 2')

        # Create questions
        self.q1 = Question.objects.create(author=self.user, title='Q1', body='B1', source_material=self.course1)
        self.q2 = Question.objects.create(author=self.user, title='Q2', body='B2', source_material=self.course1)
        self.q3 = Question.objects.create(author=self.user, title='Q3', body='B3', source_material=self.course2)

        # Create answers
        self.a1 = Answer.objects.create(author=self.user, question=self.q1, body='A1', status=PostStatus.APPROVED)
        self.a2 = Answer.objects.create(author=self.user, question=self.q2, body='A2', status=PostStatus.PENDING)

    def test_recent_answers(self):
        response = self.client.get('/api/widgets/recent-answers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 1) # Only approved answers
        self.assertEqual(data[0]['title'], 'Q1')
        self.assertEqual(data[0]['course'], 'Course 1')
        self.assertEqual(data[0]['author'], 'testuser')
        self.assertIn('date', data[0])

    def test_popular_courses(self):
        response = self.client.get('/api/widgets/popular-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['title'], 'Course 1') # Has 2 questions
        self.assertEqual(data[0]['questions_count'], 2)
        self.assertEqual(data[1]['title'], 'Course 2') # Has 1 question
        self.assertEqual(data[1]['questions_count'], 1)

    def test_latest_exams(self):
        response = self.client.get('/api/widgets/latest-exams/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 2)
        # course2 created after course1
        self.assertEqual(data[0]['title'], 'Course 2')

