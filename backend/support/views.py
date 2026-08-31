from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdminUser
from .models import Ticket, ContentReport, TicketStatus
from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketMessageSerializer,
    TicketStatusUpdateSerializer, ContentReportSerializer, AdminContentReportSerializer, ContentReportStatusUpdateSerializer
)
from django_filters.rest_framework import DjangoFilterBackend

class TicketViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(author=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        if self.action == 'reply':
            return TicketMessageSerializer
        return TicketDetailSerializer

    @action(detail=True, methods=['post'], serializer_class=TicketMessageSerializer)
    def reply(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == TicketStatus.CLOSED:
            return Response({'detail': 'Cannot reply to a closed ticket.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ticket=ticket, sender=request.user)

        if request.user.is_admin() or request.user.is_moderator():
            if ticket.status == TicketStatus.OPEN:
                ticket.status = TicketStatus.IN_PROGRESS
                ticket.save()
        else:
            if ticket.status != TicketStatus.OPEN:
                ticket.status = TicketStatus.OPEN
                ticket.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AdminTicketViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    queryset = Ticket.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'status': ['exact'],
        'author': ['exact'],
        'created_at': ['date', 'gte', 'lte']
    }

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        if self.action == 'reply':
            return TicketMessageSerializer
        if self.action == 'status':
            return TicketStatusUpdateSerializer
        return TicketDetailSerializer

    @action(detail=True, methods=['patch'], serializer_class=TicketStatusUpdateSerializer)
    def status(self, request, pk=None):
        ticket = self.get_object()
        serializer = self.get_serializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], serializer_class=TicketMessageSerializer)
    def reply(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == TicketStatus.CLOSED:
            return Response({'detail': 'Cannot reply to a closed ticket.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ticket=ticket, sender=request.user)

        if request.user.is_admin() or request.user.is_moderator():
            if ticket.status == TicketStatus.OPEN:
                ticket.status = TicketStatus.IN_PROGRESS
                ticket.save()
        else:
            if ticket.status != TicketStatus.OPEN:
                ticket.status = TicketStatus.OPEN
                ticket.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ContentReportViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ContentReportSerializer
    queryset = ContentReport.objects.all()


class AdminContentReportViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    queryset = ContentReport.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'status': ['exact'], 'reporter': ['exact']}

    def get_serializer_class(self):
        if self.action == 'status':
            return ContentReportStatusUpdateSerializer
        return AdminContentReportSerializer

    @action(detail=True, methods=['patch'], serializer_class=ContentReportStatusUpdateSerializer)
    def status(self, request, pk=None):
        report = self.get_object()
        serializer = self.get_serializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

