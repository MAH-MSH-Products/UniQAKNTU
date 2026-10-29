from django.contrib import admin
from .models import SourceMaterialChapter


@admin.register(SourceMaterialChapter)
class SourceMaterialChapterAdmin(admin.ModelAdmin):
    list_display = ['chapter_number', 'title', 'source_material', 'page_count', 'created_at']
    list_filter = ['source_material', 'created_at']
    search_fields = ['title', 'source_material__title']
    ordering = ['source_material', 'chapter_number']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Chapter Information', {
            'fields': ('source_material', 'chapter_number', 'title', 'page_count')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
