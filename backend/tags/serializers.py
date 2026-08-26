from rest_framework import serializers
from .models import TagCategory, Tag

class TagCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TagCategory
        fields = ['id', 'name']

class TagSerializer(serializers.ModelSerializer):
    category = TagCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=TagCategory.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Tag
        fields = ['id', 'category', 'category_id', 'value']
