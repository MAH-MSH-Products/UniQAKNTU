from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from qna.models import Question
from .models import Ticket, TicketMessage, TicketCategory, TicketStatus, ContentReport

User = get_user_model()

class SupportViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(username='student1', password='pwd')
        self.admin = User.objects.create_user(username='admin1', password='pwd', role='ADMIN')

    def test_create_ticket(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/support/tickets/', {
            'title': 'Login issue',
            'category': TicketCategory.TECHNICAL_ISSUE,
            'message': 'I cannot login.'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket_id = response.data['id']
        ticket = Ticket.objects.get(id=ticket_id)
        self.assertEqual(ticket.messages.count(), 1)
        self.assertEqual(ticket.messages.first().message, 'I cannot login.')

    def test_list_tickets_uses_list_serializer(self):
        Ticket.objects.create(author=self.student, title='T1', category=TicketCategory.GENERAL_SUPPORT)
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/support/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('messages', response.data['results'][0])

    def test_retrieve_ticket_uses_detail_serializer(self):
        ticket = Ticket.objects.create(author=self.student, title='T1', category=TicketCategory.GENERAL_SUPPORT)
        TicketMessage.objects.create(ticket=ticket, sender=self.student, message='msg')
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/support/tickets/{ticket.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('messages', response.data)
        self.assertEqual(len(response.data['messages']), 1)

    def test_admin_reply_changes_status(self):
        ticket = Ticket.objects.create(author=self.student, title='T1', category=TicketCategory.GENERAL_SUPPORT)
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/support/admin/tickets/{ticket.id}/reply/', {'message': 'Fixing it'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.IN_PROGRESS)

    def test_create_content_report(self):
        q = Question.objects.create(author=self.student, title='Q1', body='B1')
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/support/reports/', {
            'target_type': 'question',
            'target_id': q.id,
            'reason': 'Spam'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContentReport.objects.count(), 1)

