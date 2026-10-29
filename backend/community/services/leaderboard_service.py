from datetime import date, timedelta
from django.core.cache import cache
from django.db.models import Sum
from django.contrib.auth import get_user_model
from planner.models import StudyActivity, TestRecord

User = get_user_model()

VALID_PERIODS = {
    'day': 1,
    'week': 7,
    'month': 30,
    'three_months': 90,
}


class LeaderboardService:
    """
    Sub-module 4: Service for Leaderboard calculation and Redis caching.
    Performs read-only aggregations against planner models (StudyActivity, TestRecord)
    and caches precomputed rankings in Redis to ensure < 50ms response latency.
    """

    @staticmethod
    def _format_minutes(total_minutes: int) -> str:
        if not total_minutes or total_minutes <= 0:
            return "00:00"
        hours = total_minutes // 60
        mins = total_minutes % 60
        return f"{hours:02d}:{mins:02d}"

    @classmethod
    def get_cache_key(cls, period: str) -> str:
        return f"leaderboard:{period}"

    @classmethod
    def get_leaderboard(cls, period: str = 'week', fallback_if_missing: bool = True) -> dict:
        """
        Retrieves leaderboard from Redis cache.
        If cache misses and fallback_if_missing is True, calculates and caches on-the-fly.
        """
        if period not in VALID_PERIODS:
            period = 'week'

        cache_key = cls.get_cache_key(period)
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return cached_data

        if fallback_if_missing:
            return cls.calculate_and_cache_leaderboard(period)

        return {
            "total_active_users": 0,
            "period": period,
            "results": [],
        }

    @classmethod
    def calculate_and_cache_leaderboard(cls, period: str = 'week') -> dict:
        """
        Calculates rankings from planner data for the specified period,
        sorts top 10 students, and stores the result in Redis with a 1-hour TTL.
        """
        days_count = VALID_PERIODS.get(period, 7)
        start_date = date.today() - timedelta(days=days_count - 1)

        # 1. Aggregate study minutes per student
        study_qs = (
            StudyActivity.objects.filter(daily_log__date__gte=start_date)
            .values('daily_log__student_id')
            .annotate(total_minutes=Sum('duration_minutes'))
        )
        study_map = {row['daily_log__student_id']: row['total_minutes'] for row in study_qs}

        # 2. Aggregate tests per student
        test_qs = (
            TestRecord.objects.filter(date__gte=start_date)
            .values('student_id')
            .annotate(total_tests=Sum('total_tests'))
        )
        test_map = {row['student_id']: row['total_tests'] for row in test_qs}

        # Combine all active students
        all_student_ids = set(study_map.keys()) | set(test_map.keys())
        total_active_users = len(all_student_ids)

        # Sort students primarily by study minutes, then by total tests
        student_scores = []
        for sid in all_student_ids:
            minutes = study_map.get(sid, 0)
            tests = test_map.get(sid, 0)
            student_scores.append((sid, minutes, tests))

        # Sort descending
        student_scores.sort(key=lambda x: (x[1], x[2]), reverse=True)
        top_10 = student_scores[:10]

        top_student_ids = [item[0] for item in top_10]
        users_by_id = {u.id: u for u in User.objects.filter(id__in=top_student_ids)}

        results = []
        for rank_idx, (sid, minutes, tests) in enumerate(top_10, start=1):
            user = users_by_id.get(sid)
            if not user:
                continue

            username = user.first_name if user.first_name else user.username
            avg_daily_minutes = round(minutes / days_count)
            avg_daily_tests = round(tests / days_count)

            results.append({
                "rank": rank_idx,
                "user_id": str(user.id),
                "username": username,
                "avatar_url": None,
                "major": "مهندسی کامپیوتر",
                "total_study_hours": cls._format_minutes(minutes),
                "average_daily_hours": cls._format_minutes(avg_daily_minutes),
                "total_tests": tests,
                "average_daily_tests": avg_daily_tests,
            })

        payload = {
            "total_active_users": total_active_users,
            "period": period,
            "results": results,
        }

        # Cache in Redis with 1-hour expiration (3600 seconds)
        cache.set(cls.get_cache_key(period), payload, timeout=3600)
        return payload
