import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class OpinionStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')


class StudentOpinion(models.Model):
    """
    Sub-module 4: Student community opinion / review.
    Subject to moderation before becoming visible to all students.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opinions',
        verbose_name=_('Author')
    )
    text = models.TextField(verbose_name=_('Opinion Text'))
    is_anonymous = models.BooleanField(default=False, verbose_name=_('Is Anonymous'))
    status = models.CharField(
        max_length=20,
        choices=OpinionStatus.choices,
        default=OpinionStatus.PENDING,
        verbose_name=_('Status')
    )
    likes = models.PositiveIntegerField(default=0, verbose_name=_('Likes'))
    dislikes = models.PositiveIntegerField(default=0, verbose_name=_('Dislikes'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = _('Student Opinion')
        verbose_name_plural = _('Student Opinions')

    def __str__(self):
        author_name = "Anonymous" if self.is_anonymous else self.author.username
        return f"{author_name}: {self.text[:30]} ({self.status})"


class OpinionVote(models.Model):
    """
    Sub-module 4: Tracks individual upvotes (+1) or downvotes (-1) on an opinion.
    Enforces a strict unique constraint per (opinion, user) pair.
    """
    VOTE_CHOICES = (
        (1, _('Like')),
        (-1, _('Dislike')),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    opinion = models.ForeignKey(
        StudentOpinion,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name=_('Opinion')
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opinion_votes',
        verbose_name=_('User')
    )
    vote_type = models.SmallIntegerField(choices=VOTE_CHOICES, verbose_name=_('Vote Type'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['opinion', 'user']
        verbose_name = _('Opinion Vote')
        verbose_name_plural = _('Opinion Votes')

    def __str__(self):
        return f"{self.user.username} voted {self.vote_type} on {self.opinion_id}"
