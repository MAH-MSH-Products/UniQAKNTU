from datetime import datetime, date, timedelta
from django.core.cache import cache
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _

from qna.models import SourceMaterial
from curriculum.models import SourceMaterialChapter
from planner.models import (
    DailyStudyLog,
    StudyActivity,
    StudyActivityType,
    TestRecord,
    Chapter,
)
from planner.services.analytics_engine import CoreAnalyticsEngine


class AnalyticsDateHelper:
    """
    Helper for resolving date ranges and time-series buckets for analytics.
    """

    @staticmethod
    def parse_date(date_val):
        if not date_val:
            return None
        if isinstance(date_val, (date, datetime)):
            return date_val if isinstance(date_val, date) else date_val.date()
        try:
            return datetime.strptime(str(date_val)[:10], '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return None

    @classmethod
    def resolve_date_range(cls, start_date=None, end_date=None, interval='weekly'):
        start = cls.parse_date(start_date)
        end = cls.parse_date(end_date)
        today = date.today()

        if end is None:
            end = today

        if start is None:
            if interval == 'daily':
                start = end - timedelta(days=6)
            elif interval == 'weekly':
                # Last 6 weeks
                start = end - timedelta(weeks=6)
            elif interval == 'monthly':
                # Last 6 months (~180 days)
                start = end - timedelta(days=180)
            elif interval == '3-month':
                start = end - timedelta(days=90)
            elif interval == '6-month':
                start = end - timedelta(days=180)
            elif interval == '1-year':
                start = end - timedelta(days=365)
            elif interval == 'all':
                start = date(2020, 1, 1)
            else:
                start = end - timedelta(weeks=4)

        if start > end:
            start, end = end, start

        return start, end

    @classmethod
    def build_time_buckets(cls, start_date, end_date, interval='weekly'):
        """
        Builds discrete date buckets between start_date and end_date.
        Returns a list of dicts: [{'label': str, 'start': date, 'end': date}]
        """
        buckets = []
        curr = start_date

        if interval == 'daily':
            while curr <= end_date:
                buckets.append({
                    'label': curr.strftime('%Y-%m-%d'),
                    'start': curr,
                    'end': curr,
                })
                curr += timedelta(days=1)
        elif interval in ('weekly', '3-month', '6-month', '1-year', 'all'):
            # Weekly slices (7 days each)
            idx = 1
            while curr <= end_date:
                slice_end = min(curr + timedelta(days=6), end_date)
                buckets.append({
                    'label': f"هفته {idx}",
                    'start': curr,
                    'end': slice_end,
                })
                curr = slice_end + timedelta(days=1)
                idx += 1
        elif interval == 'monthly':
            # Monthly slices (30 days)
            idx = 1
            while curr <= end_date:
                slice_end = min(curr + timedelta(days=29), end_date)
                buckets.append({
                    'label': f"ماه {idx}",
                    'start': curr,
                    'end': slice_end,
                })
                curr = slice_end + timedelta(days=1)
                idx += 1

        return buckets


class AnalyticsCacheService:
    """
    Caching layer with atomic versioned invalidation per student.
    """
    CACHE_TIMEOUT = 3600  # 1 hour

    @classmethod
    def get_version(cls, student_id):
        key = f"analytics_ver:{student_id}"
        ver = cache.get(key)
        if ver is None:
            ver = 1
            cache.set(key, ver, timeout=86400 * 30)
        return ver

    @classmethod
    def invalidate_student_cache(cls, student_id):
        key = f"analytics_ver:{student_id}"
        try:
            cache.incr(key)
        except Exception:
            cache.set(key, 2, timeout=86400 * 30)

    @classmethod
    def make_cache_key(cls, student_id, endpoint_name, params_str):
        ver = cls.get_version(student_id)
        return f"analytics:{student_id}:v{ver}:{endpoint_name}:{params_str}"


class ActivityAggregator:
    """
    Sub-module 7: Aggregates total study activity time-series and distributions.
    Consumes CoreAnalyticsEngine and models with safe mathematical calculations.
    """

    @classmethod
    def aggregate(cls, student, start_date=None, end_date=None, interval='weekly'):
        start, end = AnalyticsDateHelper.resolve_date_range(start_date, end_date, interval)
        buckets = AnalyticsDateHelper.build_time_buckets(start, end, interval)

        # 1. Fetch activities for student in range
        activities = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date__gte=start,
            daily_log__date__lte=end
        ).values('daily_log__date', 'activity_type').annotate(total_minutes=Sum('duration_minutes'))

        # 2. Fetch test records for student in range
        tests = TestRecord.objects.filter(
            student=student,
            date__gte=start,
            date__lte=end
        ).values('date').annotate(total_tests=Sum('total_tests'))

        # Map by date
        activity_by_date = {}
        for row in activities:
            d = row['daily_log__date']
            atype = row['activity_type']
            mins = row['total_minutes'] or 0
            if d not in activity_by_date:
                activity_by_date[d] = {'READING': 0, 'REVIEW': 0, 'CLASS': 0}
            if atype in activity_by_date[d]:
                activity_by_date[d][atype] += mins

        tests_by_date = {}
        for row in tests:
            d = row['date']
            t_count = row['total_tests'] or 0
            tests_by_date[d] = tests_by_date.get(d, 0) + t_count

        labels = []
        ds_total = []
        ds_read = []
        ds_review = []
        ds_test = []
        ds_class = []

        total_read_mins = 0
        total_review_mins = 0
        total_class_mins = 0
        total_test_count = 0

        for b in buckets:
            b_start, b_end = b['start'], b['end']
            labels.append(b['label'])

            b_read = 0
            b_review = 0
            b_class = 0
            b_tests = 0

            cur = b_start
            while cur <= b_end:
                if cur in activity_by_date:
                    b_read += activity_by_date[cur].get('READING', 0)
                    b_review += activity_by_date[cur].get('REVIEW', 0)
                    b_class += activity_by_date[cur].get('CLASS', 0)
                if cur in tests_by_date:
                    b_tests += tests_by_date[cur]
                cur += timedelta(days=1)

            total_read_mins += b_read
            total_review_mins += b_review
            total_class_mins += b_class
            total_test_count += b_tests

            # Testing minutes: estimate ~2 minutes per test if test records exist, or class duration
            b_test_mins = b_tests * 2
            b_total_mins = b_read + b_review + b_class + b_test_mins

            ds_read.append(round(b_read / 60.0, 2))
            ds_review.append(round(b_review / 60.0, 2))
            ds_class.append(round(b_class / 60.0, 2))
            ds_test.append(round(b_test_mins / 60.0, 2))
            ds_total.append(round(b_total_mins / 60.0, 2))

        total_test_mins = total_test_count * 2
        total_overall_mins = total_read_mins + total_review_mins + total_class_mins + total_test_mins

        summary = {
            'total_read_minutes': total_read_mins,
            'total_review_minutes': total_review_mins,
            'total_class_minutes': total_class_mins,
            'total_test_minutes': total_test_mins,
            'total_overall_minutes': total_overall_mins,
        }

        pie_chart = {
            'read': round(total_read_mins / 60.0, 2),
            'review': round(total_review_mins / 60.0, 2),
            'test': round(total_test_mins / 60.0, 2),
            'class': round(total_class_mins / 60.0, 2),
        }

        line_chart = {
            'labels': labels,
            'datasets': {
                'total': ds_total,
                'read': ds_read,
                'review': ds_review,
                'test': ds_test,
                'class': ds_class,
            }
        }

        return {
            'summary': summary,
            'line_chart': line_chart,
            'pie_chart': pie_chart,
        }


