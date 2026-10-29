from datetime import datetime, date, timedelta
from django.db.models import Sum, Q
from planner.models import StudyActivity, StudyActivityType, TestRecord, Chapter


class PerformedPlanAggregationService:
    """
    Sub-module 1: Read-Only Aggregation Service.
    Combines executed study activities (Sub-module 5) and test performance (Sub-module 2)
    without maintaining redundant persistent summary tables.
    """

    @staticmethod
    def get_week_boundaries(target_date=None):
        """
        Calculates Saturday-to-Friday week boundaries (standard Iranian academic week).
        """
        if target_date is None:
            target_date = date.today()
        elif isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        # In Python: Monday is 0, ..., Saturday is 5, Sunday is 6
        # (target_date.weekday() - 5) % 7 calculates days since previous Saturday
        days_since_saturday = (target_date.weekday() - 5) % 7
        week_start = target_date - timedelta(days=days_since_saturday)
        week_end = week_start + timedelta(days=6)
        return week_start, week_end

    @classmethod
    def aggregate_weekly_performance(cls, student, week_start=None):
        """
        Aggregates study times and test counts for a student within a specific week.
        Returns a dictionary strictly adhering to the API contract.
        """
        if week_start:
            if isinstance(week_start, str):
                start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
            else:
                start_date = week_start
            end_date = start_date + timedelta(days=6)
        else:
            start_date, end_date = cls.get_week_boundaries()

        # 1. Pull StudyActivity records within week
        activities = (
            StudyActivity.objects.filter(
                daily_log__student=student,
                daily_log__date__gte=start_date,
                daily_log__date__lte=end_date,
                chapter__isnull=False
            )
            .select_related('chapter', 'chapter__source_material')
        )

        # 2. Pull TestRecord entries within week
        test_records = (
            TestRecord.objects.filter(
                student=student,
                date__gte=start_date,
                date__lte=end_date,
                chapter__isnull=False
            )
            .select_related('chapter', 'chapter__source_material')
        )

        # 3. Aggregate per chapter
        chapter_map = {}

        for act in activities:
            chap = act.chapter
            if chap.id not in chapter_map:
                chapter_map[chap.id] = {
                    'chapter_id': str(chap.id),
                    'chapter_title': chap.title,
                    'source_material_title': chap.source_material.title,
                    'read_time_minutes': 0,
                    'review_time_minutes': 0,
                    'test_count': 0,
                }
            if act.activity_type == StudyActivityType.READING:
                chapter_map[chap.id]['read_time_minutes'] += act.duration_minutes
            elif act.activity_type == StudyActivityType.REVIEW:
                chapter_map[chap.id]['review_time_minutes'] += act.duration_minutes

        for test in test_records:
            chap = test.chapter
            if chap.id not in chapter_map:
                chapter_map[chap.id] = {
                    'chapter_id': str(chap.id),
                    'chapter_title': chap.title,
                    'source_material_title': chap.source_material.title,
                    'read_time_minutes': 0,
                    'review_time_minutes': 0,
                    'test_count': 0,
                }
            chapter_map[chap.id]['test_count'] += test.total_tests

        chapter_records = list(chapter_map.values())
        chapter_records.sort(key=lambda r: (r['source_material_title'], r['chapter_title']))

        total_read_time = sum(r['read_time_minutes'] for r in chapter_records)
        total_review_time = sum(r['review_time_minutes'] for r in chapter_records)
        total_test_count = sum(r['test_count'] for r in chapter_records)

        return {
            'week_start': start_date.isoformat(),
            'week_end': end_date.isoformat(),
            'total_read_time_minutes': total_read_time,
            'total_review_time_minutes': total_review_time,
            'total_test_count': total_test_count,
            'chapter_records': chapter_records,
        }
