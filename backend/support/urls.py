from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, AdminTicketViewSet, ContentReportViewSet, AdminContentReportViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'admin/tickets', AdminTicketViewSet, basename='admin-ticket')
router.register(r'reports', ContentReportViewSet, basename='report')
router.register(r'admin/reports', AdminContentReportViewSet, basename='admin-report')

urlpatterns = [
    path('', include(router.urls)),
]

