from django.urls import path
from planner.views import (
    WeeklyPerformanceView,
    ConclusionPlanView,
    ConclusionPlanChaptersView,
    TestRecordCreateView,
    TestRecordDetailView,
    ChapterMasteryView,
    ChapterMasteryDetailView,
    ChapterListCreateView,
    ChapterDetailView,
    DashboardSummaryView,
    DailyNoteView,
    ConsultationBookingView,
    ConsultationBookingDetailView,
    AdminConsultationListView,
    AdminConsultationUpdateView,
    WeeklyHoursOverviewView,
    DailyStudyLogDetailView,
    WeeklyReportView,
    PerformedReportView,
    ConclusionReportView,
    FullReportView,
    TotalActivityAnalyticsView,
    CourseAveragesAnalyticsView,
    TimeAllocationAnalyticsView,
    StackedCourseActivityAnalyticsView,
)

app_name = 'planner'

urlpatterns = [
    # Sub-module 1: Performed Weekly Plan
    path('weekly-performance/', WeeklyPerformanceView.as_view(), name='weekly-performance'),

    # Sub-module 2: Conclusion Plan & Test Analytics
    path('chapters/', ChapterListCreateView.as_view(), name='chapter-list-create'),
    path('chapters/<int:pk>/', ChapterDetailView.as_view(), name='chapter-detail'),
    path('conclusion-plan/', ConclusionPlanView.as_view(), name='conclusion-plan'),
    path('conclusion-plan/chapters/', ConclusionPlanChaptersView.as_view(), name='conclusion-plan-chapters'),
    path('conclusion-plan/test-records/', TestRecordCreateView.as_view(), name='conclusion-plan-test-records'),
    path('conclusion-plan/test-records/<int:pk>/', TestRecordDetailView.as_view(), name='conclusion-plan-test-record-detail'),
    path('conclusion-plan/mastery/', ChapterMasteryView.as_view(), name='conclusion-plan-mastery'),
    path('conclusion-plan/mastery/<int:chapter_id>/', ChapterMasteryDetailView.as_view(), name='conclusion-plan-mastery-detail'),

    # Sub-module 3: Dashboard & Student Tools
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/notes/', DailyNoteView.as_view(), name='dashboard-notes'),
    path('dashboard/consultations/', ConsultationBookingView.as_view(), name='dashboard-consultations'),
    path('dashboard/consultations/<uuid:pk>/', ConsultationBookingDetailView.as_view(), name='dashboard-consultation-detail'),
    path('admin/consultations/', AdminConsultationListView.as_view(), name='admin-consultation-list'),
    path('admin/consultations/<uuid:pk>/', AdminConsultationUpdateView.as_view(), name='admin-consultation-update'),


    # Sub-module 5: Weekly Study Hours
    path('weekly-hours/current/', WeeklyHoursOverviewView.as_view(), name='weekly-hours-current'),
    path('weekly-hours/daily-logs/<str:date_str>/', DailyStudyLogDetailView.as_view(), name='weekly-hours-daily-log-detail'),

    # Sub-module 6: Student Reports
    path('reports/weekly/', WeeklyReportView.as_view(), name='report-weekly'),
    path('reports/performed/', PerformedReportView.as_view(), name='report-performed'),
    path('reports/conclusion/', ConclusionReportView.as_view(), name='report-conclusion'),
    path('reports/full/', FullReportView.as_view(), name='report-full'),

    # Sub-module 7: Student Analytics
    path('analytics/total-activity/', TotalActivityAnalyticsView.as_view(), name='analytics-total-activity'),
    path('analytics/course-averages/', CourseAveragesAnalyticsView.as_view(), name='analytics-course-averages'),
    path('analytics/time-allocation/', TimeAllocationAnalyticsView.as_view(), name='analytics-time-allocation'),
    path('analytics/stacked-course-activity/', StackedCourseActivityAnalyticsView.as_view(), name='analytics-stacked-course-activity'),
]
