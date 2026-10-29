from datetime import date, timedelta
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from qna.models import SourceMaterial
from planner.models import Chapter, DailyStudyLog, StudyActivity, StudyActivityType, TestRecord
from planner.services.performed_plan_service import PerformedPlanAggregationService

User = get_user_model()


class WeeklyPerformanceAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='student1',
            email='student1@test.com',
            password='password123',
            is_email_verified=True
        )
        self.other_student = User.objects.create_user(
            username='student2',
            email='student2@test.com',
            password='password123',
            is_email_verified=True
        )

        self.course = SourceMaterial.objects.create(title='گسسته')
        self.chapter1 = Chapter.objects.create(source_material=self.course, title='گراف', order=1)
        self.chapter2 = Chapter.objects.create(source_material=self.course, title='مجموعه‌ها', order=2)

        self.url = '/api/planner/weekly-performance/'

    def test_unauthenticated_access_denied(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_default_current_week_empty(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_read_time_minutes'], 0)
        self.assertEqual(response.data['total_review_time_minutes'], 0)
        self.assertEqual(response.data['total_test_count'], 0)
        self.assertEqual(response.data['chapter_records'], [])

    def test_invalid_week_start_format(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"{self.url}?week_start=2026/09/20")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_aggregated_weekly_performance(self):
        self.client.force_authenticate(user=self.student)

        # Target week: 2026-09-20 (Sunday) to 2026-09-26 (Saturday) -> 7 days
        log1 = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 20))
        StudyActivity.objects.create(
            daily_log=log1,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=60
        )
        StudyActivity.objects.create(
            daily_log=log1,
            chapter=self.chapter1,
            activity_type=StudyActivityType.REVIEW,
            duration_minutes=30
        )

        log2 = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 22))
        StudyActivity.objects.create(
            daily_log=log2,
            chapter=self.chapter2,
            activity_type=StudyActivityType.READING,
            duration_minutes=45
        )

        # Tests
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter1,
            date=date(2026, 9, 21),
            total_tests=50,
            correct_tests=40,
            wrong_tests=10
        )
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter2,
            date=date(2026, 9, 23),
            total_tests=25,
            correct_tests=20,
            wrong_tests=5
        )

        # Out-of-week records (should NOT be aggregated)
        out_log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 28))
        StudyActivity.objects.create(
            daily_log=out_log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=100
        )
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter1,
            date=date(2026, 9, 28),
            total_tests=80
        )

        response = self.client.get(f"{self.url}?week_start=2026-09-20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['week_start'], '2026-09-20')
        self.assertEqual(response.data['week_end'], '2026-09-26')
        self.assertEqual(response.data['total_read_time_minutes'], 105)  # 60 + 45
        self.assertEqual(response.data['total_review_time_minutes'], 30)
        self.assertEqual(response.data['total_test_count'], 75)          # 50 + 25

        records = response.data['chapter_records']
        self.assertEqual(len(records), 2)

        # Verify chapter 1 record
        c1_record = next(r for r in records if r['chapter_id'] == str(self.chapter1.id))
        self.assertEqual(c1_record['chapter_title'], 'گراف')
        self.assertEqual(c1_record['source_material_title'], 'گسسته')
        self.assertEqual(c1_record['read_time_minutes'], 60)
        self.assertEqual(c1_record['review_time_minutes'], 30)
        self.assertEqual(c1_record['test_count'], 50)

    def test_user_isolation(self):
        other_log = DailyStudyLog.objects.create(student=self.other_student, date=date(2026, 9, 20))
        StudyActivity.objects.create(
            daily_log=other_log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=120
        )
        TestRecord.objects.create(
            student=self.other_student,
            chapter=self.chapter1,
            date=date(2026, 9, 20),
            total_tests=100
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"{self.url}?week_start=2026-09-20")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_read_time_minutes'], 0)
        self.assertEqual(response.data['total_test_count'], 0)
        self.assertEqual(len(response.data['chapter_records']), 0)

    def test_http_mutation_methods_disallowed(self):
        """Verifies that Performed Weekly Plan endpoint is strictly read-only."""
        self.client.force_authenticate(user=self.student)

        post_res = self.client.post(self.url, {'read_time_minutes': 60})
        self.assertEqual(post_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        put_res = self.client.put(self.url, {'read_time_minutes': 60})
        self.assertEqual(put_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        patch_res = self.client.patch(self.url, {'read_time_minutes': 60})
        self.assertEqual(patch_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        delete_res = self.client.delete(self.url)
        self.assertEqual(delete_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_boundary_dates_in_aggregation(self):
        """Tests that boundary days (start_date and end_date) are included, and outside days are excluded."""
        self.client.force_authenticate(user=self.student)
        start_date = date(2026, 9, 20)
        end_date = start_date + timedelta(days=6)  # 2026-09-26

        # Activity on Day 0 (start_date) -> Included
        log_start = DailyStudyLog.objects.create(student=self.student, date=start_date)
        StudyActivity.objects.create(
            daily_log=log_start,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=20
        )

        # Activity on Day 6 (end_date) -> Included
        log_end = DailyStudyLog.objects.create(student=self.student, date=end_date)
        StudyActivity.objects.create(
            daily_log=log_end,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=30
        )

        # Activity on Day -1 -> Excluded
        log_before = DailyStudyLog.objects.create(student=self.student, date=start_date - timedelta(days=1))
        StudyActivity.objects.create(
            daily_log=log_before,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=40
        )

        # Activity on Day 7 -> Excluded
        log_after = DailyStudyLog.objects.create(student=self.student, date=end_date + timedelta(days=1))
        StudyActivity.objects.create(
            daily_log=log_after,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=50
        )

        response = self.client.get(f"{self.url}?week_start=2026-09-20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_read_time_minutes'], 50)  # 20 + 30

    def test_activity_with_null_chapter_ignored(self):
        """Activities not tied to a specific chapter should not break aggregation or appear in chapter list."""
        self.client.force_authenticate(user=self.student)
        log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 20))
        StudyActivity.objects.create(
            daily_log=log,
            chapter=None,
            activity_type=StudyActivityType.READING,
            duration_minutes=60
        )

        response = self.client.get(f"{self.url}?week_start=2026-09-20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['chapter_records']), 0)


class ModelIntegrityAndStringTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='model_student',
            email='m_student@test.com',
            password='password123'
        )
        self.course = SourceMaterial.objects.create(title='دیفرانسیل')
        self.chapter = Chapter.objects.create(source_material=self.course, title='حد و پیوستگی', order=3)

    def test_chapter_string_representation(self):
        self.assertEqual(str(self.chapter), 'دیفرانسیل - حد و پیوستگی')

    def test_daily_study_log_string_representation(self):
        log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 15))
        self.assertEqual(str(log), f'{self.student.username} - 2026-09-15')

    def test_daily_study_log_unique_together(self):
        DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 15))
        with self.assertRaises(IntegrityError):
            DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 15))

    def test_study_activity_string_representation(self):
        log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 15))
        act_with_chap = StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=45
        )
        self.assertIn('حد و پیوستگی', str(act_with_chap))
        self.assertIn('45m', str(act_with_chap))

        act_general = StudyActivity.objects.create(
            daily_log=log,
            chapter=None,
            activity_type=StudyActivityType.CLASS,
            duration_minutes=90
        )
        self.assertIn('General', str(act_general))
        self.assertIn('90m', str(act_general))

    def test_test_record_string_representation(self):
        record = TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter,
            date=date(2026, 9, 15),
            total_tests=30,
            correct_tests=25,
            wrong_tests=5
        )
        self.assertIn(self.student.username, str(record))
        self.assertIn('30 tests', str(record))


class PerformedPlanAggregationServiceDirectTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='service_student',
            email='srv_student@test.com',
            password='password123'
        )
        self.course_a = SourceMaterial.objects.create(title='الف - فیزیک')
        self.course_b = SourceMaterial.objects.create(title='ب - شیمی')

        self.chap_a1 = Chapter.objects.create(source_material=self.course_a, title='فصل 1', order=1)
        self.chap_b1 = Chapter.objects.create(source_material=self.course_b, title='فصل 1', order=1)

    def test_get_week_boundaries_with_date_and_string(self):
        # Sunday 2026-09-20 -> Week is 2026-09-19 (Saturday) to 2026-09-25 (Friday)
        w_start, w_end = PerformedPlanAggregationService.get_week_boundaries(date(2026, 9, 20))
        self.assertEqual(w_start, date(2026, 9, 19))
        self.assertEqual(w_end, date(2026, 9, 25))

        # String input
        w_start_str, w_end_str = PerformedPlanAggregationService.get_week_boundaries('2026-09-20')
        self.assertEqual(w_start_str, date(2026, 9, 19))
        self.assertEqual(w_end_str, date(2026, 9, 25))

    def test_aggregate_with_only_tests_no_reading(self):
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chap_a1,
            date=date(2026, 9, 20),
            total_tests=40,
            correct_tests=35,
            wrong_tests=5
        )

        result = PerformedPlanAggregationService.aggregate_weekly_performance(
            student=self.student,
            week_start=date(2026, 9, 20)
        )
        self.assertEqual(result['total_read_time_minutes'], 0)
        self.assertEqual(result['total_review_time_minutes'], 0)
        self.assertEqual(result['total_test_count'], 40)
        self.assertEqual(len(result['chapter_records']), 1)
        self.assertEqual(result['chapter_records'][0]['test_count'], 40)

    def test_aggregate_with_only_reading_no_tests(self):
        log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 20))
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chap_b1,
            activity_type=StudyActivityType.READING,
            duration_minutes=75
        )

        result = PerformedPlanAggregationService.aggregate_weekly_performance(
            student=self.student,
            week_start='2026-09-20'
        )
        self.assertEqual(result['total_read_time_minutes'], 75)
        self.assertEqual(result['total_test_count'], 0)
        self.assertEqual(len(result['chapter_records']), 1)
        self.assertEqual(result['chapter_records'][0]['read_time_minutes'], 75)

    def test_aggregate_alphabetical_sorting_of_multiple_chapters(self):
        # Create activities for both Course B and Course A
        log = DailyStudyLog.objects.create(student=self.student, date=date(2026, 9, 20))
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chap_b1,
            activity_type=StudyActivityType.READING,
            duration_minutes=30
        )
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chap_a1,
            activity_type=StudyActivityType.READING,
            duration_minutes=40
        )

        result = PerformedPlanAggregationService.aggregate_weekly_performance(
            student=self.student,
            week_start=date(2026, 9, 20)
        )
        records = result['chapter_records']
        self.assertEqual(len(records), 2)
        # Alphabetical: Course A ('الف - فیزیک') should appear before Course B ('ب - شیمی')
        self.assertEqual(records[0]['source_material_title'], 'الف - فیزیک')
        self.assertEqual(records[1]['source_material_title'], 'ب - شیمی')
