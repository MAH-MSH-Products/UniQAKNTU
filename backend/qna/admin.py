from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import SourceMaterial, Question, Answer, FileAttachment, Comment, Vote

admin.site.register(SourceMaterial)
admin.site.register(Question, SimpleHistoryAdmin)
admin.site.register(Answer, SimpleHistoryAdmin)
admin.site.register(FileAttachment)
admin.site.register(Comment)
admin.site.register(Vote)
