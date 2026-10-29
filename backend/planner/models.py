from datetime import date
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from curriculum.models import SourceMaterialChapter

# Standard alias so all planner modules share the same canonical Chapter entity
Chapter = SourceMaterialChapter


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
        SourceMaterialChapter,
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


class TestFormat(models.TextChoices):
    ALL = 'ALL', 'ALL'
    EVEN = 'EVEN', 'EVEN'
    ODD = 'ODD', 'ODD'
    THREE_K = '3K', '3K'
    THREE_K_1 = '3K_1', '3K_1'
    THREE_K_2 = '3K_2', '3K_2'
    FOUR_K = '4K', '4K'
    FOUR_K_1 = '4K_1', '4K_1'
    FOUR_K_2 = '4K_2', '4K_2'
    FOUR_K_3 = '4K_3', '4K_3'
    HALF_1 = 'HALF_1', 'HALF_1'
    HALF_2 = 'HALF_2', 'HALF_2'
    IMPORTANT = 'IMPORTANT', 'IMPORTANT'
    THIRD_1 = 'THIRD_1', 'THIRD_1'
    THIRD_2 = 'THIRD_2', 'THIRD_2'
    THIRD_3 = 'THIRD_3', 'THIRD_3'


class TestMethod(models.TextChoices):
    FEEDBACK = 'FEEDBACK', 'FEEDBACK'
    WASHBACK = 'WASHBACK', 'WASHBACK'


class ChapterMastery(models.Model):
    """
    Sub-module 2: Tracks student mastery level (1-100) per chapter.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chapter_masteries',
        verbose_name=_('Student')
    )
    chapter = models.ForeignKey(
        SourceMaterialChapter,
        on_delete=models.CASCADE,
        related_name='mastery_records',
        verbose_name=_('Chapter')
    )
    level = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name=_('Mastery Level (1-100)')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'chapter']
        ordering = ['-updated_at']
        verbose_name = _('Chapter Mastery')
        verbose_name_plural = _('Chapter Masteries')

    def __str__(self):
        return f"{self.student.username} - {self.chapter.title}: {self.level}%"


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
        SourceMaterialChapter,
        on_delete=models.CASCADE,
        related_name='test_records',
        verbose_name=_('Chapter')
    )
    date = models.DateField(default=date.today, verbose_name=_('Date'))
    test_format = models.CharField(
        max_length=50,
        choices=TestFormat.choices,
        default=TestFormat.ALL,
        verbose_name=_('Test Format')
    )
    test_method = models.CharField(
        max_length=50,
        choices=TestMethod.choices,
        default=TestMethod.FEEDBACK,
        verbose_name=_('Test Method')
    )
    total_tests = models.PositiveIntegerField(default=0, verbose_name=_('Total Tests'))
    correct_tests = models.PositiveIntegerField(default=0, verbose_name=_('Correct Tests'))
    wrong_tests = models.PositiveIntegerField(default=0, verbose_name=_('Wrong Tests'))
    untested_tests = models.PositiveIntegerField(default=0, verbose_name=_('Untested Tests'))
    percentage = models.FloatField(default=0.0, verbose_name=_('Percentage'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'chapter', 'test_format', 'test_method']
        ordering = ['-date', '-id']
        verbose_name = _('Test Record')
        verbose_name_plural = _('Test Records')

    def save(self, *args, **kwargs):
        self.untested_tests = max(0, self.total_tests - self.correct_tests - self.wrong_tests)
        if self.total_tests > 0:
            raw_pct = ((self.correct_tests * 3) - self.wrong_tests) / (self.total_tests * 3) * 100
            self.percentage = round(raw_pct, 2)
        else:
            self.percentage = 0.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} - {self.chapter.title} ({self.test_format}/{self.test_method}): {self.percentage}%"
