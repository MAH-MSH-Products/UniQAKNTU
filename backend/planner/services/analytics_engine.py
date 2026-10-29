from datetime import date, datetime
from django.db.models import Sum, Q
from planner.models import (
    DailyStudyLog,
    StudyActivity,
    StudyActivityType,
    TestRecord,
    ChapterMastery,
    Chapter,
)


class CoreAnalyticsEngine:
    """
    Centralized Read-Only Analytics & Aggregation Engine.
    Serves as the Single Source of Truth for analytical aggregations across
    both Sub-module 6 (Reports) and Sub-module 7 (Analytics).
    Guarantees DRY architecture and zero duplicate aggregations across views.
    """

    @classmethod
    def get_scheduled_aggregation(cls, student, start_date, end_date):
        """
        Aggregates scheduled/planned study time by chapter within a date range.
        Derives from StudyActivity records within the range.
        """
        activities = (
            StudyActivity.objects.filter(
                daily_log__student=student,
                daily_log__date__gte=start_date,
                daily_log__date__lte=end_date,
                chapter__isnull=False
            )
            .values('chapter__id', 'chapter__title', 'chapter__source_material__title')
            .annotate(allocated_minutes=Sum('duration_minutes'))
            .order_by('chapter__source_material__title', 'chapter__title')
        )

        total_allocated = 0
        chapters = []
        for row in activities:
            mins = row['allocated_minutes'] or 0
            total_allocated += mins
            chapters.append({
                'chapter_id': row['chapter__id'],
                'chapter_title': row['chapter__title'] or 'General',
                'source_material_title': row['chapter__source_material__title'] or 'General',
                'allocated_minutes': mins,
            })

        return {
            'total_allocated_minutes': total_allocated,
            'chapters': chapters,
        }

    @classmethod
    def get_performed_aggregation(cls, student, start_date, end_date):
        """
        Aggregates executed study activities (reading, review, class) and test records
        by chapter, along with total sleep duration within the date range.
        """
        # 1. Activities by chapter
        activities = (
            StudyActivity.objects.filter(
                daily_log__student=student,
                daily_log__date__gte=start_date,
                daily_log__date__lte=end_date,
                chapter__isnull=False
            )
            .select_related('chapter', 'chapter__source_material')
        )

        # 2. Test records by chapter
        test_records = (
            TestRecord.objects.filter(
                student=student,
                date__gte=start_date,
                date__lte=end_date,
                chapter__isnull=False
            )
            .select_related('chapter', 'chapter__source_material')
        )

        # 3. Sleep duration from daily logs
        daily_logs = DailyStudyLog.objects.filter(
            student=student,
            date__gte=start_date,
            date__lte=end_date
        )
        total_sleep = daily_logs.aggregate(total=Sum('sleep_duration_minutes'))['total'] or 0

        # Group by chapter
        chapter_map = {}

        for act in activities:
            chap = act.chapter
            if chap.id not in chapter_map:
                chapter_map[chap.id] = {
                    'chapter_id': chap.id,
                    'chapter_title': chap.title,
                    'source_material_title': chap.source_material.title if chap.source_material else 'General',
                    'read_time_minutes': 0,
                    'review_time_minutes': 0,
                    'class_time_minutes': 0,
                    'test_count': 0,
                }
            if act.activity_type == StudyActivityType.READING:
                chapter_map[chap.id]['read_time_minutes'] += act.duration_minutes
            elif act.activity_type == StudyActivityType.REVIEW:
                chapter_map[chap.id]['review_time_minutes'] += act.duration_minutes
            elif act.activity_type == StudyActivityType.CLASS:
                chapter_map[chap.id]['class_time_minutes'] += act.duration_minutes

        for test in test_records:
            chap = test.chapter
            if chap.id not in chapter_map:
                chapter_map[chap.id] = {
                    'chapter_id': chap.id,
                    'chapter_title': chap.title,
                    'source_material_title': chap.source_material.title if chap.source_material else 'General',
                    'read_time_minutes': 0,
                    'review_time_minutes': 0,
                    'class_time_minutes': 0,
                    'test_count': 0,
                }
            chapter_map[chap.id]['test_count'] += test.total_tests

        chapters = list(chapter_map.values())
        chapters.sort(key=lambda x: (x['source_material_title'], x['chapter_title']))

        total_read = sum(c['read_time_minutes'] for c in chapters)
        total_review = sum(c['review_time_minutes'] for c in chapters)
        total_class = sum(c['class_time_minutes'] for c in chapters)
        total_tests = sum(c['test_count'] for c in chapters)

        return {
            'total_read_time_minutes': total_read,
            'total_review_time_minutes': total_review,
            'total_class_time_minutes': total_class,
            'total_sleep_time_minutes': total_sleep,
            'total_tests': total_tests,
            'chapters': chapters,
        }

    @classmethod
    def get_conclusion_aggregation(cls, student, start_date=None, end_date=None):
        """
        Aggregates test performance (total, correct, wrong, untested, percentage)
        and topic mastery levels by chapter.
        """
        tests_qs = TestRecord.objects.filter(student=student, chapter__isnull=False)
        if start_date and end_date:
            tests_qs = tests_qs.filter(date__gte=start_date, date__lte=end_date)
        tests_qs = tests_qs.select_related('chapter', 'chapter__source_material')

        mastery_qs = ChapterMastery.objects.filter(student=student, chapter__isnull=False).select_related('chapter')
        mastery_map = {m.chapter_id: m.level for m in mastery_qs}

        chapter_map = {}
        for test in tests_qs:
            chap = test.chapter
            if chap.id not in chapter_map:
                chapter_map[chap.id] = {
                    'chapter_id': chap.id,
                    'chapter_title': chap.title,
                    'source_material_title': chap.source_material.title if chap.source_material else 'General',
                    'mastery_level': mastery_map.get(chap.id),
                    'total_tests': 0,
                    'correct_tests': 0,
                    'wrong_tests': 0,
                    'untested_tests': 0,
                }
            chapter_map[chap.id]['total_tests'] += test.total_tests
            chapter_map[chap.id]['correct_tests'] += test.correct_tests
            chapter_map[chap.id]['wrong_tests'] += test.wrong_tests
            chapter_map[chap.id]['untested_tests'] += test.untested_tests

        # Also include any chapters that have mastery recorded even if no tests solved in this period
        for chap_id, level in mastery_map.items():
            if chap_id not in chapter_map:
                try:
                    chap = Chapter.objects.select_related('source_material').get(id=chap_id)
                    chapter_map[chap_id] = {
                        'chapter_id': chap.id,
                        'chapter_title': chap.title,
                        'source_material_title': chap.source_material.title if chap.source_material else 'General',
                        'mastery_level': level,
                        'total_tests': 0,
                        'correct_tests': 0,
                        'wrong_tests': 0,
                        'untested_tests': 0,
                    }
                except Chapter.DoesNotExist:
                    pass

        chapters = []
        for c in chapter_map.values():
            tot = c['total_tests']
            corr = c['correct_tests']
            wrg = c['wrong_tests']
            if tot > 0:
                # Standard Konkur score formula: ((3 * correct - wrong) / (3 * total)) * 100
                percentage = round(((3 * corr - wrg) / (3 * tot)) * 100, 2)
            else:
                percentage = 0.0
            c['percentage'] = percentage
            chapters.append(c)

        chapters.sort(key=lambda x: (x['source_material_title'], x['chapter_title']))

        total_tests = sum(c['total_tests'] for c in chapters)
        total_correct = sum(c['correct_tests'] for c in chapters)
        total_wrong = sum(c['wrong_tests'] for c in chapters)
        total_untested = sum(c['untested_tests'] for c in chapters)

        overall_percentage = 0.0
        if total_tests > 0:
            overall_percentage = round(((3 * total_correct - total_wrong) / (3 * total_tests)) * 100, 2)

        mastery_values = [c['mastery_level'] for c in chapters if c['mastery_level'] is not None]
        avg_mastery = round(sum(mastery_values) / len(mastery_values), 1) if mastery_values else 0

        return {
            'average_mastery': avg_mastery,
            'overall_mastery_average': avg_mastery,
            'overall_percentage': overall_percentage,
            'total_tests': total_tests,
            'total_correct': total_correct,
            'total_wrong': total_wrong,
            'total_untested': total_untested,
            'chapters': chapters,
        }
