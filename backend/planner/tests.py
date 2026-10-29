from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from qna.models import SourceMaterial
from planner.models import Chapter, DailyStudyLog, StudyActivity, StudyActivityType, TestRecord

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

        # Target week: 2026-09-20 (Saturday) to 2026-09-26 (Friday)
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
        # Create activities and test records for other_student
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

        # Authenticate as self.student (who has 0 records)
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"{self.url}?week_start=2026-09-20")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_read_time_minutes'], 0)
        self.assertEqual(response.data['total_test_count'], 0)
        self.assertEqual(len(response.data['chapter_records']), 0)
