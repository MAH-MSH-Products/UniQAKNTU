from datetime import datetime, date
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.renderers import BaseRenderer, JSONRenderer
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils.translation import gettext as _

from curriculum.models import SourceMaterialChapter
from django.core.cache import cache
from planner.services.performed_plan_service import PerformedPlanAggregationService
from planner.services.conclusion_plan_service import ConclusionPlanService
from planner.services.dashboard_service import DashboardSummaryService
from planner.services.time_lock_service import TimeLockService, WeeklyHoursService
from planner.services.report_service import ReportFormattingService
from planner.services.pdf_export_service import PdfExportService
from planner.services.analytics_service import (
    AnalyticsCacheService,
    ActivityAggregator,
    CourseAverageAggregator,
    TimeAllocationAggregator,
    StackedActivityAggregator,
)
from planner.serializers import (
    WeeklyPerformanceSerializer,
    ConclusionPlanResponseSerializer,
    TestRecordSerializer,
    TestRecordCreateUpdateSerializer,
    ChapterMasterySerializer,
    ChapterMasteryCreateUpdateSerializer,
    SourceMaterialChapterSerializer,
    DashboardSummarySerializer,
    DailyNoteSerializer,
    DailyNoteCreateSerializer,
    ConsultationBookingSerializer,
    WeeklyHoursOverviewSerializer,
    DailyStudyLogDetailSerializer,
    DailyStudyLogUpsertSerializer,
    ReportBaseResponseSerializer,
    TotalActivityAnalyticsSerializer,
    CourseAveragesAnalyticsSerializer,
    TimeAllocationAnalyticsSerializer,
    StackedCourseActivityAnalyticsSerializer,
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


# ============================================
# Sub-module 3: Dashboard & Student Tools
# ============================================

class DashboardSummaryView(APIView):
    """
    Sub-module 3: Retrieves aggregated data for the dashboard's top row
    (Motivational quote, countdown to exam, and high-level student records).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Dashboard Summary",
        description="Retrieves motivational quote, countdown to exam, student aggregated records, and today's tasks status.",
        responses={200: DashboardSummarySerializer},
    )
    def get(self, request):
        summary_data = DashboardSummaryService.get_dashboard_summary(student=request.user)
        serializer = DashboardSummarySerializer(summary_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyNoteView(APIView):
    """
    Sub-module 3: Retrieves or upserts today's personal note for the student.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Today's Daily Note",
        description="Retrieves the personal note of the authenticated student for today's date.",
        responses={200: DailyNoteSerializer},
    )
    def get(self, request):
        note = DashboardSummaryService.get_daily_note(student=request.user)
        if note:
            serializer = DailyNoteSerializer(note)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {
                "id": None,
                "date": str(date.today()),
                "text": "",
            },
            status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Upsert Today's Daily Note",
        description="Creates or updates today's daily note for the student.",
        request=DailyNoteCreateSerializer,
        responses={200: DailyNoteSerializer, 201: DailyNoteSerializer},
    )
    def post(self, request):
        serializer = DailyNoteCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        note = DashboardSummaryService.upsert_daily_note(
            student=request.user,
            text=serializer.validated_data.get('text', '')
        )
        response_serializer = DailyNoteSerializer(note)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class ConsultationBookingView(APIView):
    """
    Sub-module 3: Book weekly consultation slots and retrieve existing bookings.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List Consultation Bookings",
        description="Returns all consultation bookings for the authenticated student.",
        responses={200: ConsultationBookingSerializer(many=True)},
    )
    def get(self, request):
        bookings = DashboardSummaryService.get_consultations(student=request.user)
        serializer = ConsultationBookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Book Consultation Slot",
        description="Books a weekly consultation slot (day_of_week: 1 to 7, time_slot: HH:MM:SS).",
        request=ConsultationBookingSerializer,
        responses={201: ConsultationBookingSerializer},
    )
    def post(self, request):
        serializer = ConsultationBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking = DashboardSummaryService.book_consultation(
            student=request.user,
            day_of_week=serializer.validated_data['day_of_week'],
            time_slot=serializer.validated_data['time_slot']
        )
        return Response(
            {
                "message": _("Consultation booked successfully."),
                "booking": ConsultationBookingSerializer(booking).data,
            },
            status=status.HTTP_201_CREATED
        )


# ============================================
# Sub-module 5: Weekly Study Hours
# ============================================

class WeeklyHoursOverviewView(APIView):
    """
    Sub-module 5: Weekly Study Hours Overview.
    Retrieves the 7-day overview of the active week including status and lock flags.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Weekly Hours Overview",
        description="Retrieves the 7-day overview for the active tracking week.",
        parameters=[
            OpenApiParameter(
                name="date",
                description="Optional reference date (YYYY-MM-DD) within the week.",
                required=False,
                type=str,
            ),
        ],
        responses={200: WeeklyHoursOverviewSerializer},
    )
    def get(self, request):
        date_str = request.query_params.get('date')
        target_date = None
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': _('Invalid date format. Expected YYYY-MM-DD.')},
                    status=status.HTTP_400_BAD_REQUEST
                )

        overview_data = WeeklyHoursService.get_weekly_overview(
            student=request.user,
            target_date=target_date
        )
        serializer = WeeklyHoursOverviewSerializer(overview_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyStudyLogDetailView(APIView):
    """
    Sub-module 5: Daily Study Log Details and Bulk Upsert.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _parse_date(self, date_str):
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return None

    @extend_schema(
        summary="Get Daily Study Log",
        description="Retrieves detailed study activities and sleep duration for a specific date.",
        responses={200: DailyStudyLogDetailSerializer},
    )
    def get(self, request, date_str):
        target_date = self._parse_date(date_str)
        if not target_date:
            return Response(
                {'error': _('Invalid date format. Expected YYYY-MM-DD.')},
                status=status.HTTP_400_BAD_REQUEST
            )

        log_data = WeeklyHoursService.get_daily_log_detail(
            student=request.user,
            target_date=target_date
        )
        serializer = DailyStudyLogDetailSerializer(log_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Upsert Daily Study Log and Activities",
        description="Atomically updates or creates a daily study log and its activities. Enforces temporal locking.",
        request=DailyStudyLogUpsertSerializer,
        responses={
            200: dict,
            400: dict,
            403: dict,
        },
    )
    def put(self, request, date_str):
        target_date = self._parse_date(date_str)
        if not target_date:
            return Response(
                {'error': _('Invalid date format. Expected YYYY-MM-DD.')},
                status=status.HTTP_400_BAD_REQUEST
            )

        if TimeLockService.is_date_locked(target_date):
            return Response(
                {'error': _('Cannot edit logs older than the previous week.')},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DailyStudyLogUpsertSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        WeeklyHoursService.upsert_daily_log(
            student=request.user,
            target_date=target_date,
            data=serializer.validated_data
        )
        return Response(
            {'message': _('Daily log updated successfully.')},
            status=status.HTTP_200_OK
        )


# ============================================
# Sub-module 6: Student Reports
# ============================================

class PdfRenderer(BaseRenderer):
    """
    Binary PDF renderer for DRF content negotiation (?format=pdf or Accept: application/pdf).
    """
    media_type = 'application/pdf'
    format = 'pdf'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class BaseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [JSONRenderer, PdfRenderer]

    def _render_report(self, request, report_type, fetch_func, filename_prefix):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        report_data = fetch_func(
            student=request.user,
            start_date=start_date,
            end_date=end_date,
        )

        is_pdf = (
            request.query_params.get('format') == 'pdf' or
            'application/pdf' in request.headers.get('Accept', '') or
            getattr(getattr(request, 'accepted_renderer', None), 'format', None) == 'pdf'
        )

        if is_pdf:
            pdf_bytes = PdfExportService.generate_pdf(report_type, report_data, student=request.user)
            filename = f"{filename_prefix}_{report_data['week_start']}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        serializer = ReportBaseResponseSerializer(report_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WeeklyReportView(BaseReportView):
    """
    Sub-module 6: Weekly Study Plan Report.
    """
    @extend_schema(
        summary="Get Weekly Plan Report",
        description="Generates the scheduled weekly study plan report (JSON or PDF via ?format=pdf).",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="format", description="Response format (json or pdf)", required=False, type=str),
        ],
        responses={200: ReportBaseResponseSerializer},
    )
    def get(self, request):
        return self._render_report(
            request,
            report_type='weekly',
            fetch_func=ReportFormattingService.get_weekly_report,
            filename_prefix='weekly_report'
        )


class PerformedReportView(BaseReportView):
    """
    Sub-module 6: Actually Performed Weekly Report.
    """
    @extend_schema(
        summary="Get Performed Weekly Report",
        description="Generates the actually performed weekly study report (JSON or PDF via ?format=pdf).",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="format", description="Response format (json or pdf)", required=False, type=str),
        ],
        responses={200: ReportBaseResponseSerializer},
    )
    def get(self, request):
        return self._render_report(
            request,
            report_type='performed',
            fetch_func=ReportFormattingService.get_performed_report,
            filename_prefix='performed_report'
        )


class ConclusionReportView(BaseReportView):
    """
    Sub-module 6: Conclusion and Mastery Report.
    """
    @extend_schema(
        summary="Get Conclusion Report",
        description="Generates the topic mastery and test summary report (JSON or PDF via ?format=pdf).",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="format", description="Response format (json or pdf)", required=False, type=str),
        ],
        responses={200: ReportBaseResponseSerializer},
    )
    def get(self, request):
        return self._render_report(
            request,
            report_type='conclusion',
            fetch_func=ReportFormattingService.get_conclusion_report,
            filename_prefix='conclusion_report'
        )


class FullReportView(BaseReportView):
    """
    Sub-module 6: Comprehensive Full Student Report.
    """
    @extend_schema(
        summary="Get Comprehensive Full Report",
        description="Generates a full report combining weekly, performed, and conclusion data (JSON or PDF via ?format=pdf).",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="format", description="Response format (json or pdf)", required=False, type=str),
        ],
        responses={200: ReportBaseResponseSerializer},
    )
    def get(self, request):
        return self._render_report(
            request,
            report_type='full',
            fetch_func=ReportFormattingService.get_full_report,
            filename_prefix='full_report'
        )


# ============================================
# Sub-module 7: Student Analytics
# ============================================

class TotalActivityAnalyticsView(APIView):
    """
    Sub-module 7: Time-series analytics for overall study time (reading, review, test, class).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Total Study Activity Analytics",
        description="Returns time-series data for overall study time, broken down by reading, reviewing, and testing.",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(
                name="interval",
                description="Interval enum (daily, weekly, monthly, 3-month, 6-month, 1-year, all)",
                required=False,
                type=str,
            ),
        ],
        responses={200: TotalActivityAnalyticsSerializer},
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        interval = request.query_params.get('interval', 'weekly')

        cache_key = AnalyticsCacheService.make_cache_key(
            student_id=request.user.id,
            endpoint_name='total_activity',
            params_str=f"{start_date}:{end_date}:{interval}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        data = ActivityAggregator.aggregate(
            student=request.user,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
        )
        cache.set(cache_key, data, timeout=AnalyticsCacheService.CACHE_TIMEOUT)
        return Response(data, status=status.HTTP_200_OK)


