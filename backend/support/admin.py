from django.contrib import admin
from .models import Ticket, TicketMessage, ContentReport

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'author__username')

@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'sender', 'created_at')
    search_fields = ('ticket__title', 'sender__username')

@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'reporter', 'content_type', 'object_id', 'status', 'created_at')
    list_filter = ('status', 'content_type')
    search_fields = ('reporter__username', 'reason')