class CourseAverageAggregator:
    """
    Sub-module 7: Aggregates averages per course/subject with division-by-zero safety.
    """

    @classmethod
    def aggregate(cls, student, metric_type='percent', start_date=None, end_date=None, interval='all'):
        start, end = AnalyticsDateHelper.resolve_date_range(start_date, end_date, interval)

        # Base query grouped by course
        courses = SourceMaterial.objects.all().order_by('title')

        labels = []
        datasets = []
        unit = 'percent'

        # Pull all activities & tests for student
        activities_qs = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date__gte=start,
            daily_log__date__lte=end,
            chapter__isnull=False
        ).values(
            'chapter__source_material__id',
            'chapter__source_material__title',
            'activity_type'
        ).annotate(total_minutes=Sum('duration_minutes'))

        tests_qs = TestRecord.objects.filter(
            student=student,
            date__gte=start,
            date__lte=end,
            chapter__isnull=False
        ).values(
            'chapter__source_material__id',
            'chapter__source_material__title'
        ).annotate(
            total_tests=Sum('total_tests'),
            correct_tests=Sum('correct_tests'),
            wrong_tests=Sum('wrong_tests')
        )

        course_data = {}
        for c in courses:
            course_data[c.id] = {
                'title': c.title,
                'read_minutes': 0,
                'review_minutes': 0,
                'total_tests': 0,
                'correct_tests': 0,
                'wrong_tests': 0,
            }

        for row in activities_qs:
            cid = row['chapter__source_material__id']
            if cid in course_data:
                atype = row['activity_type']
                mins = row['total_minutes'] or 0
                if atype == 'READING':
                    course_data[cid]['read_minutes'] += mins
                elif atype == 'REVIEW':
                    course_data[cid]['review_minutes'] += mins

        for row in tests_qs:
            cid = row['chapter__source_material__id']
            if cid in course_data:
                course_data[cid]['total_tests'] += row['total_tests'] or 0
                course_data[cid]['correct_tests'] += row['correct_tests'] or 0
                course_data[cid]['wrong_tests'] += row['wrong_tests'] or 0

        # Calculate values per metric_type
        if metric_type == 'time_per_test':
            unit = 'minutes'
            for cid, data in course_data.items():
                tot = data['total_tests']
                # Safe division
                if tot > 0:
                    val = round((data['read_minutes'] + data['review_minutes']) / tot, 2)
                else:
                    val = 0.0
                labels.append(data['title'])
                datasets.append(val)

        elif metric_type == 'time_per_read_page':
            unit = 'minutes/page'
            for cid, data in course_data.items():
                # Safe fallback if page count is not specified
                read_mins = data['read_minutes']
                val = round(read_mins / 20.0, 2) if read_mins > 0 else 0.0
                labels.append(data['title'])
                datasets.append(val)

        elif metric_type == 'time_per_review_page':
            unit = 'minutes/page'
            for cid, data in course_data.items():
                rev_mins = data['review_minutes']
                val = round(rev_mins / 20.0, 2) if rev_mins > 0 else 0.0
                labels.append(data['title'])
                datasets.append(val)

        else:  # 'percent'
            metric_type = 'percent'
            unit = 'percent'
            for cid, data in course_data.items():
                tot = data['total_tests']
                corr = data['correct_tests']
                wrg = data['wrong_tests']
                if tot > 0:
                    raw_pct = ((corr * 3) - wrg) / (tot * 3) * 100
                    val = round(max(0.0, raw_pct), 2)
                else:
                    val = 0.0
                labels.append(data['title'])
                datasets.append(val)

        return {
            'metric': metric_type,
            'unit': unit,
            'labels': labels,
            'datasets': datasets,
        }


