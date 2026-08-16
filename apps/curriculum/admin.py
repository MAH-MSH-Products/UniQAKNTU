from django.contrib import admin
from .models import Course, Exam


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'description']
    search_fields = ['code', 'name']
    ordering = ['code']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'year', 'semester']
    list_filter = ['year', 'semester', 'course']
    search_fields = ['title', 'course__code']
    ordering = ['-year', 'semester']
