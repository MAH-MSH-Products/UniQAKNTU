from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Chapter(models.Model):
    """
    Represents a curricular chapter belonging to a SourceMaterial (Course/Exam).
    Standard granularity entity for study planning and tracking.
    """
    source_material = models.ForeignKey(
        'qna.SourceMaterial',
        on_delete=models.CASCADE,
        related_name='chapters',
        verbose_name=_('Source Material')
    )
    title = models.CharField(max_length=255, verbose_name=_('Chapter Title'))
    order = models.PositiveIntegerField(default=1, verbose_name=_('Display Order'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = _('Chapter')
        verbose_name_plural = _('Chapters')

    def __str__(self):
        return f"{self.source_material.title} - {self.title}"


class DailyStudyLog(models.Model):
    """
    Sub-module 5: Single source of truth for daily study time allocation.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_study_logs',
        verbose_name=_('Student')
    )
    date = models.DateField(verbose_name=_('Date'))
    sleep_duration_minutes = models.PositiveIntegerField(default=0, verbose_name=_('Sleep Duration (minutes)'))
    is_finalized = models.BooleanField(default=False, verbose_name=_('Is Finalized'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'date']
        ordering = ['-date']
        verbose_name = _('Daily Study Log')
        verbose_name_plural = _('Daily Study Logs')

    def __str__(self):
        return f"{self.student.username} - {self.date}"


class StudyActivityType(models.TextChoices):
    READING = 'READING', _('Reading')
    REVIEW = 'REVIEW', _('Review')
    CLASS = 'CLASS', _('Class')


class StudyActivity(models.Model):
    """
    Individual study activities associated with a daily log.
    """
    daily_log = models.ForeignKey(
        DailyStudyLog,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name=_('Daily Log')
    )
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='study_activities',
        null=True,
        blank=True,
        verbose_name=_('Chapter')
    )
    activity_type = models.CharField(
        max_length=20,
        choices=StudyActivityType.choices,
        default=StudyActivityType.READING,
        verbose_name=_('Activity Type')
    )
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name=_('Duration (minutes)'))

    class Meta:
        verbose_name = _('Study Activity')
        verbose_name_plural = _('Study Activities')

    def __str__(self):
        chapter_title = self.chapter.title if self.chapter else 'General'
        return f"{self.daily_log.student.username} - {chapter_title} ({self.activity_type}: {self.duration_minutes}m)"


class TestRecord(models.Model):
    """
    Sub-module 2: Single source of truth for test outcomes and analytics.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_records',
        verbose_name=_('Student')
    )
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='test_records',
        verbose_name=_('Chapter')
    )
    date = models.DateField(verbose_name=_('Date'))
    test_format = models.CharField(max_length=50, default='ALL', verbose_name=_('Test Format'))
    test_method = models.CharField(max_length=50, default='FEEDBACK', verbose_name=_('Test Method'))
    total_tests = models.PositiveIntegerField(default=0, verbose_name=_('Total Tests'))
    correct_tests = models.PositiveIntegerField(default=0, verbose_name=_('Correct Tests'))
    wrong_tests = models.PositiveIntegerField(default=0, verbose_name=_('Wrong Tests'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']
        verbose_name = _('Test Record')
        verbose_name_plural = _('Test Records')

    def __str__(self):
        return f"{self.student.username} - {self.chapter.title}: {self.total_tests} tests on {self.date}"
