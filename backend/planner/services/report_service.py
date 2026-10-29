from datetime import datetime, date
from django.utils.translation import gettext_lazy as _
from planner.services.time_lock_service import TimeLockService
from planner.services.analytics_engine import CoreAnalyticsEngine


class ReportFormattingService:
    """
    Sub-module 6: Report Formatting Service.
    Consumer of CoreAnalyticsEngine. Transforms raw analytical aggregates
    into structured JSON report objects for in-app viewing and PDF compilation.
    Contains zero direct database aggregation queries (100% DRY architecture).
    """

    @classmethod
    def _resolve_dates(cls, start_date=None, end_date=None):
        """
        Parses dates or falls back to the current active week boundaries.
        """
        if start_date and isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date and isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        if not start_date or not end_date:
            default_start, default_end = TimeLockService.get_week_boundaries(start_date or date.today())
            start_date = start_date or default_start
            end_date = end_date or default_end

        return start_date, end_date

    @classmethod
    def get_weekly_report(cls, student, start_date=None, end_date=None):
        """
        Generates the scheduled weekly study plan report data.
        """
        s_date, e_date = cls._resolve_dates(start_date, end_date)
        raw_data = CoreAnalyticsEngine.get_scheduled_aggregation(student, s_date, e_date)

        return {
            'report_title': str(_('گزارش برنامه هفتگی روزانه')),
            'report_type': 'weekly',
            'week_start': s_date.isoformat(),
            'week_end': e_date.isoformat(),
            'generated_at': datetime.now().isoformat(),
            'student_name': student.get_full_name() or student.username,
            'data': raw_data,
        }

    @classmethod
    def get_performed_report(cls, student, start_date=None, end_date=None):
        """
        Generates the actually performed weekly study report data.
        """
        s_date, e_date = cls._resolve_dates(start_date, end_date)
        raw_data = CoreAnalyticsEngine.get_performed_aggregation(student, s_date, e_date)

        return {
            'report_title': str(_('گزارش عملکرد هفتگی انجام شده')),
            'report_type': 'performed',
            'week_start': s_date.isoformat(),
            'week_end': e_date.isoformat(),
            'generated_at': datetime.now().isoformat(),
            'student_name': student.get_full_name() or student.username,
            'data': raw_data,
        }

    @classmethod
    def get_conclusion_report(cls, student, start_date=None, end_date=None):
        """
        Generates the topic mastery and test percentage conclusion report data.
        """
        s_date, e_date = cls._resolve_dates(start_date, end_date)
        raw_data = CoreAnalyticsEngine.get_conclusion_aggregation(student, s_date, e_date)

        return {
            'report_title': str(_('گزارش جمع‌بندی و تسلط مبحثی')),
            'report_type': 'conclusion',
            'week_start': s_date.isoformat(),
            'week_end': e_date.isoformat(),
            'generated_at': datetime.now().isoformat(),
            'student_name': student.get_full_name() or student.username,
            'data': raw_data,
        }

    @classmethod
    def get_full_report(cls, student, start_date=None, end_date=None):
        """
        Generates a comprehensive report combining Weekly, Performed, and Conclusion data.
        """
        s_date, e_date = cls._resolve_dates(start_date, end_date)
        scheduled_data = CoreAnalyticsEngine.get_scheduled_aggregation(student, s_date, e_date)
        performed_data = CoreAnalyticsEngine.get_performed_aggregation(student, s_date, e_date)
        conclusion_data = CoreAnalyticsEngine.get_conclusion_aggregation(student, s_date, e_date)

        return {
            'report_title': str(_('گزارش جامع تحصیلی')),
            'report_type': 'full',
            'week_start': s_date.isoformat(),
            'week_end': e_date.isoformat(),
            'generated_at': datetime.now().isoformat(),
            'student_name': student.get_full_name() or student.username,
            'data': {
                'scheduled_data': scheduled_data,
                'performed_data': performed_data,
                'conclusion_data': conclusion_data,
            }
        }
