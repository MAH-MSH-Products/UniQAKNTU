from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils.translation import gettext as _

from curriculum.models import SourceMaterialChapter
from planner.services.performed_plan_service import PerformedPlanAggregationService
from planner.services.conclusion_plan_service import ConclusionPlanService
from planner.serializers import (
    WeeklyPerformanceSerializer,
    ConclusionPlanResponseSerializer,
    TestRecordSerializer,
    TestRecordCreateUpdateSerializer,
    ChapterMasterySerializer,
    ChapterMasteryCreateUpdateSerializer,
    SourceMaterialChapterSerializer,
)


# ============================================
# Sub-module 1: Performed Weekly Plan
# ============================================

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


# ============================================
# Sub-module 2: Conclusion Plan & Test Analytics
# ============================================

class ConclusionPlanView(APIView):
    """
    Sub-module 2: Retrieve aggregated conclusion grid data for the logged-in student,
    including mastery levels and test records grouped by chapter.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Conclusion Plan Grid",
        description="Retrieve the aggregated conclusion grid data for the logged-in student, optionally filtered by source_material_id.",
        parameters=[
            OpenApiParameter(
                name="source_material_id",
                description="Optional filter by source material (course/book) ID.",
                required=False,
                type=int,
            ),
        ],
        responses={200: ConclusionPlanResponseSerializer},
    )
    def get(self, request):
        source_material_id = request.query_params.get('source_material_id')
        if source_material_id:
            try:
                source_material_id = int(source_material_id)
            except ValueError:
                return Response(
                    {'error': _('Invalid source_material_id format.')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        grid_data = ConclusionPlanService.get_conclusion_grid(
            student=request.user,
            source_material_id=source_material_id
        )
        serializer = ConclusionPlanResponseSerializer(grid_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TestRecordCreateView(APIView):
    """
    Sub-module 2: Create or update a test record for a specific chapter, format, and method (Upsert logic).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Create or Update Test Record (Upsert)",
        description="Creates or updates a test record for the authenticated student for a specific chapter, format, and method.",
        request=TestRecordCreateUpdateSerializer,
        responses={
            201: TestRecordSerializer,
            200: TestRecordSerializer,
        },
    )
    def post(self, request):
        serializer = TestRecordCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        chapter = SourceMaterialChapter.objects.get(id=data['chapter_id'])

        record, created = ConclusionPlanService.upsert_test_record(
            student=request.user,
            chapter=chapter,
            test_format=data['test_format'],
            test_method=data['test_method'],
            total_tests=data['total_tests'],
            correct_tests=data['correct_tests'],
            wrong_tests=data['wrong_tests'],
        )
        resp_serializer = TestRecordSerializer(record)
        return Response(
            resp_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class TestRecordDetailView(APIView):
    """
    Sub-module 2: Delete a specific test record owned by the authenticated student.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Delete Test Record",
        description="Deletes a specific test record owned by the student.",
        responses={204: None, 404: None},
    )
    def delete(self, request, pk):
        deleted = ConclusionPlanService.delete_test_record(student=request.user, record_id=pk)
        if not deleted:
            return Response({'error': _('Test record not found.')}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChapterMasteryView(APIView):
    """
    Sub-module 2: Set or update the mastery level for a chapter (Upsert logic).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Set Chapter Mastery (Upsert)",
        description="Set or update mastery level (1-100) for a chapter for the authenticated student.",
        request=ChapterMasteryCreateUpdateSerializer,
        responses={
            201: ChapterMasterySerializer,
            200: ChapterMasterySerializer,
        },
    )
    def post(self, request):
        serializer = ChapterMasteryCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        chapter = SourceMaterialChapter.objects.get(id=data['chapter_id'])

        mastery, created = ConclusionPlanService.upsert_mastery(
            student=request.user,
            chapter=chapter,
            level=data['level']
        )
        resp_serializer = ChapterMasterySerializer(mastery)
        return Response(
            resp_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class ChapterMasteryDetailView(APIView):
    """
    Sub-module 2: Remove the mastery level for a chapter owned by the authenticated student.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Delete Chapter Mastery",
        description="Removes the mastery level for a specific chapter.",
        responses={204: None, 404: None},
    )
    def delete(self, request, chapter_id):
        deleted = ConclusionPlanService.delete_mastery(student=request.user, chapter_id=chapter_id)
        if not deleted:
            return Response({'error': _('Mastery record not found.')}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConclusionPlanChaptersView(APIView):
    """
    Sub-module 2: List chapters for a specific source material to populate dropdowns.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Chapters for Source Material",
        description="Retrieves all chapters belonging to a source material.",
        parameters=[
            OpenApiParameter(
                name="source_material_id",
                description="ID of the source material",
                required=True,
                type=int,
            ),
        ],
        responses={200: SourceMaterialChapterSerializer(many=True)},
    )
    def get(self, request):
        source_material_id = request.query_params.get('source_material_id')
        if not source_material_id:
            return Response(
                {'error': _('source_material_id parameter is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            source_material_id = int(source_material_id)
        except ValueError:
            return Response(
                {'error': _('Invalid source_material_id format.')},
                status=status.HTTP_400_BAD_REQUEST
            )

        chapters = ConclusionPlanService.get_chapters_for_source_material(source_material_id)
        serializer = SourceMaterialChapterSerializer(chapters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
