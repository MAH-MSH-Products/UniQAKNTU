from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from rest_framework.exceptions import PermissionDenied
from .models import SourceMaterial, Question, Answer, FileAttachment, SuggestedEdit, PostStatus
from .serializers import (
    SourceMaterialSerializer, 
    QuestionSerializer, 
    AnswerSerializer, 
    FileAttachmentSerializer, 
    SuggestedEditSerializer
)
from .permissions import IsAuthorOrModerator, IsModeratorOrAdmin

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, inline_serializer
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers

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
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.filter(status='APPROVED')
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_moderator() or user.is_admin()):
            return Question.objects.all()
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
        summary="[Students/Authors] Suggest an edit to an existing question",
        request=inline_serializer(
            name="QuestionSuggestEditRequest",
            fields={
                "proposed_text": serializers.CharField(required=True),
                "removed_attachment_ids": serializers.ListField(child=serializers.IntegerField(), required=False)
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
            
        removed_attachment_ids = request.data.get('removed_attachment_ids', [])
        
        ctype = ContentType.objects.get_for_model(instance)
        
        suggested_edit = SuggestedEdit.objects.create(
            author=request.user,
            content_type=ctype,
            object_id=instance.id,
            proposed_text=proposed_text,
            removed_attachment_ids=removed_attachment_ids
        )
        
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
class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.filter(status='APPROVED')
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_moderator() or user.is_admin()):
            return Answer.objects.all()
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
        summary="[Students/Authors] Suggest an edit to an existing answer",
        request=inline_serializer(
            name="AnswerSuggestEditRequest",
            fields={
                "proposed_text": serializers.CharField(required=True),
                "removed_attachment_ids": serializers.ListField(child=serializers.IntegerField(), required=False)
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
            
        removed_attachment_ids = request.data.get('removed_attachment_ids', [])
        
        ctype = ContentType.objects.get_for_model(instance)
        
        suggested_edit = SuggestedEdit.objects.create(
            author=request.user,
            content_type=ctype,
            object_id=instance.id,
            proposed_text=proposed_text,
            removed_attachment_ids=removed_attachment_ids
        )
        
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
