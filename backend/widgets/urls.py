from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WidgetViewSet

router = DefaultRouter()
router.register(r'', WidgetViewSet, basename='widget')

urlpatterns = [
    path('', include(router.urls)),
]

