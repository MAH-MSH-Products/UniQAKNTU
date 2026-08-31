from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User, UserRole
from .models import Question, Answer, SuggestedEdit, PostStatus
from django.contrib.contenttypes.models import ContentType

class QnAAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.student = User.objects.create_user(username='student', email='student@test.com', password='password', role=UserRole.STUDENT)
        self.admin = User.objects.create_user(username='admin', email='admin@test.com', password='password', role=UserRole.ADMIN)

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
        other_student = User.objects.create_user(username='other', email='other@test.com', password='password', role=UserRole.STUDENT)
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


    def test_markdown_upload_and_claim(self):
        self.client.force_authenticate(user=self.student)
        # 1. Upload orphan file
        from django.core.files.uploadedfile import SimpleUploadedFile
        file_obj = SimpleUploadedFile('test.png', b'file_content', content_type='image/png')
        upload_url = '/api/attachments/'
        response = self.client.post(upload_url, {'file': file_obj}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        attachment_id = response.data['id']
        
        # 2. Create question and claim
        url = '/api/questions/'
        from tags.models import TagCategory, Tag
        cat = TagCategory.objects.create(name='Subject')
        tag = Tag.objects.create(category=cat, value='Math')
        data = {'title': 'T', 'body': 'B', 'tag_ids': [tag.id], 'attachment_ids': [attachment_id]}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['tags']), 1)
        self.assertEqual(len(response.data['attachments']), 1)
        self.assertEqual(response.data['attachments'][0]['id'], attachment_id)


    def test_update_removes_attachments(self):
        self.client.force_authenticate(user=self.student)
        # 1. Upload two orphan files
        from django.core.files.uploadedfile import SimpleUploadedFile
        f1 = SimpleUploadedFile('f1.txt', b'1', content_type='text/plain')
        f2 = SimpleUploadedFile('f2.txt', b'2', content_type='text/plain')
        
        a1_id = self.client.post('/api/attachments/', {'file': f1}, format='multipart').data['id']
        a2_id = self.client.post('/api/attachments/', {'file': f2}, format='multipart').data['id']
        
        # 2. Create question with both
        url = '/api/questions/'
        data = {'title': 'T', 'body': 'B', 'attachment_ids': [a1_id, a2_id]}
        response = self.client.post(url, data)
        question_id = response.data['id']
        self.assertEqual(len(response.data['attachments']), 2)
        
        # 3. Update question, removing a1_id (must be admin to edit directly)
        self.client.force_authenticate(user=self.admin)
        update_url = f'/api/questions/{question_id}/'
        # using PATCH
        patch_data = {'attachment_ids': [a2_id]}
        response = self.client.patch(update_url, patch_data)
        self.assertEqual(len(response.data['attachments']), 1)
        self.assertEqual(response.data['attachments'][0]['id'], a2_id)
        
        # 4. Verify a1_id is deleted from database
        from .models import FileAttachment
        self.assertFalse(FileAttachment.objects.filter(id=a1_id).exists())
        self.assertTrue(FileAttachment.objects.filter(id=a2_id).exists())

    def test_is_official_flag(self):
        # Admin creates official question
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/questions/', {'title': 'Official Q', 'body': '...', 'is_official': True})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_official'])
        
        # Student creates question with is_official=True, but it is ignored
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/questions/', {'title': 'Sneaky Q', 'body': '...', 'is_official': True})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_official'])

        # Test filtering
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/questions/?is_official=true')
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Official Q')

    def test_comment_replies_and_soft_delete(self):
        self.client.force_authenticate(user=self.student)
        # Create top-level comment
        url = f'/api/questions/{self.question.id}/comments/'
        response = self.client.post(url, {'body': 'First comment'})
        comment_id = response.data['id']
        
        # Create a reply
        response = self.client.post(url, {'body': 'A reply', 'parent_id': comment_id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reply_id = response.data['id']
        self.assertEqual(response.data['parent'], comment_id)
        
        # Test 1-level nesting (replying to a reply attaches to top-level)
        response = self.client.post(url, {'body': 'Deep reply', 'parent_id': reply_id})
        self.assertEqual(response.data['parent'], comment_id)  # Should point to top-level
        
        # Soft-delete the top-level comment
        delete_url = f'/api/questions/{self.question.id}/comments/{comment_id}/'
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify GET returns [Deleted] and hides author, but keeps replies
        response = self.client.get(url)
        comments = response.data
        self.assertEqual(len(comments), 1)
        self.assertEqual(comments[0]['id'], comment_id)
        self.assertEqual(comments[0]['body'], '[Deleted]')
        self.assertIsNone(comments[0]['author'])
        self.assertEqual(len(comments[0]['replies']), 2)
