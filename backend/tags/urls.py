from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagCategoryViewSet, TagViewSet

router = DefaultRouter()
router.register(r'categories', TagCategoryViewSet, basename='tagcategory')
router.register(r'', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]
