from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import Ticket, TicketMessage, ContentReport, TicketCategory, TicketStatus, ContentReportStatus
from qna.models import Question

User = get_user_model()

class SupportModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='testuser@test.com', password='pwd')
        self.ticket = Ticket.objects.create(
            author=self.user,
            title='Need help with login',
            category=TicketCategory.TECHNICAL_ISSUE
        )

    def test_ticket_creation(self):
        self.assertEqual(self.ticket.status, TicketStatus.OPEN)
        self.assertEqual(str(self.ticket), 'Need help with login (Open)')

    def test_ticket_message_creation(self):
        msg = TicketMessage.objects.create(
            ticket=self.ticket,
            sender=self.user,
            message='I cannot login.'
        )
        self.assertEqual(str(msg), f'Message by {self.user.username} on Ticket {self.ticket.id}')

    def test_content_report_creation(self):
        question = Question.objects.create(
            title='Test Question',
            body='Test Body',
            author=self.user
        )
        report = ContentReport.objects.create(
            reporter=self.user,
            content_type=ContentType.objects.get_for_model(Question),
            object_id=question.id,
            reason='Inappropriate content'
        )
        self.assertEqual(report.status, ContentReportStatus.PENDING)
        self.assertEqual(str(report), f'Report by {self.user.username} on question')

