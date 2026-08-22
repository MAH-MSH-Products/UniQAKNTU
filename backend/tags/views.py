from rest_framework import viewsets, permissions
from .models import TagCategory, Tag
from .serializers import TagCategorySerializer, TagSerializer

class TagCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TagCategory.objects.all()
    serializer_class = TagCategorySerializer
    permission_classes = [permissions.AllowAny]

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
