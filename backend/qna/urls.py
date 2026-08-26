from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SourceMaterialViewSet, QuestionViewSet, AnswerViewSet, SuggestedEditViewSet, FileAttachmentViewSet

router = DefaultRouter()
router.register(r'source-materials', SourceMaterialViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'answers', AnswerViewSet)
router.register(r'suggested-edits', SuggestedEditViewSet, basename='suggested-edits')
router.register(r'attachments', FileAttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
