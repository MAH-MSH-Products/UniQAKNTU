from rest_framework import serializers
from .models import SourceMaterial, Question, Answer, FileAttachment, Comment, Vote, SuggestedEdit
from tags.serializers import TagSerializer
from core.utils import JalaliDateTimeField

class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_at_jalali = JalaliDateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = FileAttachment
        fields = ['id', 'file', 'uploaded_at', 'uploaded_at_jalali']
        read_only_fields = ['id', 'uploaded_at']

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
