from rest_framework import viewsets
from .models import TagCategory, Tag
from .serializers import TagCategorySerializer, TagSerializer
from drf_spectacular.utils import extend_schema_view, extend_schema
from qna.permissions import IsModeratorOrAdminOrReadOnly

@extend_schema_view(
    list=extend_schema(summary="List all tag categories"),
    retrieve=extend_schema(summary="Get details of a specific tag category"),
    create=extend_schema(summary="[Admins/Moderators Only] Create a new tag category"),
    update=extend_schema(summary="[Admins/Moderators Only] Update a tag category"),
    partial_update=extend_schema(summary="[Admins/Moderators Only] Partially update a tag category"),
    destroy=extend_schema(summary="[Admins/Moderators Only] Delete a tag category")
)
class TagCategoryViewSet(viewsets.ModelViewSet):
    queryset = TagCategory.objects.all()
    serializer_class = TagCategorySerializer
    permission_classes = [IsModeratorOrAdminOrReadOnly]

@extend_schema_view(
    list=extend_schema(summary="List all tags"),
    retrieve=extend_schema(summary="Get details of a specific tag"),
    create=extend_schema(summary="[Admins/Moderators Only] Create a new tag"),
    update=extend_schema(summary="[Admins/Moderators Only] Update a tag"),
    partial_update=extend_schema(summary="[Admins/Moderators Only] Partially update a tag"),
    destroy=extend_schema(summary="[Admins/Moderators Only] Delete a tag")
)
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsModeratorOrAdminOrReadOnly]
