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


    def test_vote_scoring(self):
        self.client.force_authenticate(user=self.student)
        url = f'/api/questions/{self.question.id}/vote/'
        self.client.post(url, {'value': 1})
        self.question.refresh_from_db()
        self.assertEqual(self.question.score, 1)
        # Change vote
        self.client.post(url, {'value': -1})
        self.question.refresh_from_db()
        self.assertEqual(self.question.score, -1)

    def test_comments(self):
        self.client.force_authenticate(user=self.student)
        url = f'/api/questions/{self.question.id}/comments/'
        self.client.post(url, {'body': 'Nice!'})
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['body'], 'Nice!')

    def test_accept_answer(self):
        answer = Answer.objects.create(question=self.question, author=self.admin, body='Ans', status=PostStatus.APPROVED)
        self.client.force_authenticate(user=self.student) # Question author
        url = f'/api/answers/{answer.id}/accept/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer.refresh_from_db()
        self.assertTrue(answer.is_accepted)


    def test_visibility_of_pending_posts(self):
        # Admin creates an approved post
        approved_question = Question.objects.create(author=self.admin, title='Q', body='Q', status=PostStatus.APPROVED)
        # Student creates a pending post
        pending_question_own = Question.objects.create(author=self.student, title='P', body='P', status=PostStatus.PENDING)
        # Another student creates a pending post
        other_student = User.objects.create_user(username='other', password='password', role=UserRole.STUDENT)
        pending_question_other = Question.objects.create(author=other_student, title='O', body='O', status=PostStatus.PENDING)
        
        # Unauthenticated user should only see approved
        self.client.logout()
        response = self.client.get('/api/questions/')
        ids = [q['id'] for q in response.data['results']]
        self.assertIn(approved_question.id, ids)
        self.assertNotIn(pending_question_own.id, ids)
        self.assertNotIn(pending_question_other.id, ids)

        # Student should see approved + own pending
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/questions/')
        ids = [q['id'] for q in response.data['results']]
        self.assertIn(approved_question.id, ids)
        self.assertIn(pending_question_own.id, ids)
        self.assertNotIn(pending_question_other.id, ids)

        # Admin should see everything
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/questions/')
        ids = [q['id'] for q in response.data['results']]
        self.assertIn(approved_question.id, ids)
        self.assertIn(pending_question_own.id, ids)
        self.assertIn(pending_question_other.id, ids)

    def test_filters(self):
        # Admin testing filters
        self.client.force_authenticate(user=self.admin)
        # Filter by status
        response = self.client.get('/api/questions/?status=PENDING')
        self.assertEqual(len(response.data['results']), 0) # from setup there's 1 approved question
        # Change setup question to pending to test
        self.question.status = PostStatus.PENDING
        self.question.save()
        response = self.client.get('/api/questions/?status=PENDING')
        self.assertEqual(len(response.data['results']), 1)
        # Filter by author UUID
        response = self.client.get(f'/api/questions/?author={self.student.id}')
        self.assertEqual(len(response.data['results']), 1)
        # Filter by author username
        response = self.client.get('/api/questions/?author__username=student')
        self.assertEqual(len(response.data['results']), 1)

