from django.db import models


class Course(models.Model):
    """Model representing a university course."""
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Exam(models.Model):
    """Model representing an exam for a course."""
    SEMESTER_CHOICES = [
        ('Fall', 'Fall'),
        ('Spring', 'Spring'),
    ]
    
    title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    year = models.IntegerField()
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    
    class Meta:
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
        ordering = ['-year', 'semester']
        unique_together = ['course', 'year', 'semester']
    
    def __str__(self):
        return f"{self.course.code} - {self.title} ({self.year} {self.semester})"
