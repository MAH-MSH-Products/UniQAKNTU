from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils.translation import gettext as _

from planner.services.performed_plan_service import PerformedPlanAggregationService
from planner.serializers import WeeklyPerformanceSerializer


class WeeklyPerformanceView(APIView):
    """
    Sub-module 1: Performed Weekly Plan (برنامه هفتگی انجام شده).
    Strictly a read-only reporting endpoint aggregating executed study time and tests.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Aggregated Weekly Performance",
        description="Retrieves aggregated study times and test counts for the authenticated student. Defaults to current week.",
        parameters=[
            OpenApiParameter(
                name="week_start",
                description="Start date of the week (YYYY-MM-DD). Defaults to the current week Saturday.",
                required=False,
                type=str,
            ),
        ],
        responses={200: WeeklyPerformanceSerializer},
    )
    def get(self, request):
        week_start_param = request.query_params.get('week_start')

        if week_start_param:
            try:
                datetime.strptime(week_start_param, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {'error': _('Invalid week_start format. Please use YYYY-MM-DD.')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        aggregated_data = PerformedPlanAggregationService.aggregate_weekly_performance(
            student=request.user,
            week_start=week_start_param
        )
        serializer = WeeklyPerformanceSerializer(aggregated_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
