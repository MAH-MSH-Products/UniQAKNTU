from django.contrib import admin
from .models import TagCategory, Tag

@admin.register(TagCategory)
class TagCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('category', 'value')
    list_filter = ('category',)
    search_fields = ('value',)
