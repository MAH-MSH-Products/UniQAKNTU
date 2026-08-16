from django.contrib import admin
from .models import Question, Answer, AnswerRevision


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_number', 'text', 'exam']
    list_filter = ['exam']
    search_fields = ['text', 'question_number']
    ordering = ['exam', 'question_number']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['question', 'author', 'current_body', 'is_verified', 'image', 'pdf_file']
    list_filter = ['author', 'is_verified']
    search_fields = ['question__text', 'author__username']
    ordering = ['question']
    readonly_fields = ['image', 'pdf_file']


@admin.register(AnswerRevision)
class AnswerRevisionAdmin(admin.ModelAdmin):
    list_display = ['answer', 'editor', 'created_at', 'edit_summary']
    list_filter = ['editor', 'created_at']
    search_fields = ['answer__question__text', 'editor__username']
    ordering = ['-created_at']
