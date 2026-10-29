from django.contrib import admin
from .models import StudentOpinion, OpinionVote


@admin.register(StudentOpinion)
class StudentOpinionAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'status', 'is_anonymous', 'likes', 'dislikes', 'short_text', 'created_at')
    list_filter = ('status', 'is_anonymous', 'created_at')
    search_fields = ('author__username', 'text')
    ordering = ('-created_at',)
    actions = ['approve_opinions', 'reject_opinions']

    def short_text(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    short_text.short_description = 'Text'

    @admin.action(description='Approve selected opinions')
    def approve_opinions(self, request, queryset):
        queryset.update(status='APPROVED')

    @admin.action(description='Reject selected opinions')
    def reject_opinions(self, request, queryset):
        queryset.update(status='REJECTED')


@admin.register(OpinionVote)
class OpinionVoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'opinion', 'vote_type', 'created_at')
    list_filter = ('vote_type', 'created_at')
    search_fields = ('user__username', 'opinion__text')
    ordering = ('-created_at',)
