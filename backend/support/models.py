from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class TicketCategory(models.TextChoices):
    GENERAL_SUPPORT = 'General Support', 'General Support'
    TECHNICAL_ISSUE = 'Technical Issue', 'Technical Issue'
    CONTENT_ERROR = 'Content Error', 'Content Error'
    REQUEST_INSTRUCTOR_ROLE = 'Request Instructor Role', 'Request Instructor Role'

class TicketStatus(models.TextChoices):
    OPEN = 'Open', 'Open'
    IN_PROGRESS = 'In-progress', 'In-progress'
    CLOSED = 'Closed', 'Closed'
    RESOLVED = 'Resolved', 'Resolved'

class Ticket(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=TicketCategory.choices)
    status = models.CharField(max_length=20, choices=TicketStatus.choices, default=TicketStatus.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title} ({self.status})'

class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Message by {self.sender.username} on Ticket {self.ticket.id}'

class ContentReportStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    RESOLVED = 'Resolved', 'Resolved'
    DISMISSED = 'Dismissed', 'Dismissed'

class ContentReport(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=ContentReportStatus.choices, default=ContentReportStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report by {self.reporter.username} on {self.content_type.model}'

