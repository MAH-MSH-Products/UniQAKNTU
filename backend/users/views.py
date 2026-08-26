from rest_framework import viewsets, mixins, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import User
from .serializers import UserSerializer, ChangeRoleSerializer
from .permissions import IsAdminOrModerator, IsAdminUser

@extend_schema_view(
    list=extend_schema(summary='[Admins/Moderators Only] List all users'),
    retrieve=extend_schema(summary='[Admins/Moderators Only] Get details of a specific user')
)
class UserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrModerator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role']
    search_fields = ['username', 'email']

    @extend_schema(
        summary='[Admins Only] Change user role',
        request=ChangeRoleSerializer,
        responses={200: UserSerializer}
    )
    @action(detail=True, methods=['patch'], url_path='role', permission_classes=[IsAdminUser])
    def change_role(self, request, pk=None):
        user = self.get_object()
        serializer = ChangeRoleSerializer(data=request.data)
        if serializer.is_valid():
            user.role = serializer.validated_data['role']
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