class TimeAllocationAggregator:
    """
    Sub-module 7: Aggregates study time and test counts grouped by broader course types.
    Ensures that table_data strictly matches the bar_chart numbers.
    """

    @classmethod
    def aggregate(cls, student, start_date=None, end_date=None, interval='all'):
        start, end = AnalyticsDateHelper.resolve_date_range(start_date, end_date, interval)

        # Pull activities grouped by course
        activities = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date__gte=start,
            daily_log__date__lte=end,
            chapter__isnull=False
        ).values('chapter__source_material__id', 'chapter__source_material__title').annotate(
            total_minutes=Sum('duration_minutes')
        )

        tests = TestRecord.objects.filter(
            student=student,
            date__gte=start,
            date__lte=end,
            chapter__isnull=False
        ).values('chapter__source_material__id', 'chapter__source_material__title').annotate(
            total_tests=Sum('total_tests')
        )

        course_map = {}
        for c in SourceMaterial.objects.all():
            course_map[c.id] = {
                'course_type': c.title,
                'total_minutes': 0,
                'total_tests': 0,
            }

        for row in activities:
            cid = row['chapter__source_material__id']
            if cid in course_map:
                course_map[cid]['total_minutes'] += row['total_minutes'] or 0

        for row in tests:
            cid = row['chapter__source_material__id']
            if cid in course_map:
                course_map[cid]['total_tests'] += row['total_tests'] or 0

        labels = []
        datasets = []
        table_data = []

        total_hours_sum = 0.0
        total_tests_sum = 0

        for cid, item in course_map.items():
            hours = round(item['total_minutes'] / 60.0, 2)
            tests_count = item['total_tests']

            labels.append(item['course_type'])
            datasets.append(hours)
            table_data.append({
                'course_type': item['course_type'],
                'total_hours': hours,
                'total_tests': tests_count,
            })

            total_hours_sum += hours
            total_tests_sum += tests_count

        return {
            'bar_chart': {
                'labels': labels,
                'datasets': datasets,
            },
            'table_data': table_data,
            'totals': {
                'total_hours': round(total_hours_sum, 2),
                'total_tests': total_tests_sum,
            }
        }


