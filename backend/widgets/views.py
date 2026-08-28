from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from qna.models import Answer, SourceMaterial, PostStatus
from .serializers import WidgetAnswerSerializer, WidgetCourseSerializer

class WidgetViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'], url_path='recent-answers')
    def recent_answers(self, request):
        answers = Answer.objects.filter(status=PostStatus.APPROVED).order_by('-created_at')[:5]
        serializer = WidgetAnswerSerializer(answers, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'], url_path='popular-courses')
    def popular_courses(self, request):
        courses = SourceMaterial.objects.annotate(questions_count=Count('questions')).order_by('-questions_count')[:5]
        serializer = WidgetCourseSerializer(courses, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'], url_path='latest-exams')
    def latest_exams(self, request):
        courses = SourceMaterial.objects.order_by('-created_at')[:5]
        serializer = WidgetCourseSerializer(courses, many=True)
        return Response({'results': serializer.data})

