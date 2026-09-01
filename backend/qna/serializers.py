from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import SourceMaterial, Question, Answer, FileAttachment, Comment, Vote, SuggestedEdit
from tags.serializers import TagSerializer
from core.utils import JalaliDateTimeField

from django.contrib.contenttypes.models import ContentType

class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_at_jalali = JalaliDateTimeField(source='uploaded_at', read_only=True)
    attached_to_model = serializers.SerializerMethodField()
    relative_path = serializers.SerializerMethodField(help_text="Use this relative path when inserting into Markdown to avoid hardcoding domains.")

    class Meta:
        model = FileAttachment
        fields = ['id', 'file', 'relative_path', 'object_id', 'attached_to_model', 'uploaded_at', 'uploaded_at_jalali']
        read_only_fields = ['id', 'object_id', 'uploaded_at', 'attached_to_model']

    @extend_schema_field(OpenApiTypes.STR)
    def get_relative_path(self, obj):
        return obj.file.name if obj.file else None

    @extend_schema_field(serializers.ChoiceField(choices=['question', 'answer', 'suggestededit']))
    def get_attached_to_model(self, obj):
        return obj.content_type.model if obj.content_type else None

class SourceMaterialSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)

    class Meta:
        model = SourceMaterial
        fields = ['id', 'title', 'question_pdf', 'answer_pdf', 'year', 'created_at', 'created_at_jalali']

class CommentSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    updated_at_jalali = JalaliDateTimeField(source='updated_at', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_name', 'body', 'parent', 'replies', 'is_deleted', 'created_at', 'created_at_jalali', 'updated_at', 'updated_at_jalali']
        read_only_fields = ['author', 'is_deleted']

    @extend_schema_field(OpenApiTypes.ANY)
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_deleted:
            data['body'] = "[Deleted]"
            data['author'] = None
            data['author_name'] = None
        return data

class QuestionSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    updated_at_jalali = JalaliDateTimeField(source='updated_at', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()
    tag_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    attachment_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    
    class Meta:
        model = Question
        fields = ['id', 'source_material', 'title', 'body', 'score', 'user_vote', 'status', 'author', 'author_name', 'is_official', 'tags', 'tag_ids', 'attachments', 'attachment_ids', 'created_at', 'created_at_jalali', 'updated_at', 'updated_at_jalali']
        read_only_fields = ['score', 'status', 'author']

    def validate(self, attrs):
        if 'is_official' in attrs:
            request = self.context.get('request')
            if not request or request.user.role not in ['ADMIN', 'MODERATOR']:
                attrs.pop('is_official')
        return attrs

    @extend_schema_field(OpenApiTypes.INT)
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return vote.value
        return 0

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        attachment_ids = validated_data.pop('attachment_ids', [])
        question = super().create(validated_data)
        
        # Link tags
        if tag_ids:
            from tags.models import Tag
            tags = Tag.objects.filter(id__in=tag_ids)
            question.tags.set(tags)
            
        # Link attachments
        if attachment_ids:
            request = self.context.get('request')
            user = request.user if request else None
            ctype = ContentType.objects.get_for_model(Question)
            FileAttachment.objects.filter(
                id__in=attachment_ids, 
                object_id__isnull=True,
                uploader=user
            ).update(content_type=ctype, object_id=question.id)
        return question

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        attachment_ids = validated_data.pop('attachment_ids', None)
        question = super().update(instance, validated_data)
        
        if tag_ids is not None:
            from tags.models import Tag
            tags = Tag.objects.filter(id__in=tag_ids)
            question.tags.set(tags)
            
        if attachment_ids is not None:
            # Delete any existing attachments not in the incoming list
            instance.attachments.exclude(id__in=attachment_ids).delete()

            request = self.context.get('request')
            user = request.user if request else None
            ctype = ContentType.objects.get_for_model(Question)
            FileAttachment.objects.filter(
                id__in=attachment_ids,
                object_id__isnull=True,
                uploader=user
            ).update(content_type=ctype, object_id=question.id)
        return question


class AnswerSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    updated_at_jalali = JalaliDateTimeField(source='updated_at', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()
    attachment_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Answer
        fields = ['id', 'question', 'body', 'score', 'user_vote', 'status', 'author', 'author_name', 'is_official', 'is_accepted', 'attachments', 'attachment_ids', 'created_at', 'created_at_jalali', 'updated_at', 'updated_at_jalali']
        read_only_fields = ['score', 'status', 'author', 'is_accepted']

    def validate(self, attrs):
        if 'is_official' in attrs:
            request = self.context.get('request')
            if not request or request.user.role not in ['ADMIN', 'MODERATOR']:
                attrs.pop('is_official')
        return attrs

    def create(self, validated_data):
        attachment_ids = validated_data.pop('attachment_ids', [])
        answer = super().create(validated_data)
        if attachment_ids:
            request = self.context.get('request')
            user = request.user if request else None
            ctype = ContentType.objects.get_for_model(Answer)
            FileAttachment.objects.filter(
                id__in=attachment_ids,
                object_id__isnull=True,
                uploader=user
            ).update(content_type=ctype, object_id=answer.id)
        return answer

    def update(self, instance, validated_data):
        attachment_ids = validated_data.pop('attachment_ids', None)
        answer = super().update(instance, validated_data)
        if attachment_ids is not None:
            instance.attachments.exclude(id__in=attachment_ids).delete()

            request = self.context.get('request')
            user = request.user if request else None
            ctype = ContentType.objects.get_for_model(Answer)
            FileAttachment.objects.filter(
                id__in=attachment_ids,
                object_id__isnull=True,
                uploader=user
            ).update(content_type=ctype, object_id=answer.id)
        return answer

    @extend_schema_field(OpenApiTypes.INT)
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return vote.value
        return 0

class SuggestedEditSerializer(serializers.ModelSerializer):
    created_at_jalali = JalaliDateTimeField(source='created_at', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    target_type = serializers.SerializerMethodField()
    target_id = serializers.IntegerField(source='object_id', read_only=True)
    
    class Meta:
        model = SuggestedEdit
        fields = ['id', 'target_type', 'target_id', 'proposed_text', 'removed_attachment_ids', 'status', 'author', 'author_name', 'attachments', 'created_at', 'created_at_jalali']
        read_only_fields = ['status', 'author']

    @extend_schema_field(serializers.ChoiceField(choices=['question', 'answer']))
    def get_target_type(self, obj):
        return obj.content_type.model if obj.content_type else None
