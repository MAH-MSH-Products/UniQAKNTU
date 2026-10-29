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
