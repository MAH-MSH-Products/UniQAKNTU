from datetime import date, timedelta
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from qna.models import SourceMaterial
from planner.models import (
    Chapter,
    DailyStudyLog,
    StudyActivity,
    StudyActivityType,
    TestRecord,
    TestFormat,
    TestMethod,
    ChapterMastery,
    DailyNote,
    ConsultationBooking,
)
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
            test_format=TestFormat.EVEN,
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
        self.assertEqual(str(self.chapter), 'دیفرانسیل - Chapter 3: حد و پیوستگی')

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
        self.assertIn('ALL/FEEDBACK', str(record))
        self.assertIn('77.78%', str(record))


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


class ConclusionPlanAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='c_student1',
            email='c_student1@test.com',
            password='password123',
            is_email_verified=True
        )
        self.other_student = User.objects.create_user(
            username='c_student2',
            email='c_student2@test.com',
            password='password123',
            is_email_verified=True
        )

        self.course = SourceMaterial.objects.create(title='ریاضیات گسسته')
        self.chapter1 = Chapter.objects.create(
            source_material=self.course,
            title='ترکیبیات',
            chapter_number=1
        )
        self.chapter2 = Chapter.objects.create(
            source_material=self.course,
            title='نظریه گراف',
            chapter_number=2
        )

        self.url_conclusion = '/api/planner/conclusion-plan/'
        self.url_test_records = '/api/planner/conclusion-plan/test-records/'
        self.url_mastery = '/api/planner/conclusion-plan/mastery/'
        self.url_chapters = '/api/planner/conclusion-plan/chapters/'

    def test_unauthenticated_access_denied(self):
        res1 = self.client.get(self.url_conclusion)
        self.assertEqual(res1.status_code, status.HTTP_401_UNAUTHORIZED)

        res2 = self.client.post(self.url_test_records, {})
        self.assertEqual(res2.status_code, status.HTTP_401_UNAUTHORIZED)

        res3 = self.client.post(self.url_mastery, {})
        self.assertEqual(res3.status_code, status.HTTP_401_UNAUTHORIZED)

        res4 = self.client.delete(f"{self.url_test_records}1/")
        self.assertEqual(res4.status_code, status.HTTP_401_UNAUTHORIZED)

        res5 = self.client.delete(f"{self.url_mastery}1/")
        self.assertEqual(res5.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_conclusion_plan_empty_initially(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url_conclusion)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_conclusion_plan_filtered_by_source_material(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"{self.url_conclusion}?source_material_id={self.course.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['chapter']['title'], 'ترکیبیات')
        self.assertIsNone(results[0]['mastery_level'])
        self.assertEqual(results[0]['test_records'], [])

    def test_upsert_test_record_create_and_update(self):
        self.client.force_authenticate(user=self.student)

        # 1. Create test record
        payload = {
            'chapter_id': self.chapter1.id,
            'test_format': 'EVEN',
            'test_method': 'FEEDBACK',
            'total_tests': 40,
            'correct_tests': 30,
            'wrong_tests': 5,
        }
        res_create = self.client.post(self.url_test_records, payload)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.data['total_tests'], 40)
        self.assertEqual(res_create.data['correct_tests'], 30)
        self.assertEqual(res_create.data['wrong_tests'], 5)
        self.assertEqual(res_create.data['untested_tests'], 5)
        # ((30 * 3) - 5) / (40 * 3) * 100 = 85 / 120 * 100 = 70.83
        self.assertEqual(res_create.data['percentage'], 70.83)
        record_id = res_create.data['id']

        # 2. Update same test record (Upsert pattern)
        update_payload = {
            'chapter_id': self.chapter1.id,
            'test_format': 'EVEN',
            'test_method': 'FEEDBACK',
            'total_tests': 50,
            'correct_tests': 40,
            'wrong_tests': 10,
        }
        res_update = self.client.post(self.url_test_records, update_payload)
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['id'], record_id)
        self.assertEqual(res_update.data['total_tests'], 50)
        self.assertEqual(res_update.data['correct_tests'], 40)
        self.assertEqual(res_update.data['wrong_tests'], 10)
        self.assertEqual(res_update.data['untested_tests'], 0)
        # ((40 * 3) - 10) / (50 * 3) * 100 = 110 / 150 * 100 = 73.33
        self.assertEqual(res_update.data['percentage'], 73.33)

        # Confirm no duplicate was created in DB
        count = TestRecord.objects.filter(
            student=self.student,
            chapter=self.chapter1,
            test_format='EVEN',
            test_method='FEEDBACK'
        ).count()
        self.assertEqual(count, 1)

    def test_test_record_validation_invalid_counts(self):
        self.client.force_authenticate(user=self.student)
        # correct + wrong > total -> Should fail
        payload = {
            'chapter_id': self.chapter1.id,
            'test_format': 'ALL',
            'test_method': 'WASHBACK',
            'total_tests': 20,
            'correct_tests': 15,
            'wrong_tests': 10,
        }
        response = self.client.post(self.url_test_records, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_test_record(self):
        self.client.force_authenticate(user=self.student)
        record = TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter1,
            test_format=TestFormat.ODD,
            test_method=TestMethod.FEEDBACK,
            total_tests=30,
            correct_tests=25,
            wrong_tests=5
        )

        # Other student tries to delete -> 404
        self.client.force_authenticate(user=self.other_student)
        del_other = self.client.delete(f"{self.url_test_records}{record.id}/")
        self.assertEqual(del_other.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(TestRecord.objects.filter(id=record.id).exists())

        # Author deletes -> 204
        self.client.force_authenticate(user=self.student)
        del_res = self.client.delete(f"{self.url_test_records}{record.id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TestRecord.objects.filter(id=record.id).exists())

    def test_upsert_mastery_create_and_update(self):
        self.client.force_authenticate(user=self.student)

        # 1. Create mastery
        res_create = self.client.post(self.url_mastery, {
            'chapter_id': self.chapter1.id,
            'level': 85
        })
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.data['level'], 85)

        # 2. Update mastery
        res_update = self.client.post(self.url_mastery, {
            'chapter_id': self.chapter1.id,
            'level': 95
        })
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['level'], 95)

        # Confirm DB count is 1
        self.assertEqual(ChapterMastery.objects.filter(student=self.student, chapter=self.chapter1).count(), 1)

    def test_mastery_validation_range(self):
        self.client.force_authenticate(user=self.student)
        # Below 1
        res1 = self.client.post(self.url_mastery, {'chapter_id': self.chapter1.id, 'level': 0})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Above 100
        res2 = self.client.post(self.url_mastery, {'chapter_id': self.chapter1.id, 'level': 101})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_mastery(self):
        self.client.force_authenticate(user=self.student)
        ChapterMastery.objects.create(student=self.student, chapter=self.chapter1, level=80)

        # Other student tries to delete -> 404
        self.client.force_authenticate(user=self.other_student)
        del_other = self.client.delete(f"{self.url_mastery}{self.chapter1.id}/")
        self.assertEqual(del_other.status_code, status.HTTP_404_NOT_FOUND)

        # Owner deletes -> 204
        self.client.force_authenticate(user=self.student)
        del_res = self.client.delete(f"{self.url_mastery}{self.chapter1.id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ChapterMastery.objects.filter(student=self.student, chapter=self.chapter1).exists())

    def test_user_isolation_in_grid(self):
        # Create data for other student
        ChapterMastery.objects.create(student=self.other_student, chapter=self.chapter1, level=90)
        TestRecord.objects.create(
            student=self.other_student,
            chapter=self.chapter1,
            test_format=TestFormat.ALL,
            test_method=TestMethod.FEEDBACK,
            total_tests=60,
            correct_tests=50,
            wrong_tests=10
        )

        # Query as self.student
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_conclusion)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'], [])

    def test_chapters_endpoint(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"{self.url_chapters}?source_material_id={self.course.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(res.data[0]['title'], 'ترکیبیات')
        self.assertEqual(res.data[1]['title'], 'نظریه گراف')

    def test_negative_marking_percentage(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            'chapter_id': self.chapter1.id,
            'test_format': 'ODD',
            'test_method': 'WASHBACK',
            'total_tests': 6,
            'correct_tests': 0,
            'wrong_tests': 6,
        }
        res = self.client.post(self.url_test_records, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # ((0 * 3) - 6) / (6 * 3) * 100 = -6 / 18 * 100 = -33.33
        self.assertEqual(res.data['percentage'], -33.33)
        self.assertEqual(res.data['untested_tests'], 0)

    def test_zero_total_tests(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            'chapter_id': self.chapter1.id,
            'test_format': '3K',
            'test_method': 'FEEDBACK',
            'total_tests': 0,
            'correct_tests': 0,
            'wrong_tests': 0,
        }
        res = self.client.post(self.url_test_records, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['percentage'], 0.0)
        self.assertEqual(res.data['untested_tests'], 0)

    def test_invalid_chapter_id_on_create_test_record(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            'chapter_id': 999999,
            'test_format': 'ALL',
            'test_method': 'FEEDBACK',
            'total_tests': 10,
            'correct_tests': 5,
            'wrong_tests': 2,
        }
        res = self.client.post(self.url_test_records, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_chapter_id_on_create_mastery(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(self.url_mastery, {
            'chapter_id': 999999,
            'level': 80
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_source_material_id_query_param(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"{self.url_conclusion}?source_material_id=not_an_int")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chapters_endpoint_missing_source_material_id(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_chapters)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_non_existent_test_record(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.delete(f"{self.url_test_records}999999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_non_existent_mastery(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.delete(f"{self.url_mastery}999999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ============================================
# Sub-module 3: Dashboard & Student Tools Tests
# ============================================

class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='dashboard_student1',
            email='dash_student1@test.com',
            password='password123',
            is_email_verified=True
        )
        self.other_student = User.objects.create_user(
            username='dashboard_student2',
            email='dash_student2@test.com',
            password='password123',
            is_email_verified=True
        )

        self.course = SourceMaterial.objects.create(title='مدار منطقی')
        self.chapter = Chapter.objects.create(source_material=self.course, title='گیت‌های منطقی', order=1)

        self.url_summary = '/api/planner/dashboard/summary/'
        self.url_notes = '/api/planner/dashboard/notes/'
        self.url_consultations = '/api/planner/dashboard/consultations/'

    def test_unauthenticated_access_denied(self):
        # Summary
        res = self.client.get(self.url_summary)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Notes GET & POST
        res = self.client.get(self.url_notes)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        res = self.client.post(self.url_notes, {'text': 'Hello'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Consultations GET & POST
        res = self.client.get(self.url_consultations)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        res = self.client.post(self.url_consultations, {'day_of_week': 1, 'time_slot': '09:00:00'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_summary_empty(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_summary)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertIn('quote', data)
        self.assertTrue(len(data['quote']) > 0)

        countdown = data['countdown']
        self.assertEqual(countdown['target_name'], 'آزمون ارشد')
        self.assertIn('days', countdown)
        self.assertIn('hours', countdown)
        self.assertIn('minutes', countdown)

        records = data['records']
        self.assertEqual(records['total_study_hours'], '00:00')
        self.assertEqual(records['max_daily_study'], '00:00')
        self.assertEqual(records['total_tests'], 0)
        self.assertEqual(records['max_daily_tests'], 0)

        today_tasks = data['today_tasks']
        self.assertFalse(today_tasks['has_reviews'])
        self.assertFalse(today_tasks['has_studies'])

    def test_dashboard_summary_with_records_and_isolation(self):
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Student 1 activities:
        # Yesterday: 120 mins reading
        log_y = DailyStudyLog.objects.create(student=self.student, date=yesterday)
        StudyActivity.objects.create(
            daily_log=log_y,
            chapter=self.chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=120
        )

        # Today: 60 mins reading + 30 mins review = 90 mins
        log_t = DailyStudyLog.objects.create(student=self.student, date=today)
        StudyActivity.objects.create(
            daily_log=log_t,
            chapter=self.chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=60
        )
        StudyActivity.objects.create(
            daily_log=log_t,
            chapter=self.chapter,
            activity_type=StudyActivityType.REVIEW,
            duration_minutes=30
        )

        # Student 1 tests:
        # Yesterday: 40 tests
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter,
            date=yesterday,
            test_format=TestFormat.ALL,
            test_method=TestMethod.FEEDBACK,
            total_tests=40,
            correct_tests=30,
            wrong_tests=10
        )
        # Today: 70 tests
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter,
            date=today,
            test_format=TestFormat.EVEN,
            test_method=TestMethod.WASHBACK,
            total_tests=70,
            correct_tests=60,
            wrong_tests=10
        )

        # Other student records (should NOT affect student 1)
        log_other = DailyStudyLog.objects.create(student=self.other_student, date=today)
        StudyActivity.objects.create(
            daily_log=log_other,
            chapter=self.chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=500
        )
        TestRecord.objects.create(
            student=self.other_student,
            chapter=self.chapter,
            date=today,
            test_format=TestFormat.ALL,
            test_method=TestMethod.FEEDBACK,
            total_tests=300,
            correct_tests=250,
            wrong_tests=50
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_summary)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        records = data['records']
        # Total study: 120 + 90 = 210 mins -> 03:30
        self.assertEqual(records['total_study_hours'], '03:30')
        # Max daily: yesterday was 120 mins -> 02:00
        self.assertEqual(records['max_daily_study'], '02:00')
        # Total tests: 40 + 70 = 110
        self.assertEqual(records['total_tests'], 110)
        # Max daily tests: today had 70
        self.assertEqual(records['max_daily_tests'], 70)

        # Today tasks: both review and reading exist
        self.assertTrue(data['today_tasks']['has_reviews'])
        self.assertTrue(data['today_tasks']['has_studies'])

    def test_daily_note_get_empty(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_notes)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data['id'])
        self.assertEqual(res.data['date'], str(date.today()))
        self.assertEqual(res.data['text'], '')

    def test_daily_note_create_and_upsert(self):
        self.client.force_authenticate(user=self.student)

        # 1. Create note for today
        res = self.client.post(self.url_notes, {'text': 'یادداشت اول'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res.data['id'])
        self.assertEqual(res.data['text'], 'یادداشت اول')
        self.assertEqual(res.data['date'], str(date.today()))
        self.assertEqual(DailyNote.objects.filter(student=self.student).count(), 1)

        # 2. Get today's note
        res_get = self.client.get(self.url_notes)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data['text'], 'یادداشت اول')

        # 3. Upsert note on same day - should update existing row without duplicates
        res_update = self.client.post(self.url_notes, {'text': 'یادداشت ویرایش شده'})
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['text'], 'یادداشت ویرایش شده')
        self.assertEqual(DailyNote.objects.filter(student=self.student).count(), 1)

    def test_daily_note_isolation(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.url_notes, {'text': 'راز دانش‌آموز ۱'})

        # Authenticate as student 2
        self.client.force_authenticate(user=self.other_student)
        res = self.client.get(self.url_notes)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data['id'])
        self.assertEqual(res.data['text'], '')

    def test_consultation_booking_lifecycle(self):
        self.client.force_authenticate(user=self.student)

        # 1. List initially empty
        res = self.client.get(self.url_consultations)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

        # 2. Book a slot
        payload = {
            'day_of_week': 2,
            'time_slot': '10:30:00'
        }
        res_post = self.client.post(self.url_consultations, payload)
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        self.assertIn('booking', res_post.data)
        self.assertEqual(res_post.data['booking']['day_of_week'], 2)
        self.assertEqual(res_post.data['booking']['time_slot'], '10:30:00')

        # 3. List contains booking
        res_list = self.client.get(self.url_consultations)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 1)
        self.assertEqual(res_list.data[0]['day_of_week'], 2)

    def test_consultation_booking_validation(self):
        self.client.force_authenticate(user=self.student)

        # Invalid day of week (< 1 or > 7)
        res_zero = self.client.post(self.url_consultations, {'day_of_week': 0, 'time_slot': '10:00:00'})
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

        res_eight = self.client.post(self.url_consultations, {'day_of_week': 8, 'time_slot': '10:00:00'})
        self.assertEqual(res_eight.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid time slot
        res_bad_time = self.client.post(self.url_consultations, {'day_of_week': 3, 'time_slot': 'not-a-time'})
        self.assertEqual(res_bad_time.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consultation_booking_isolation(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.url_consultations, {'day_of_week': 4, 'time_slot': '14:00:00'})

        # Switch to student 2
        self.client.force_authenticate(user=self.other_student)
        res = self.client.get(self.url_consultations)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)


# ============================================
# Sub-module 5: Weekly Study Hours API Tests
# ============================================

class WeeklyStudyHoursAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='hour_student',
            email='hour_student@test.com',
            password='password123',
            is_email_verified=True
        )
        self.other_student = User.objects.create_user(
            username='hour_other_student',
            email='hour_other@test.com',
            password='password123',
            is_email_verified=True
        )

        self.course = SourceMaterial.objects.create(title='ریاضیات گسسته')
        self.chapter1 = Chapter.objects.create(source_material=self.course, title='نظریه گراف', order=1)
        self.chapter2 = Chapter.objects.create(source_material=self.course, title='ترکیبیات', order=2)

        self.url_current = '/api/planner/weekly-hours/current/'
        self.url_daily_logs = '/api/planner/weekly-hours/daily-logs/'

    def test_unauthenticated_access_denied(self):
        # 1. current overview requires auth
        res_current = self.client.get(self.url_current)
        self.assertEqual(res_current.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. daily log detail requires auth
        today_str = date.today().isoformat()
        res_detail = self.client.get(f"{self.url_daily_logs}{today_str}/")
        self.assertEqual(res_detail.status_code, status.HTTP_401_UNAUTHORIZED)

        # 3. daily log upsert requires auth
        res_put = self.client.put(f"{self.url_daily_logs}{today_str}/", {}, format='json')
        self.assertEqual(res_put.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_weekly_overview_empty_week(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_current)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.assertIn('week_number', res.data)
        self.assertIn('start_date', res.data)
        self.assertIn('end_date', res.data)
        self.assertTrue(res.data['can_edit_previous_week'])
        self.assertEqual(len(res.data['days']), 7)

        # Every day in empty week has 0 minutes, not finalized, and a valid Jalali day name
        for day in res.data['days']:
            self.assertEqual(day['total_study_duration_minutes'], 0)
            self.assertFalse(day['is_finalized'])
            self.assertIn('day_name_jalali', day)
            self.assertTrue(len(day['day_name_jalali']) > 0)

    def test_weekly_overview_with_logs_and_activities(self):
        self.client.force_authenticate(user=self.student)
        today = date.today()
        # Create log for today with reading and class activities + sleep
        log = DailyStudyLog.objects.create(
            student=self.student,
            date=today,
            sleep_duration_minutes=480,
            is_finalized=True
        )
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=90
        )
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter2,
            activity_type=StudyActivityType.CLASS,
            duration_minutes=60
        )

        res = self.client.get(self.url_current)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        today_str = today.isoformat()
        day_entry = next((d for d in res.data['days'] if d['date'] == today_str), None)
        self.assertIsNotNone(day_entry)
        self.assertTrue(day_entry['is_finalized'])
        # Study duration should sum activities only (90 + 60 = 150), sleep is not study
        self.assertEqual(day_entry['total_study_duration_minutes'], 150)

    def test_weekly_overview_custom_date_query_param(self):
        self.client.force_authenticate(user=self.student)
        # Sunday 2026-09-20 -> Week should run from 2026-09-20 to 2026-09-26
        res = self.client.get(f"{self.url_current}?date=2026-09-20")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['start_date'], '2026-09-20')
        self.assertEqual(res.data['end_date'], '2026-09-26')
        self.assertEqual(len(res.data['days']), 7)
        self.assertEqual(res.data['days'][0]['date'], '2026-09-20')
        # Check Jalali name for Sunday 29 Shahrivar
        self.assertIn('شهریور', res.data['days'][0]['day_name_jalali'])

    def test_weekly_overview_invalid_date_param(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"{self.url_current}?date=invalid-date")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_get_daily_log_nonexistent(self):
        self.client.force_authenticate(user=self.student)
        today_str = date.today().isoformat()
        res = self.client.get(f"{self.url_daily_logs}{today_str}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['date'], today_str)
        self.assertEqual(res.data['sleep_duration_minutes'], 0)
        self.assertFalse(res.data['is_finalized'])
        self.assertEqual(res.data['activities'], [])

    def test_get_daily_log_existing(self):
        self.client.force_authenticate(user=self.student)
        today = date.today()
        log = DailyStudyLog.objects.create(
            student=self.student,
            date=today,
            sleep_duration_minutes=420,
            is_finalized=True
        )
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.REVIEW,
            duration_minutes=75
        )

        res = self.client.get(f"{self.url_daily_logs}{today.isoformat()}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['sleep_duration_minutes'], 420)
        self.assertTrue(res.data['is_finalized'])
        self.assertEqual(len(res.data['activities']), 1)
        act = res.data['activities'][0]
        self.assertEqual(act['chapter_id'], self.chapter1.id)
        self.assertEqual(act['chapter_title'], 'نظریه گراف')
        self.assertEqual(act['source_material_title'], 'ریاضیات گسسته')
        self.assertEqual(act['activity_type'], 'REVIEW')
        self.assertEqual(act['duration_minutes'], 75)

    def test_upsert_daily_log_atomic_wipe_and_replace(self):
        self.client.force_authenticate(user=self.student)
        today = date.today()
        today_str = today.isoformat()

        # 1. Initial PUT with 2 activities
        payload1 = {
            'sleep_duration_minutes': 480,
            'is_finalized': False,
            'activities': [
                {
                    'chapter_id': self.chapter1.id,
                    'activity_type': 'READING',
                    'duration_minutes': 120
                },
                {
                    'chapter_id': self.chapter2.id,
                    'activity_type': 'CLASS',
                    'duration_minutes': 60
                }
            ]
        }
        res1 = self.client.put(f"{self.url_daily_logs}{today_str}/", payload1, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['message'], 'Daily log updated successfully.')

        log = DailyStudyLog.objects.get(student=self.student, date=today)
        self.assertEqual(log.sleep_duration_minutes, 480)
        self.assertFalse(log.is_finalized)
        self.assertEqual(log.activities.count(), 2)

        # 2. Second PUT with 1 activity (atomic wipe and replace: previous 2 must be purged, no orphans)
        payload2 = {
            'sleep_duration_minutes': 500,
            'is_finalized': True,
            'activities': [
                {
                    'chapter_id': self.chapter1.id,
                    'activity_type': 'REVIEW',
                    'duration_minutes': 90
                }
            ]
        }
        res2 = self.client.put(f"{self.url_daily_logs}{today_str}/", payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        log.refresh_from_db()
        self.assertEqual(log.sleep_duration_minutes, 500)
        self.assertTrue(log.is_finalized)
        self.assertEqual(log.activities.count(), 1)
        remaining_act = log.activities.first()
        self.assertEqual(remaining_act.activity_type, 'REVIEW')
        self.assertEqual(remaining_act.duration_minutes, 90)

    def test_temporal_security_lock_older_than_previous_week(self):
        self.client.force_authenticate(user=self.student)
        # Calculate a date that is strictly 3 weeks in the past
        old_date = date.today() - timedelta(days=21)
        old_date_str = old_date.isoformat()

        payload = {
            'sleep_duration_minutes': 480,
            'is_finalized': True,
            'activities': [
                {
                    'chapter_id': self.chapter1.id,
                    'activity_type': 'READING',
                    'duration_minutes': 60
                }
            ]
        }
        res = self.client.put(f"{self.url_daily_logs}{old_date_str}/", payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get('error'), 'Cannot edit logs older than the previous week.')

        # Verify no log or activities were created
        self.assertFalse(DailyStudyLog.objects.filter(student=self.student, date=old_date).exists())

    def test_temporal_security_current_and_previous_week_allowed(self):
        self.client.force_authenticate(user=self.student)
        today = date.today()
        # Today is in current week
        res_today = self.client.put(
            f"{self.url_daily_logs}{today.isoformat()}/",
            {'sleep_duration_minutes': 400, 'is_finalized': False, 'activities': []},
            format='json'
        )
        self.assertEqual(res_today.status_code, status.HTTP_200_OK)

        # 4 days ago is either in current week or previous week, definitely not older than previous week
        recent_date = today - timedelta(days=4)
        res_recent = self.client.put(
            f"{self.url_daily_logs}{recent_date.isoformat()}/",
            {'sleep_duration_minutes': 420, 'is_finalized': False, 'activities': []},
            format='json'
        )
        self.assertEqual(res_recent.status_code, status.HTTP_200_OK)

    def test_daily_log_upsert_total_duration_exceeds_24_hours(self):
        self.client.force_authenticate(user=self.student)
        today_str = date.today().isoformat()
        # 12 hours sleep (720 min) + 13 hours reading (780 min) = 1500 min > 1440 min (24 hours)
        payload = {
            'sleep_duration_minutes': 720,
            'is_finalized': False,
            'activities': [
                {
                    'chapter_id': self.chapter1.id,
                    'activity_type': 'READING',
                    'duration_minutes': 780
                }
            ]
        }
        res = self.client.put(f"{self.url_daily_logs}{today_str}/", payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', res.data)

    def test_daily_log_upsert_invalid_chapter_id(self):
        self.client.force_authenticate(user=self.student)
        today_str = date.today().isoformat()
        payload = {
            'sleep_duration_minutes': 480,
            'is_finalized': False,
            'activities': [
                {
                    'chapter_id': 999999,
                    'activity_type': 'READING',
                    'duration_minutes': 60
                }
            ]
        }
        res = self.client.put(f"{self.url_daily_logs}{today_str}/", payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('activities', res.data)

    def test_student_data_isolation(self):
        today = date.today()
        # Create log for student 1
        log1 = DailyStudyLog.objects.create(
            student=self.student,
            date=today,
            sleep_duration_minutes=480,
            is_finalized=True
        )
        StudyActivity.objects.create(
            daily_log=log1,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=120
        )

        # Authenticate as other student
        self.client.force_authenticate(user=self.other_student)

        # Other student's overview shows 0 minutes for today
        res_overview = self.client.get(self.url_current)
        today_entry = next(d for d in res_overview.data['days'] if d['date'] == today.isoformat())
        self.assertEqual(today_entry['total_study_duration_minutes'], 0)
        self.assertFalse(today_entry['is_finalized'])

        # Other student's daily log GET returns blank default
        res_detail = self.client.get(f"{self.url_daily_logs}{today.isoformat()}/")
        self.assertEqual(res_detail.data['sleep_duration_minutes'], 0)
        self.assertEqual(len(res_detail.data['activities']), 0)

        # Other student's PUT does not overwrite student 1's log
        self.client.put(
            f"{self.url_daily_logs}{today.isoformat()}/",
            {'sleep_duration_minutes': 300, 'is_finalized': False, 'activities': []},
            format='json'
        )
        log1.refresh_from_db()
        self.assertEqual(log1.sleep_duration_minutes, 480)
        self.assertTrue(log1.is_finalized)
        self.assertEqual(log1.activities.count(), 1)


# ============================================
# Sub-module 6: Student Reports Tests
# ============================================

class StudentReportsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='report_student1',
            email='rep1@test.com',
            password='password123',
            is_email_verified=True
        )
        self.other_student = User.objects.create_user(
            username='report_student2',
            email='rep2@test.com',
            password='password123',
            is_email_verified=True
        )

        self.course = SourceMaterial.objects.create(title='ریاضیات گسسته')
        self.chapter1 = Chapter.objects.create(source_material=self.course, title='نظریه گراف', order=1)
        self.chapter2 = Chapter.objects.create(source_material=self.course, title='ترکیبیات', order=2)

        self.url_weekly = '/api/planner/reports/weekly/'
        self.url_performed = '/api/planner/reports/performed/'
        self.url_conclusion = '/api/planner/reports/conclusion/'
        self.url_full = '/api/planner/reports/full/'

    def test_unauthenticated_access_denied(self):
        for url in [self.url_weekly, self.url_performed, self.url_conclusion, self.url_full]:
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_weekly_report_json(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_weekly)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('report_title', res.data)
        self.assertIn('week_start', res.data)
        self.assertIn('week_end', res.data)
        self.assertIn('generated_at', res.data)
        self.assertIn('data', res.data)
        self.assertIn('total_allocated_minutes', res.data['data'])
        self.assertIn('chapters', res.data['data'])

    def test_weekly_report_pdf_download(self):
        self.client.force_authenticate(user=self.student)
        # 1. Via query param format=pdf
        res = self.client.get(f"{self.url_weekly}?format=pdf")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertTrue(res.content.startswith(b'%PDF-'))
        self.assertGreater(len(res.content), 500)

        # 2. Via Accept header
        res_header = self.client.get(self.url_weekly, HTTP_ACCEPT='application/pdf')
        self.assertEqual(res_header.status_code, status.HTTP_200_OK)
        self.assertEqual(res_header['Content-Type'], 'application/pdf')
        self.assertTrue(res_header.content.startswith(b'%PDF-'))

    def test_performed_report_json_and_pdf(self):
        today = date.today()
        log = DailyStudyLog.objects.create(student=self.student, date=today, sleep_duration_minutes=420)
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=90
        )
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.CLASS,
            duration_minutes=60
        )
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter1,
            date=today,
            total_tests=25,
            correct_tests=20,
            wrong_tests=3
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_performed)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total_read_time_minutes'], 90)
        self.assertEqual(res.data['data']['total_class_time_minutes'], 60)
        self.assertEqual(res.data['data']['total_sleep_time_minutes'], 420)
        self.assertEqual(res.data['data']['total_tests'], 25)

        # PDF export
        res_pdf = self.client.get(f"{self.url_performed}?format=pdf")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf['Content-Type'], 'application/pdf')
        self.assertTrue(res_pdf.content.startswith(b'%PDF-'))

    def test_conclusion_report_json_and_pdf(self):
        ChapterMastery.objects.create(student=self.student, chapter=self.chapter1, level=85)
        TestRecord.objects.create(
            student=self.student,
            chapter=self.chapter1,
            date=date.today(),
            total_tests=30,
            correct_tests=24,
            wrong_tests=6
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_conclusion)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('chapters', res.data['data'])
        self.assertIn('overall_mastery_average', res.data['data'])
        self.assertEqual(res.data['data']['total_tests'], 30)

        # PDF export
        res_pdf = self.client.get(f"{self.url_conclusion}?format=pdf")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf['Content-Type'], 'application/pdf')
        self.assertTrue(res_pdf.content.startswith(b'%PDF-'))

    def test_full_report_json_and_pdf(self):
        today = date.today()
        log = DailyStudyLog.objects.create(student=self.student, date=today, sleep_duration_minutes=480)
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=120
        )
        ChapterMastery.objects.create(student=self.student, chapter=self.chapter1, level=75)

        self.client.force_authenticate(user=self.student)
        res = self.client.get(self.url_full)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('scheduled_data', res.data['data'])
        self.assertIn('performed_data', res.data['data'])
        self.assertIn('conclusion_data', res.data['data'])

        # PDF export
        res_pdf = self.client.get(f"{self.url_full}?format=pdf")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf['Content-Type'], 'application/pdf')
        self.assertTrue(res_pdf.content.startswith(b'%PDF-'))

    def test_student_isolation_in_reports(self):
        # Create activities and tests for other student
        today = date.today()
        other_log = DailyStudyLog.objects.create(student=self.other_student, date=today, sleep_duration_minutes=500)
        StudyActivity.objects.create(
            daily_log=other_log,
            chapter=self.chapter2,
            activity_type=StudyActivityType.READING,
            duration_minutes=300
        )
        TestRecord.objects.create(
            student=self.other_student,
            chapter=self.chapter2,
            date=today,
            total_tests=100,
            correct_tests=90,
            wrong_tests=10
        )

        # Query as self.student
        self.client.force_authenticate(user=self.student)
        res_perf = self.client.get(self.url_performed)
        self.assertEqual(res_perf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_perf.data['data']['total_read_time_minutes'], 0)
        self.assertEqual(res_perf.data['data']['total_tests'], 0)

        res_concl = self.client.get(self.url_conclusion)
        self.assertEqual(res_concl.status_code, status.HTTP_200_OK)
        self.assertEqual(res_concl.data['data']['total_tests'], 0)
        self.assertEqual(len(res_concl.data['data']['chapters']), 0)

    def test_date_range_filtering(self):
        self.client.force_authenticate(user=self.student)
        today = date.today()
        past_date = today - timedelta(days=20)
        log = DailyStudyLog.objects.create(student=self.student, date=past_date, sleep_duration_minutes=400)
        StudyActivity.objects.create(
            daily_log=log,
            chapter=self.chapter1,
            activity_type=StudyActivityType.READING,
            duration_minutes=150
        )

        # Query current week -> shouldn't include past_date
        res_curr = self.client.get(self.url_performed)
        self.assertEqual(res_curr.data['data']['total_read_time_minutes'], 0)

        # Query with explicit start_date and end_date matching past_date
        start = (past_date - timedelta(days=1)).isoformat()
        end = (past_date + timedelta(days=1)).isoformat()
        res_filtered = self.client.get(f"{self.url_performed}?start_date={start}&end_date={end}")
        self.assertEqual(res_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(res_filtered.data['data']['total_read_time_minutes'], 150)

