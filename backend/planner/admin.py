from django.contrib import admin
from .models import (
    DailyStudyLog,
    StudyActivity,
    ChapterMastery,
    TestRecord,
    DailyNote,
    ConsultationBooking
)


class StudyActivityInline(admin.TabularInline):
    model = StudyActivity
    extra = 0
    fields = ('chapter', 'activity_type', 'duration_minutes')


@admin.register(DailyStudyLog)
class DailyStudyLogAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'sleep_duration_minutes', 'is_finalized', 'created_at')
    list_filter = ('is_finalized', 'date')
    search_fields = ('student__username', 'student__email')
    ordering = ('-date',)
    inlines = [StudyActivityInline]


@admin.register(StudyActivity)
class StudyActivityAdmin(admin.ModelAdmin):
    list_display = ('daily_log', 'chapter', 'activity_type', 'duration_minutes')
    list_filter = ('activity_type',)
    search_fields = ('daily_log__student__username', 'chapter__title')


@admin.register(ChapterMastery)
class ChapterMasteryAdmin(admin.ModelAdmin):
    list_display = ('student', 'chapter', 'level', 'created_at', 'updated_at')
    list_filter = ('level', 'updated_at')
    search_fields = ('student__username', 'chapter__title')
    ordering = ('-updated_at',)


@admin.register(TestRecord)
class TestRecordAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'chapter',
        'date',
        'test_format',
        'test_method',
        'total_tests',
        'correct_tests',
        'wrong_tests',
        'percentage'
    )
    list_filter = ('test_format', 'test_method', 'date')
    search_fields = ('student__username', 'chapter__title')
    ordering = ('-date', '-id')


@admin.register(DailyNote)
class DailyNoteAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'short_text', 'created_at')
    list_filter = ('date',)
    search_fields = ('student__username', 'text')
    ordering = ('-date',)

    def short_text(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    short_text.short_description = 'Note'


@admin.register(ConsultationBooking)
class ConsultationBookingAdmin(admin.ModelAdmin):
    list_display = ('student', 'day_of_week', 'time_slot', 'status', 'created_at')
    list_filter = ('status', 'day_of_week')
    search_fields = ('student__username', 'notes')
    ordering = ('-created_at',)
