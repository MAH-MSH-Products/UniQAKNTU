from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from rest_framework.exceptions import PermissionDenied
from .models import SourceMaterial, Question, Answer, FileAttachment, SuggestedEdit, PostStatus, Comment, Vote
from .serializers import (
    SourceMaterialSerializer, 
    QuestionSerializer, 
    AnswerSerializer, 
    FileAttachmentSerializer, 
    SuggestedEditSerializer,
    CommentSerializer
)
from .permissions import IsAuthorOrModerator, IsModeratorOrAdmin
from .filters import QuestionFilter, AnswerFilter

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, inline_serializer
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers

class PostActionMixin:
    @extend_schema(
        summary="Get or create comments for this post",
        methods=['GET', 'POST'],
        request=inline_serializer("CommentCreate", fields={"body": serializers.CharField()}),
        responses={200: CommentSerializer(many=True), 201: CommentSerializer}
    )
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        instance = self.get_object()
        ctype = ContentType.objects.get_for_model(instance)
        
        if request.method == 'GET':
            comments = Comment.objects.filter(content_type=ctype, object_id=instance.id).order_by('created_at')
            return Response(CommentSerializer(comments, many=True).data)
            
        elif request.method == 'POST':
            body = request.data.get('body')
            if not body:
                return Response({"error": "body is required"}, status=status.HTTP_400_BAD_REQUEST)
            comment = Comment.objects.create(author=request.user, body=body, content_type=ctype, object_id=instance.id)
            return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Vote on this post",
        methods=['POST'],
        request=inline_serializer("VoteRequest", fields={"value": serializers.ChoiceField(choices=[1, -1])}),
        responses={200: inline_serializer("VoteResponse", fields={"message": serializers.CharField(), "new_score": serializers.IntegerField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        instance = self.get_object()
        value = request.data.get('value')
        if value not in [1, -1, '1', '-1']:
            return Response({"error": "value must be 1 or -1"}, status=status.HTTP_400_BAD_REQUEST)
            
        value = int(value)
        ctype = ContentType.objects.get_for_model(instance)
        
        vote_obj, created = Vote.objects.get_or_create(
            user=request.user, content_type=ctype, object_id=instance.id,
            defaults={'value': value}
        )
        
        if not created and vote_obj.value != value:
            # Changed their vote (e.g. 1 to -1, difference is -2)
            instance.score += (value - vote_obj.value)
            vote_obj.value = value
            vote_obj.save()
            instance.save()
        elif created:
            instance.score += value
            instance.save()
            
        return Response({"message": "Vote recorded.", "new_score": instance.score})

@extend_schema_view(
    list=extend_schema(summary="List all source materials (e.g. exams)"),
    retrieve=extend_schema(summary="Get details of a specific source material"),
    create=extend_schema(summary="Create a new source material"),
    update=extend_schema(summary="Update a source material"),
    partial_update=extend_schema(summary="Partially update a source material"),
    destroy=extend_schema(summary="Delete a source material")
)
class SourceMaterialViewSet(viewsets.ModelViewSet):
    queryset = SourceMaterial.objects.all()
    serializer_class = SourceMaterialSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]

@extend_schema_view(
    list=extend_schema(summary="List all approved questions"),
    retrieve=extend_schema(summary="Get details of a specific question"),
    create=extend_schema(summary="Create a new question (Defaults to PENDING status)"),
    update=extend_schema(summary="[Admins/Moderators Only] Instantly update a question"),
    partial_update=extend_schema(summary="[Admins/Moderators Only] Instantly partially update a question"),
    destroy=extend_schema(summary="[Admins/Moderators Only] Hard delete a question")
)
class QuestionViewSet(PostActionMixin, viewsets.ModelViewSet):
    queryset = Question.objects.filter(status='APPROVED')
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]
    
    from django_filters.rest_framework import DjangoFilterBackend
    from rest_framework.filters import SearchFilter
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = QuestionFilter
    search_fields = ['title', 'body']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_moderator() or user.is_admin():
                return Question.objects.all()
            
            # Students see all approved posts, PLUS their own pending/rejected posts
            from django.db.models import Q
            return Question.objects.filter(Q(status='APPROVED') | Q(author=user))
            
        return super().get_queryset()

    def update(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_moderator() or user.is_admin()):
            raise PermissionDenied("Students cannot edit directly. Use the suggest-edit endpoint.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_moderator() or user.is_admin()):
            raise PermissionDenied("Only admins and moderators can delete posts.")
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="[Admins/Moderators Only] Approve a pending question",
        request=None,
        responses={200: inline_serializer(name="ApproveQuestionResponse", fields={"message": serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsModeratorOrAdmin])
    def approve(self, request, pk=None):
        question = self.get_object()
        question.status = PostStatus.APPROVED
        question.save()
        return Response({"message": "Question approved."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Admins/Moderators Only] Reject a pending question",
        request=None,
        responses={200: inline_serializer(name="RejectQuestionResponse", fields={"message": serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsModeratorOrAdmin])
    def reject(self, request, pk=None):
        question = self.get_object()
        question.status = PostStatus.REJECTED
        question.save()
        return Response({"message": "Question rejected."}, status=status.HTTP_200_OK)
    @extend_schema(
        summary="[Students/Authors] Suggest an edit to an existing question",
        request=inline_serializer(
            name="QuestionSuggestEditRequest",
            fields={
                "proposed_text": serializers.CharField(required=True),
                "attachment_ids": serializers.ListField(child=serializers.IntegerField(), required=False)
            }
        ),
        responses={
            201: inline_serializer(
                name="QuestionSuggestEditResponse",
                fields={
                    "message": serializers.CharField(),
                    "suggested_edit_id": serializers.IntegerField()
                }
            )
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def suggest_edit(self, request, pk=None):
        instance = self.get_object()
            
        proposed_text = request.data.get('proposed_text')
        if not proposed_text:
            return Response({"error": "proposed_text is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        attachment_ids = request.data.get('attachment_ids', [])
        
        # Declarative syncing: compute which existing attachments are missing from attachment_ids
        existing_ids = list(instance.attachments.values_list('id', flat=True))
        removed_attachment_ids = [aid for aid in existing_ids if aid not in attachment_ids]
        
        ctype = ContentType.objects.get_for_model(instance)
        
        suggested_edit = SuggestedEdit.objects.create(
            author=request.user,
            content_type=ctype,
            object_id=instance.id,
            proposed_text=proposed_text,
            removed_attachment_ids=removed_attachment_ids
        )
        
        attachment_ids = request.data.get('attachment_ids', [])
        if attachment_ids:
            se_ctype = ContentType.objects.get_for_model(SuggestedEdit)
            FileAttachment.objects.filter(
                id__in=attachment_ids,
                object_id__isnull=True,
                uploader=request.user
            ).update(content_type=se_ctype, object_id=suggested_edit.id)
        
        return Response(
            {"message": "Edit submitted for admin approval.", "suggested_edit_id": suggested_edit.id},
            status=status.HTTP_201_CREATED
        )

@extend_schema_view(
    list=extend_schema(summary="List all approved answers"),
    retrieve=extend_schema(summary="Get details of a specific answer"),
    create=extend_schema(summary="Submit a new answer (Defaults to PENDING status)"),
    update=extend_schema(summary="[Admins/Moderators Only] Instantly update an answer"),
    partial_update=extend_schema(summary="[Admins/Moderators Only] Instantly partially update an answer"),
    destroy=extend_schema(summary="[Admins/Moderators Only] Hard delete an answer")
)
class AnswerViewSet(PostActionMixin, viewsets.ModelViewSet):
    queryset = Answer.objects.filter(status='APPROVED')
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]
    
    from django_filters.rest_framework import DjangoFilterBackend
    filter_backends = [DjangoFilterBackend]
    filterset_class = AnswerFilter

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_moderator() or user.is_admin():
                return Answer.objects.all()
            
            from django.db.models import Q
            return Answer.objects.filter(Q(status='APPROVED') | Q(author=user))
            
        return super().get_queryset()

    def update(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_moderator() or user.is_admin()):
            raise PermissionDenied("Students cannot edit directly. Use the suggest-edit endpoint.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_moderator() or user.is_admin()):
            raise PermissionDenied("Only admins and moderators can delete posts.")
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="[Admins/Moderators Only] Approve a pending answer",
        request=None,
        responses={200: inline_serializer(name="ApproveAnswerResponse", fields={"message": serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsModeratorOrAdmin])
    def approve(self, request, pk=None):
        answer = self.get_object()
        answer.status = PostStatus.APPROVED
        answer.save()
        return Response({"message": "Answer approved."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Admins/Moderators Only] Reject a pending answer",
        request=None,
        responses={200: inline_serializer(name="RejectAnswerResponse", fields={"message": serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsModeratorOrAdmin])
    def reject(self, request, pk=None):
        answer = self.get_object()
        answer.status = PostStatus.REJECTED
        answer.save()
        return Response({"message": "Answer rejected."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Question Author Only] Accept this answer",
        request=None,
        responses={200: inline_serializer(name="AcceptAnswerResponse", fields={"message": serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        answer = self.get_object()
        
        # Only the author of the question can accept an answer
        if answer.question.author != request.user:
            return Response({"error": "Only the author of the question can accept an answer."}, status=status.HTTP_403_FORBIDDEN)
            
        # Un-accept all other answers for this question
        answer.question.answers.update(is_accepted=False)
        
        # Accept this one
        answer.is_accepted = True
        answer.save()
        
        return Response({"message": "Answer accepted."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Students/Authors] Suggest an edit to an existing answer",
        request=inline_serializer(
            name="AnswerSuggestEditRequest",
            fields={
                "proposed_text": serializers.CharField(required=True),
                "attachment_ids": serializers.ListField(child=serializers.IntegerField(), required=False)
            }
        ),
        responses={
            201: inline_serializer(
                name="AnswerSuggestEditResponse",
                fields={
                    "message": serializers.CharField(),
                    "suggested_edit_id": serializers.IntegerField()
                }
            )
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def suggest_edit(self, request, pk=None):
        instance = self.get_object()
            
        proposed_text = request.data.get('proposed_text')
        if not proposed_text:
            return Response({"error": "proposed_text is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        attachment_ids = request.data.get('attachment_ids', [])
        
        # Declarative syncing: compute which existing attachments are missing from attachment_ids
        existing_ids = list(instance.attachments.values_list('id', flat=True))
        removed_attachment_ids = [aid for aid in existing_ids if aid not in attachment_ids]
        
        ctype = ContentType.objects.get_for_model(instance)
        
        suggested_edit = SuggestedEdit.objects.create(
            author=request.user,
            content_type=ctype,
            object_id=instance.id,
            proposed_text=proposed_text,
            removed_attachment_ids=removed_attachment_ids
        )
        
        attachment_ids = request.data.get('attachment_ids', [])
        if attachment_ids:
            se_ctype = ContentType.objects.get_for_model(SuggestedEdit)
            FileAttachment.objects.filter(
                id__in=attachment_ids,
                object_id__isnull=True,
                uploader=request.user
            ).update(content_type=se_ctype, object_id=suggested_edit.id)
        
        return Response(
            {"message": "Edit submitted for admin approval.", "suggested_edit_id": suggested_edit.id},
            status=status.HTTP_201_CREATED
        )

@extend_schema_view(
    list=extend_schema(summary="[Admins/Moderators Only] List all pending edit suggestions"),
    retrieve=extend_schema(summary="[Admins/Moderators Only] Get details of a specific edit suggestion")
)
class SuggestedEditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SuggestedEdit.objects.filter(status=PostStatus.PENDING)
    serializer_class = SuggestedEditSerializer
    permission_classes = [permissions.IsAuthenticated, IsModeratorOrAdmin]

    @extend_schema(
        summary="[Admins/Moderators Only] Approve a suggested edit and apply its text to the live post",
        request=None,
        responses={
            200: inline_serializer(
                name="ApproveEditResponse",
                fields={
                    "message": serializers.CharField()
                }
            )
        }
    )
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        suggested_edit = self.get_object()
        target_obj = suggested_edit.content_object
        
        # Apply the changes to the original post
        target_obj.body = suggested_edit.proposed_text
        target_obj.save() # This triggers simple_history automatically
        
        # Handle attachments
        if suggested_edit.removed_attachment_ids:
            target_obj.attachments.filter(id__in=suggested_edit.removed_attachment_ids).delete()
            
        # Any new attachments added to the SuggestedEdit should now be moved to the target_obj
        suggested_edit.attachments.update(
            content_type=ContentType.objects.get_for_model(target_obj),
            object_id=target_obj.id
        )

        suggested_edit.status = PostStatus.APPROVED
        suggested_edit.save()
        
        return Response({"message": "Edit approved and applied."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="[Admins/Moderators Only] Reject a suggested edit",
        request=None,
        responses={
            200: inline_serializer(
                name="RejectEditResponse",
                fields={
                    "message": serializers.CharField()
                }
            )
        }
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        suggested_edit = self.get_object()
        suggested_edit.status = PostStatus.REJECTED
        suggested_edit.save()
        return Response({"message": "Edit rejected."}, status=status.HTTP_200_OK)

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import mixins

@extend_schema_view(
    retrieve=extend_schema(summary="Get a specific attachment"),
    create=extend_schema(
        summary="Upload a new attachment (multipart/form-data)",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {"type": "string", "format": "binary", "description": "The binary file to upload"}
                },
                "required": ["file"]
            }
        }
    ),
    destroy=extend_schema(summary="[Authors/Admins Only] Delete an attachment")
)
class FileAttachmentViewSet(mixins.CreateModelMixin,
                            mixins.RetrieveModelMixin,
                            mixins.DestroyModelMixin,
                            viewsets.GenericViewSet):
    """
    Files can only be uploaded (created), retrieved, and deleted.
    They cannot be edited (updated) once uploaded.
    """
    queryset = FileAttachment.objects.all()
    serializer_class = FileAttachmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)