class CourseAveragesAnalyticsView(APIView):
    """
    Sub-module 7: Average metrics per course/subject (percent score, time per test, time per page).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Course Averages Analytics",
        description="Returns average metrics per chapter/course (percent score, time per test, time per read/review page).",
        parameters=[
            OpenApiParameter(
                name="metric_type",
                description="Metric enum (percent, time_per_test, time_per_read_page, time_per_review_page)",
                required=False,
                type=str,
            ),
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="interval", description="Interval enum", required=False, type=str),
        ],
        responses={200: CourseAveragesAnalyticsSerializer},
    )
    def get(self, request):
        metric_type = request.query_params.get('metric_type', 'percent')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        interval = request.query_params.get('interval', 'all')

        cache_key = AnalyticsCacheService.make_cache_key(
            student_id=request.user.id,
            endpoint_name='course_averages',
            params_str=f"{metric_type}:{start_date}:{end_date}:{interval}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        data = CourseAverageAggregator.aggregate(
            student=request.user,
            metric_type=metric_type,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
        )
        cache.set(cache_key, data, timeout=AnalyticsCacheService.CACHE_TIMEOUT)
        return Response(data, status=status.HTTP_200_OK)


class TimeAllocationAnalyticsView(APIView):
    """
    Sub-module 7: Aggregated study time and test counts grouped by broader course types/sections.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Time Allocation Analytics",
        description="Returns aggregated study time and test counts grouped by course categories with matching bar chart and table data.",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="interval", description="Interval enum", required=False, type=str),
        ],
        responses={200: TimeAllocationAnalyticsSerializer},
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        interval = request.query_params.get('interval', 'all')

        cache_key = AnalyticsCacheService.make_cache_key(
            student_id=request.user.id,
            endpoint_name='time_allocation',
            params_str=f"{start_date}:{end_date}:{interval}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        data = TimeAllocationAggregator.aggregate(
            student=request.user,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
        )
        cache.set(cache_key, data, timeout=AnalyticsCacheService.CACHE_TIMEOUT)
        return Response(data, status=status.HTTP_200_OK)


class StackedCourseActivityAnalyticsView(APIView):
    """
    Sub-module 7: Time allocations per course, stacked by activity type (Read, Review, Test, Class).
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Stacked Course Activity Analytics",
        description="Returns time allocations per subject/course stacked by activity type (Read, Review, Test, Class).",
        parameters=[
            OpenApiParameter(name="start_date", description="Start date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="end_date", description="End date (YYYY-MM-DD)", required=False, type=str),
            OpenApiParameter(name="interval", description="Interval enum", required=False, type=str),
        ],
        responses={200: StackedCourseActivityAnalyticsSerializer},
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        interval = request.query_params.get('interval', 'all')

        cache_key = AnalyticsCacheService.make_cache_key(
            student_id=request.user.id,
            endpoint_name='stacked_course_activity',
            params_str=f"{start_date}:{end_date}:{interval}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        data = StackedActivityAggregator.aggregate(
            student=request.user,
            start_date=start_date,
            end_date=end_date,
            interval=interval,
        )
        cache.set(cache_key, data, timeout=AnalyticsCacheService.CACHE_TIMEOUT)
        return Response(data, status=status.HTTP_200_OK)

