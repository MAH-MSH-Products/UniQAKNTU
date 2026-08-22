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

class SourceMaterialViewSet(viewsets.ModelViewSet):
    queryset = SourceMaterial.objects.all()
    serializer_class = SourceMaterialSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrModerator]

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

class SuggestedEditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SuggestedEdit.objects.filter(status=PostStatus.PENDING)
    serializer_class = SuggestedEditSerializer
    permission_classes = [permissions.IsAuthenticated, IsModeratorOrAdmin]

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

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        suggested_edit = self.get_object()
        suggested_edit.status = PostStatus.REJECTED
        suggested_edit.save()
        return Response({"message": "Edit rejected."}, status=status.HTTP_200_OK)
