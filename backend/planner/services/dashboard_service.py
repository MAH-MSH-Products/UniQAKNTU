import datetime
from django.db.models import Sum
from django.utils import timezone
from planner.models import (
    DailyStudyLog,
    StudyActivity,
    StudyActivityType,
    TestRecord,
    DailyNote,
    ConsultationBooking,
)

MOTIVATIONAL_QUOTES = [
    "شروع کردن و تسلیم نشدن، راز اصلی موفقیت در هر مسیری است.",
    "موفقیت مجموعه‌ای از تلاش‌های کوچک است که هر روز تکرار می‌شوند.",
    "آینده متعلق به کسانی است که به زیبایی رویاهایشان باور دارند.",
    "سخت‌کوشی هرگز به هدر نمی‌رود؛ هر قدم تو را به هدف نزدیک‌تر می‌کند.",
    "هر روز یک فرصت جدید برای یادگیری، پیشرفت و بهتر شدن است.",
    "تمرکز، نظم و استمرار، پل میان رویاها و دستاوردها هستند.",
    "تفاوت بین غیرممکن و ممکن، در میزان اراده و پشتکار شماست.",
]


class DashboardSummaryService:
    """
    Sub-module 3: Aggregation Service for Student Dashboard.
    Provides aggregated statistics (hours, tests, countdown, quotes) and note/booking utilities.
    """

    @staticmethod
    def _format_minutes_to_hh_mm(total_minutes: int) -> str:
        if not total_minutes or total_minutes <= 0:
            return "00:00"
        hours = total_minutes // 60
        mins = total_minutes % 60
        return f"{hours:02d}:{mins:02d}"

    @classmethod
    def get_motivational_quote(cls, target_date=None) -> str:
        """
        Returns a motivational quote for the day deterministically based on date.
        """
        if target_date is None:
            target_date = datetime.date.today()
        day_of_year = target_date.timetuple().tm_yday
        return MOTIVATIONAL_QUOTES[day_of_year % len(MOTIVATIONAL_QUOTES)]

    @classmethod
    def get_exam_countdown(cls, target_datetime=None) -> dict:
        """
        Calculates remaining days, hours, and minutes to the target exam.
        Defaults to next Master's Entrance Exam (early March).
        """
        now = timezone.now()
        if target_datetime is None:
            # Default target: upcoming March 5th of current or next year
            current_year = now.year
            candidate_date = timezone.make_aware(
                datetime.datetime(current_year, 3, 5, 8, 0, 0)
            )
            if candidate_date <= now:
                candidate_date = timezone.make_aware(
                    datetime.datetime(current_year + 1, 3, 5, 8, 0, 0)
                )
            target_datetime = candidate_date

        delta = target_datetime - now
        if delta.total_seconds() > 0:
            days = delta.days
            hours = delta.seconds // 3600
            minutes = (delta.seconds % 3600) // 60
        else:
            days = 0
            hours = 0
            minutes = 0

        return {
            "target_name": "آزمون ارشد",
            "days": days,
            "hours": hours,
            "minutes": minutes,
        }

    @classmethod
    def get_student_records(cls, student) -> dict:
        """
        Calculates total study hours, max daily study hours, total tests, and max daily tests
        using database aggregations to avoid N+1 queries.
        """
        # 1. Total study minutes
        total_minutes = (
            StudyActivity.objects.filter(daily_log__student=student).aggregate(
                total=Sum('duration_minutes')
            )['total']
            or 0
        )
        total_study_hours = cls._format_minutes_to_hh_mm(total_minutes)

        # 2. Max daily study minutes
        max_daily_activity = (
            StudyActivity.objects.filter(daily_log__student=student)
            .values('daily_log__date')
            .annotate(day_total=Sum('duration_minutes'))
            .order_by('-day_total')
            .first()
        )
        max_daily_minutes = max_daily_activity['day_total'] if max_daily_activity else 0
        max_daily_study = cls._format_minutes_to_hh_mm(max_daily_minutes)

        # 3. Total tests
        total_tests = (
            TestRecord.objects.filter(student=student).aggregate(
                total=Sum('total_tests')
            )['total']
            or 0
        )

        # 4. Max daily tests
        max_daily_test_entry = (
            TestRecord.objects.filter(student=student)
            .values('date')
            .annotate(day_total=Sum('total_tests'))
            .order_by('-day_total')
            .first()
        )
        max_daily_tests = max_daily_test_entry['day_total'] if max_daily_test_entry else 0

        return {
            "total_study_hours": total_study_hours,
            "max_daily_study": max_daily_study,
            "total_tests": total_tests,
            "max_daily_tests": max_daily_tests,
        }

    @classmethod
    def get_today_tasks_status(cls, student, target_date=None) -> dict:
        """
        Checks if the student has logged or scheduled review or study activities today.
        """
        if target_date is None:
            target_date = datetime.date.today()

        has_reviews = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date=target_date,
            activity_type=StudyActivityType.REVIEW
        ).exists()

        has_studies = StudyActivity.objects.filter(
            daily_log__student=student,
            daily_log__date=target_date,
            activity_type=StudyActivityType.READING
        ).exists()

        return {
            "has_reviews": has_reviews,
            "has_studies": has_studies,
        }

    @classmethod
    def get_dashboard_summary(cls, student) -> dict:
        """
        Composes the complete Dashboard Summary response.
        """
        today = datetime.date.today()
        return {
            "quote": cls.get_motivational_quote(today),
            "countdown": cls.get_exam_countdown(),
            "records": cls.get_student_records(student),
            "today_tasks": cls.get_today_tasks_status(student, today),
        }

    @classmethod
    def get_daily_note(cls, student, note_date=None):
        """
        Retrieves today's note for the student or None.
        """
        if note_date is None:
            note_date = datetime.date.today()
        return DailyNote.objects.filter(student=student, date=note_date).first()

    @classmethod
    def upsert_daily_note(cls, student, text: str, note_date=None) -> DailyNote:
        """
        Upserts (updates or creates) the daily note for the student on the specified date.
        """
        if note_date is None:
            note_date = datetime.date.today()
        note, _ = DailyNote.objects.update_or_create(
            student=student,
            date=note_date,
            defaults={'text': text}
        )
        return note

    @classmethod
    def book_consultation(cls, student, day_of_week: int, time_slot) -> ConsultationBooking:
        """
        Books a consultation slot for the student.
        """
        return ConsultationBooking.objects.create(
            student=student,
            day_of_week=day_of_week,
            time_slot=time_slot
        )

    @classmethod
    def get_consultations(cls, student):
        """
        Returns all consultation bookings for the student.
        """
        return ConsultationBooking.objects.filter(student=student).order_by('-created_at')
