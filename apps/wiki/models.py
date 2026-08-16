from django.conf import settings
from django.db import models


class Question(models.Model):
    """Model representing a question from an exam."""
    exam = models.ForeignKey('curriculum.Exam', on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    image = models.ImageField(upload_to='questions/', blank=True, null=True)
    question_number = models.IntegerField()
    
    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        ordering = ['exam', 'question_number']
        unique_together = ['exam', 'question_number']
    
    def __str__(self):
        return f"Question {self.question_number} - {self.exam}"


class Answer(models.Model):
    """Model representing an instructor's answer to a question. Multiple instructors can provide answers."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    current_body = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_answers')
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Answer'
        verbose_name_plural = 'Answers'
        unique_together = ['question', 'author']
    
    def __str__(self):
        return f"Answer by {self.author.username} to {self.question}"


class AnswerRevision(models.Model):
    """Model representing a revision history of an instructor's own answer.
    This serves as personal revision history for an instructor's answer, not community history.
    """
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='revisions')
    body = models.TextField()
    editor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='answer_revisions')
    created_at = models.DateTimeField(auto_now_add=True)
    edit_summary = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Answer Revision'
        verbose_name_plural = 'Answer Revisions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Revision of {self.answer} by {self.editor.username} at {self.created_at}"
