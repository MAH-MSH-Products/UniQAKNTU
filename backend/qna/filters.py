import django_filters
from .models import Question, Answer

class PostFilterSet(django_filters.FilterSet):
    status = django_filters.CharFilter(lookup_expr='iexact')
    author = django_filters.UUIDFilter(field_name='author__id', lookup_expr='exact')
    author__username = django_filters.CharFilter(field_name='author__username', lookup_expr='iexact')
    created_at__gte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at__lte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    is_official = django_filters.BooleanFilter(field_name='is_official')

class QuestionFilter(PostFilterSet):
    tags = django_filters.AllValuesMultipleFilter(field_name='tags__value')
    source_material = django_filters.NumberFilter(field_name='source_material__id')

    class Meta:
        model = Question
        fields = ['status', 'author', 'author__username', 'created_at__gte', 'created_at__lte', 'tags', 'source_material', 'is_official']

class AnswerFilter(PostFilterSet):
    question = django_filters.NumberFilter(field_name='question__id')

    class Meta:
        model = Answer
        fields = ['status', 'author', 'author__username', 'created_at__gte', 'created_at__lte', 'question', 'is_official']

