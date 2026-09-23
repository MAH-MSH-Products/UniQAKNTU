from django.db import models
from django.core.validators import MinValueValidator


class SourceMaterialChapter(models.Model):
    """
    Represents a chapter within a source material (book/course).
    This is the standardized granularity level for all planner modules.

    Each chapter belongs to a SourceMaterial and is uniquely identified by
    the combination of source_material and chapter_number.
    """
    source_material = models.ForeignKey(
        'qna.SourceMaterial',
        on_delete=models.CASCADE,
        related_name='chapters',
        help_text='The source material (book/course) this chapter belongs to'
    )
    title = models.CharField(
        max_length=255,
        help_text='Chapter title (e.g., "Graph Theory")'
    )
    chapter_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Chapter number within the source material'
    )
    page_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Number of pages in this chapter (optional)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when this chapter was created'
    )

    class Meta:
        db_table = 'curriculum_sourcematerialchapter'
        ordering = ['source_material', 'chapter_number']
        unique_together = [['source_material', 'chapter_number']]
        verbose_name = 'Source Material Chapter'
        verbose_name_plural = 'Source Material Chapters'
        indexes = [
            models.Index(fields=['source_material', 'chapter_number']),
        ]

    def __str__(self):
        return f"{self.source_material.title} - Chapter {self.chapter_number}: {self.title}"

    def clean(self):
        """Validate that chapter_number is positive and title is not blank."""
        from django.core.exceptions import ValidationError

        if self.chapter_number < 1:
            raise ValidationError({
                'chapter_number': 'Chapter number must be greater than 0.'
            })

        if not self.title or not self.title.strip():
            raise ValidationError({
                'title': 'Chapter title cannot be blank.'
            })
