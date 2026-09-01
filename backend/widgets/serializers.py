from rest_framework import serializers
from qna.models import Answer, SourceMaterial
from core.utils import format_localized_date

class WidgetAnswerSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='question.title', read_only=True)
    course = serializers.CharField(source='question.source_material.title', read_only=True, default=None)
    author = serializers.CharField(source='author.username', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['id', 'title', 'course', 'author', 'date']

    def get_date(self, obj):
        return format_localized_date(obj.created_at)

class WidgetCourseSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    questions_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = SourceMaterial
        fields = ['id', 'title', 'date', 'questions_count']

    def get_date(self, obj):
        return format_localized_date(obj.created_at)


