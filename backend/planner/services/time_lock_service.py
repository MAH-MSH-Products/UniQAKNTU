from datetime import datetime, date, timedelta
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied
import jdatetime

from planner.models import DailyStudyLog, StudyActivity


class TimeLockService:
    """
    Sub-module 5: Time-locking validation service.
    Enforces that students can only modify DailyStudyLog records falling within
    the current active week (Sunday to Saturday) and the immediately preceding week.
    Older records are strictly read-only / locked.
    """

    @classmethod
    def get_week_boundaries(cls, target_date=None):
        """
        Calculates Sunday-to-Saturday week boundaries as defined in Sub-module 5.
        """
        if target_date is None:
            target_date = date.today()
        elif isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        # In Python: Monday is 0, ..., Saturday is 5, Sunday is 6
        # Sunday is 0 days offset, Monday is 1, ..., Saturday is 6
        days_since_sunday = (target_date.weekday() + 1) % 7
        week_start = target_date - timedelta(days=days_since_sunday)
        week_end = week_start + timedelta(days=6)
        return week_start, week_end

    @classmethod
    def get_previous_week_start(cls, reference_date=None):
        """
        Returns the start date of the week immediately preceding the active week.
        """
        curr_start, _ = cls.get_week_boundaries(reference_date)
        return curr_start - timedelta(days=7)

    @classmethod
    def is_date_locked(cls, target_date, reference_date=None):
        """
        Returns True if target_date is older than the previous week's start date.
        Current week and previous week are editable (not locked).
        """
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        previous_week_start = cls.get_previous_week_start(reference_date)
        return target_date < previous_week_start

    @staticmethod
    def format_jalali_day_name(target_date):
        """
        Formats a Gregorian date to Jalali day string, e.g. "یکشنبه ۲۹ شهریور".
        """
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        persian_digits = {
            '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
            '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
        }
        jd = jdatetime.date.fromgregorian(date=target_date)
        weekday_fa = jd.j_weekdays_fa[jd.weekday()]
        month_fa = jd.j_months_fa[jd.month - 1]
        day_str = ''.join(persian_digits.get(c, c) for c in str(jd.day))
        return f"{weekday_fa} {day_str} {month_fa}"


class WeeklyHoursService:
    """
    Sub-module 5: Domain service for managing weekly study hours overview,
    retrieving daily logs, and atomically updating daily logs with activities.
    """

    @classmethod
    def get_weekly_overview(cls, student, target_date=None):
        """
        Retrieves the 7-day overview for the current week of target_date.
        Includes total study duration, lock status, and Jalali formatted date.
        """
        ref_date = target_date or date.today()
        if isinstance(ref_date, str):
            ref_date = datetime.strptime(ref_date, '%Y-%m-%d').date()

        week_start, week_end = TimeLockService.get_week_boundaries(ref_date)

        logs = (
            DailyStudyLog.objects.filter(
                student=student,
                date__gte=week_start,
                date__lte=week_end
            )
            .prefetch_related('activities')
        )
        logs_by_date = {log.date: log for log in logs}

        days = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            log = logs_by_date.get(day_date)
            total_duration = sum(act.duration_minutes for act in log.activities.all()) if log else 0
            is_finalized = log.is_finalized if log else False
            is_locked = TimeLockService.is_date_locked(day_date, reference_date=ref_date)
            day_name_jalali = TimeLockService.format_jalali_day_name(day_date)

            days.append({
                'date': day_date.isoformat(),
                'day_name_jalali': day_name_jalali,
                'is_finalized': is_finalized,
                'is_locked': is_locked,
                'total_study_duration_minutes': total_duration,
            })

        jd_start = jdatetime.date.fromgregorian(date=week_start)
        week_number = jd_start.weeknumber() or 1

        return {
            'week_number': week_number,
            'start_date': week_start.isoformat(),
            'end_date': week_end.isoformat(),
            'can_edit_previous_week': True,
            'days': days,
        }

    @classmethod
    def get_daily_log_detail(cls, student, target_date):
        """
        Retrieves detailed study activities and sleep duration for a specific date.
        If no log exists yet, returns empty defaults.
        """
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        try:
            log = (
                DailyStudyLog.objects.prefetch_related(
                    'activities',
                    'activities__chapter',
                    'activities__chapter__source_material'
                ).get(student=student, date=target_date)
            )
            activities = []
            for act in log.activities.all():
                activities.append({
                    'id': act.id,
                    'chapter_id': act.chapter_id,
                    'chapter_title': act.chapter.title if act.chapter else '',
                    'source_material_id': act.chapter.source_material_id if act.chapter and act.chapter.source_material else None,
                    'source_material_title': act.chapter.source_material.title if act.chapter and act.chapter.source_material else '',
                    'activity_type': act.activity_type,
                    'duration_minutes': act.duration_minutes,
                })

            return {
                'date': log.date.isoformat(),
                'sleep_duration_minutes': log.sleep_duration_minutes,
                'is_finalized': log.is_finalized,
                'activities': activities,
            }
        except DailyStudyLog.DoesNotExist:
            return {
                'date': target_date.isoformat(),
                'sleep_duration_minutes': 0,
                'is_finalized': False,
                'activities': [],
            }

    @classmethod
    def upsert_daily_log(cls, student, target_date, data, reference_date=None):
        """
        Atomically updates or creates DailyStudyLog and replaces its activities.
        Raises PermissionDenied if the date is locked.
        """
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

        if TimeLockService.is_date_locked(target_date, reference_date=reference_date):
            raise PermissionDenied(_("Cannot edit logs older than the previous week."))

        sleep_duration_minutes = data.get('sleep_duration_minutes', 0)
        is_finalized = data.get('is_finalized', False)
        activities_data = data.get('activities', [])

        with transaction.atomic():
            log, _ = DailyStudyLog.objects.get_or_create(
                student=student,
                date=target_date,
                defaults={
                    'sleep_duration_minutes': sleep_duration_minutes,
                    'is_finalized': is_finalized,
                }
            )
            log.sleep_duration_minutes = sleep_duration_minutes
            log.is_finalized = is_finalized
            log.save()

            # Atomically purge old activities for this day
            log.activities.all().delete()

            # Insert new activities
            new_activities = [
                StudyActivity(
                    daily_log=log,
                    chapter_id=act['chapter_id'],
                    activity_type=act['activity_type'],
                    duration_minutes=act['duration_minutes'],
                )
                for act in activities_data
            ]
            if new_activities:
                StudyActivity.objects.bulk_create(new_activities)

        return log
