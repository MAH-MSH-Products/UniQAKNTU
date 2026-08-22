from rest_framework import serializers
from .models import SourceMaterial, Question, Answer, FileAttachment, Comment, Vote, SuggestedEdit
from tags.serializers import TagSerializer
from core.utils import JalaliDateTimeField

from django.contrib.contenttypes.models import ContentType

class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_at_jalali = JalaliDateTimeField(source='uploaded_at', read_only=True)
    model_name = serializers.ChoiceField(
        choices=['question', 'answer', 'suggestededit'],
        write_only=True,
        help_text="The model you are attaching the file to (e.g., 'question')"
    )
    attached_to_model = serializers.SerializerMethodField()

    class Meta:
        model = FileAttachment
        fields = ['id', 'file', 'model_name', 'object_id', 'attached_to_model', 'uploaded_at', 'uploaded_at_jalali']
        read_only_fields = ['id', 'uploaded_at', 'attached_to_model']

    def get_attached_to_model(self, obj):
        return obj.content_type.model if obj.content_type else None

    def create(self, validated_data):
        model_name = validated_data.pop('model_name')
        content_type = ContentType.objects.get(app_label='qna', model=model_name)
        validated_data['content_type'] = content_type
        return super().create(validated_data)

class SourceMaterialSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)

    class Meta:
        model = SourceMaterial
        fields = ['id', 'title', 'question_pdf', 'answer_pdf', 'year', 'created_at', 'created_at_jalali']

class QuestionSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    updated_at_jalali = JalaliDateTimeField(source='updated_at', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'source_material', 'title', 'body', 'score', 'status', 'author', 'tags', 'created_at', 'created_at_jalali', 'updated_at', 'updated_at_jalali']
        read_only_fields = ['score', 'status', 'author']

class AnswerSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    updated_at_jalali = JalaliDateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'question', 'body', 'score', 'status', 'author', 'is_accepted', 'created_at', 'created_at_jalali', 'updated_at', 'updated_at_jalali']
        read_only_fields = ['score', 'status', 'author']

class SuggestedEditSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = SuggestedEdit
        fields = ['id', 'proposed_text', 'removed_attachment_ids', 'status', 'author', 'created_at', 'created_at_jalali']
        read_only_fields = ['status', 'author']
