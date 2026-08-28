from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from qna.models import FileAttachment, Question, Answer
from .models import Ticket, TicketMessage, ContentReport, TicketStatus

from qna.serializers import FileAttachmentSerializer
class TicketMessageSerializer(serializers.ModelSerializer):
    attachment_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    attachments = FileAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = TicketMessage
        fields = ['id', 'sender', 'message', 'created_at', 'attachment_ids', 'attachments']
        read_only_fields = ['id', 'sender', 'created_at']

    def create(self, validated_data):
        attachment_ids = validated_data.pop('attachment_ids', [])
        message = super().create(validated_data)
        if attachment_ids:
            ctype = ContentType.objects.get_for_model(TicketMessage)
            FileAttachment.objects.filter(
                id__in=attachment_ids, object_id__isnull=True, uploader=message.sender
            ).update(content_type=ctype, object_id=message.id)
        return message

class TicketListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'author', 'title', 'category', 'status', 'created_at', 'updated_at']
        read_only_fields = fields

class TicketDetailSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    message = serializers.CharField(write_only=True, required=True)
    attachment_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Ticket
        fields = ['id', 'author', 'title', 'category', 'status', 'created_at', 'updated_at', 'messages', 'message', 'attachment_ids']
        read_only_fields = ['id', 'author', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        initial_message = validated_data.pop('message')
        attachment_ids = validated_data.pop('attachment_ids', [])
        validated_data['author'] = self.context['request'].user
        ticket = super().create(validated_data)
        msg_serializer = TicketMessageSerializer(data={'message': initial_message, 'attachment_ids': attachment_ids})
        msg_serializer.is_valid(raise_exception=True)
        msg_serializer.save(ticket=ticket, sender=ticket.author)
        return ticket

class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['status']

class ContentReportSerializer(serializers.ModelSerializer):
    target_type = serializers.ChoiceField(choices=['question', 'answer'], write_only=True)
    target_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ContentReport
        fields = ['id', 'reporter', 'target_type', 'target_id', 'reason', 'status', 'created_at']
        read_only_fields = ['id', 'reporter', 'status', 'created_at']

    def create(self, validated_data):
        target_type = validated_data.pop('target_type')
        target_id = validated_data.pop('target_id')
        if target_type == 'question':
            model = Question
        else:
            model = Answer
        ctype = ContentType.objects.get_for_model(model)
        validated_data['content_type'] = ctype
        validated_data['object_id'] = target_id
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class ContentReportStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentReport
        fields = ['status']

class AdminContentReportSerializer(serializers.ModelSerializer):
    target_type = serializers.CharField(source='content_type.model', read_only=True)
    target_id = serializers.IntegerField(source='object_id', read_only=True)
    class Meta:
        model = ContentReport
        fields = ['id', 'reporter', 'target_type', 'target_id', 'reason', 'status', 'created_at']
        read_only_fields = fields

