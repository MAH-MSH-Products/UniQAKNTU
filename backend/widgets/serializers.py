from rest_framework import serializers
from qna.models import Answer, SourceMaterial
import jdatetime

class WidgetAnswerSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='question.title', read_only=True)
    course = serializers.CharField(source='question.source_material.title', read_only=True, default=None)
    author = serializers.CharField(source='author.username', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['id', 'title', 'course', 'author', 'date']

    def get_date(self, obj):
        if obj.created_at:
            jdate = jdatetime.datetime.fromgregorian(datetime=obj.created_at)
            return jdate.strftime('%Y/%m/%d')
        return None

class WidgetCourseSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    questions_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = SourceMaterial
        fields = ['id', 'title', 'date', 'questions_count']

    def get_date(self, obj):
        if obj.created_at:
            jdate = jdatetime.datetime.fromgregorian(datetime=obj.created_at)
            return jdate.strftime('%Y/%m/%d')
        return None