class StackedActivityAggregator:
    """
    Sub-module 7: Aggregates stacked time allocation per course by activity type (Read, Review, Test, Class).
    """

    @classmethod
    def aggregate(cls, student, start_date=None, end_date=None, interval='all'):
        start, end = AnalyticsDateHelper.resolve_date_range(start_date, end_date, interval)

        courses = SourceMaterial.objects.all().order_by('title')

        activities = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date__gte=start,
            daily_log__date__lte=end,
            chapter__isnull=False
        ).values(
            'chapter__source_material__id',
            'activity_type'
        ).annotate(total_minutes=Sum('duration_minutes'))

        tests = TestRecord.objects.filter(
            student=student,
            date__gte=start,
            date__lte=end,
            chapter__isnull=False
        ).values('chapter__source_material__id').annotate(total_tests=Sum('total_tests'))

        course_map = {}
        for c in courses:
            course_map[c.id] = {
                'title': c.title,
                'read': 0,
                'review': 0,
                'class': 0,
                'test': 0,
            }

        for row in activities:
            cid = row['chapter__source_material__id']
            if cid in course_map:
                atype = row['activity_type']
                mins = row['total_minutes'] or 0
                if atype == 'READING':
                    course_map[cid]['read'] += mins
                elif atype == 'REVIEW':
                    course_map[cid]['review'] += mins
                elif atype == 'CLASS':
                    course_map[cid]['class'] += mins

        for row in tests:
            cid = row['chapter__source_material__id']
            if cid in course_map:
                course_map[cid]['test'] += (row['total_tests'] or 0) * 2

        labels = []
        read_hours = []
        review_hours = []
        class_hours = []
        test_hours = []

        for cid, item in course_map.items():
            labels.append(item['title'])
            read_hours.append(round(item['read'] / 60.0, 2))
            review_hours.append(round(item['review'] / 60.0, 2))
            class_hours.append(round(item['class'] / 60.0, 2))
            test_hours.append(round(item['test'] / 60.0, 2))

        return {
            'labels': labels,
            'datasets': {
                'read': read_hours,
                'review': review_hours,
                'test': test_hours,
                'class': class_hours,
            }
        }
