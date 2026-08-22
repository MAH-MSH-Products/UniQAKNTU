from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SourceMaterialViewSet, QuestionViewSet, AnswerViewSet, SuggestedEditViewSet

router = DefaultRouter()
router.register(r'source-materials', SourceMaterialViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'answers', AnswerViewSet)
router.register(r'suggested-edits', SuggestedEditViewSet, basename='suggested-edits')

urlpatterns = [
    path('', include(router.urls)),
]
