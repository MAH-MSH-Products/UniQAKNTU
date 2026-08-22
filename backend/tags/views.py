from rest_framework import viewsets, permissions
from .models import TagCategory, Tag
from .serializers import TagCategorySerializer, TagSerializer
from drf_spectacular.utils import extend_schema_view, extend_schema

@extend_schema_view(
    list=extend_schema(summary="List all tag categories"),
    retrieve=extend_schema(summary="Get details of a specific tag category")
)
class TagCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TagCategory.objects.all()
    serializer_class = TagCategorySerializer
    permission_classes = [permissions.AllowAny]

@extend_schema_view(
    list=extend_schema(summary="List all tags"),
    retrieve=extend_schema(summary="Get details of a specific tag")
)
class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
