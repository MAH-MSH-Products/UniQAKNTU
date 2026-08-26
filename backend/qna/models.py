from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from simple_history.models import HistoricalRecords
from tags.models import Tag

class SourceMaterial(models.Model):
    title = models.CharField(max_length=255, help_text="e.g., '2024 OS Exam'")
    question_pdf = models.FileField(upload_to='exams/questions/', null=True, blank=True)
    answer_pdf = models.FileField(upload_to='exams/answers/', null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class FileAttachment(models.Model):
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Generic FK
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"Attachment {self.id} by {self.uploader}"

class Comment(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generic FK
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"Comment by {self.author.username} at {self.created_at}"

class Vote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    value = models.SmallIntegerField(choices=[(1, 'Upvote'), (-1, 'Downvote')])
    created_at = models.DateTimeField(auto_now_add=True)

    # Generic FK
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        # Prevent multiple votes by the same user on the same object
        unique_together = ('user', 'content_type', 'object_id')

class PostStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'

class Question(models.Model):
    source_material = models.ForeignKey(SourceMaterial, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    title = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField(blank=True, null=True)
    score = models.IntegerField(default=0)
    status = models.CharField(max_length=15, choices=PostStatus.choices, default=PostStatus.PENDING)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='questions')
    tags = models.ManyToManyField(Tag, blank=True, related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generic Relations
    attachments = GenericRelation(FileAttachment)
    comments = GenericRelation(Comment)
    votes = GenericRelation(Vote)
    
    history = HistoricalRecords()

    def __str__(self):
        return self.title or f"Question {self.id}"

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    body = models.TextField(blank=True, null=True)
    score = models.IntegerField(default=0)
    status = models.CharField(max_length=15, choices=PostStatus.choices, default=PostStatus.PENDING)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='answers')
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generic Relations
    attachments = GenericRelation(FileAttachment)
    comments = GenericRelation(Comment)
    votes = GenericRelation(Vote)

    history = HistoricalRecords()

    def __str__(self):
        return f"Answer to {self.question}"

class SuggestedEdit(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    proposed_text = models.TextField(help_text="The new markdown body proposed by the student.")
    removed_attachment_ids = models.JSONField(default=list, blank=True, help_text="List of FileAttachment IDs to delete upon approval.")
    status = models.CharField(max_length=15, choices=PostStatus.choices, default=PostStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    # Generic FK to target either a Question or Answer
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    attachments = GenericRelation('FileAttachment')

    def __str__(self):
        return f"Suggested Edit by {self.author} on {self.content_type.name} {self.object_id}"

