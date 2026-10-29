from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status

from qna.models import SourceMaterial
from planner.models import Chapter, DailyStudyLog, StudyActivity, StudyActivityType, TestRecord, TestFormat, TestMethod
from community.models import StudentOpinion, OpinionVote, OpinionStatus
from community.services.leaderboard_service import LeaderboardService
from community.tasks import update_all_leaderboards

User = get_user_model()


class CommunityAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        self.student1 = User.objects.create_user(
            username='fatemeh',
            email='fatemeh@test.com',
            password='password123',
            role='STUDENT',
            is_email_verified=True,
        )
        self.student2 = User.objects.create_user(
            username='abutaleb',
            email='abutaleb@test.com',
            password='password123',
            role='STUDENT',
            is_email_verified=True,
        )
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='password123',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_email_verified=True,
        )

        self.url_leaderboard = '/api/community/leaderboard/'
        self.url_opinions = '/api/community/opinions/'

    def tearDown(self):
        cache.clear()

    # -------------------------------------------------------------
    # 1. Authentication
    # -------------------------------------------------------------
    def test_unauthenticated_access_denied(self):
        res = self.client.get(self.url_leaderboard)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res = self.client.get(self.url_opinions)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res = self.client.post(self.url_opinions, {'text': 'Test'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------
    # 2. Opinion Submission & Moderation Status
    # -------------------------------------------------------------
    def test_opinion_submission_default_pending(self):
        self.client.force_authenticate(user=self.student1)
        payload = {
            'text': 'تجربه من در این هفته فوق‌العاده بود...',
            'is_anonymous': False,
        }
        res = self.client.post(self.url_opinions, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], OpinionStatus.PENDING)

        opinion = StudentOpinion.objects.get(author=self.student1)
        self.assertEqual(opinion.text, payload['text'])
        self.assertEqual(opinion.status, OpinionStatus.PENDING)
        self.assertFalse(opinion.is_anonymous)

    def test_empty_opinion_rejected(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.post(self.url_opinions, {'text': '   '})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------
    # 3. Moderation Visibility Filtering
    # -------------------------------------------------------------
    def test_moderation_queue_filtering_for_students_vs_admin(self):
        op_pending = StudentOpinion.objects.create(
            author=self.student1,
            text='Pending opinion',
            status=OpinionStatus.PENDING
        )
        op_approved = StudentOpinion.objects.create(
            author=self.student2,
            text='Approved opinion',
            status=OpinionStatus.APPROVED
        )
        op_rejected = StudentOpinion.objects.create(
            author=self.student1,
            text='Rejected opinion',
            status=OpinionStatus.REJECTED
        )

        # Student should ONLY see approved opinion
        self.client.force_authenticate(user=self.student1)
        res_student = self.client.get(self.url_opinions)
        self.assertEqual(res_student.status_code, status.HTTP_200_OK)
        results = res_student.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], str(op_approved.id))

        # Admin can view all opinions
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.get(self.url_opinions)
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_admin.data['results']), 3)

    # -------------------------------------------------------------
    # 4. Anonymous vs Non-Anonymous Privacy Guarantee
    # -------------------------------------------------------------
    def test_anonymous_opinion_strips_author(self):
        op_anon = StudentOpinion.objects.create(
            author=self.student1,
            text='Anonymous confession',
            is_anonymous=True,
            status=OpinionStatus.APPROVED
        )
        op_public = StudentOpinion.objects.create(
            author=self.student2,
            text='Public opinion',
            is_anonymous=False,
            status=OpinionStatus.APPROVED
        )

        self.client.force_authenticate(user=self.student1)
        res = self.client.get(self.url_opinions)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        results_by_id = {item['id']: item for item in res.data['results']}
        
        # Anonymous opinion must strictly have author == None
        self.assertIsNone(results_by_id[str(op_anon.id)]['author'])
        self.assertTrue(results_by_id[str(op_anon.id)]['is_anonymous'])

        # Public opinion must have author details
        self.assertIsNotNone(results_by_id[str(op_public.id)]['author'])
        self.assertEqual(results_by_id[str(op_public.id)]['author']['username'], self.student2.username)

    # -------------------------------------------------------------
    # 5. Atomic Voting Lifecycle (Like, Toggle, Dislike, Switch)
    # -------------------------------------------------------------
    def test_opinion_voting_lifecycle(self):
        opinion = StudentOpinion.objects.create(
            author=self.student2,
            text='Great guidance!',
            status=OpinionStatus.APPROVED,
            likes=0,
            dislikes=0
        )
        vote_url = f"/api/community/opinions/{opinion.id}/vote/"
        self.client.force_authenticate(user=self.student1)

        # 1. Cast Like (+1)
        res1 = self.client.post(vote_url, {'value': 1})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['likes'], 1)
        self.assertEqual(res1.data['dislikes'], 0)
        self.assertEqual(res1.data['user_vote'], 1)
        self.assertEqual(OpinionVote.objects.filter(opinion=opinion, user=self.student1).count(), 1)

        # 2. Toggle Like off (sending 1 again when already liked)
        res2 = self.client.post(vote_url, {'value': 1})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['likes'], 0)
        self.assertEqual(res2.data['dislikes'], 0)
        self.assertEqual(res2.data['user_vote'], 0)
        self.assertEqual(OpinionVote.objects.filter(opinion=opinion, user=self.student1).count(), 0)

        # 3. Cast Dislike (-1)
        res3 = self.client.post(vote_url, {'value': -1})
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data['likes'], 0)
        self.assertEqual(res3.data['dislikes'], 1)
        self.assertEqual(res3.data['user_vote'], -1)

        # 4. Switch from Dislike (-1) to Like (+1)
        res4 = self.client.post(vote_url, {'value': 1})
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        self.assertEqual(res4.data['likes'], 1)
        self.assertEqual(res4.data['dislikes'], 0)
        self.assertEqual(res4.data['user_vote'], 1)

        # 5. Switch from Like (+1) to Dislike (-1)
        res5 = self.client.post(vote_url, {'value': -1})
        self.assertEqual(res5.status_code, status.HTTP_200_OK)
        self.assertEqual(res5.data['likes'], 0)
        self.assertEqual(res5.data['dislikes'], 1)
        self.assertEqual(res5.data['user_vote'], -1)

        # 6. Toggle Dislike off (sending -1 again)
        res6 = self.client.post(vote_url, {'value': -1})
        self.assertEqual(res6.status_code, status.HTTP_200_OK)
        self.assertEqual(res6.data['likes'], 0)
        self.assertEqual(res6.data['dislikes'], 0)
        self.assertEqual(res6.data['user_vote'], 0)
        self.assertEqual(OpinionVote.objects.filter(opinion=opinion, user=self.student1).count(), 0)

    def test_opinion_voting_validation(self):
        opinion = StudentOpinion.objects.create(
            author=self.student1,
            text='Valid opinion',
            status=OpinionStatus.APPROVED
        )
        self.client.force_authenticate(user=self.student1)
        vote_url = f"/api/community/opinions/{opinion.id}/vote/"

        # Invalid vote value (not 1 or -1)
        res_zero = self.client.post(vote_url, {'value': 0})
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

        res_two = self.client.post(vote_url, {'value': 2})
        self.assertEqual(res_two.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------
    # 6. Opinions Sorting
    # -------------------------------------------------------------
    def test_opinions_sorting_top_vs_recent(self):
        op1 = StudentOpinion.objects.create(
            author=self.student1,
            text='Low score but older',
            status=OpinionStatus.APPROVED,
            likes=2,
            dislikes=5
        )
        # Ensure distinct created_at timestamps even on high-speed test runners
        from django.utils import timezone
        StudentOpinion.objects.filter(id=op1.id).update(created_at=timezone.now() - timedelta(hours=1))

        op2 = StudentOpinion.objects.create(
            author=self.student2,
            text='High score recent opinion',
            status=OpinionStatus.APPROVED,
            likes=20,
            dislikes=1
        )

        self.client.force_authenticate(user=self.student1)

        # Top sort: op2 (net 19) should come first
        res_top = self.client.get(f"{self.url_opinions}?sort=top")
        self.assertEqual(res_top.status_code, status.HTTP_200_OK)
        self.assertEqual(res_top.data['results'][0]['id'], str(op2.id))

        # Recent sort: op2 was created after op1
        res_recent = self.client.get(f"{self.url_opinions}?sort=recent")
        self.assertEqual(res_recent.status_code, status.HTTP_200_OK)
        self.assertEqual(res_recent.data['results'][0]['id'], str(op2.id))

    # -------------------------------------------------------------
    # 7. Leaderboard Aggregations & Redis Caching
    # -------------------------------------------------------------
    def test_leaderboard_retrieval_and_caching(self):
        today = date.today()
        course = SourceMaterial.objects.create(title='مدار ۱')
        chapter = Chapter.objects.create(source_material=course, title='مدارهای ترتیبی', order=1)

        # Student 1 study logs: 180 mins = 03:00
        log1 = DailyStudyLog.objects.create(student=self.student1, date=today)
        StudyActivity.objects.create(
            daily_log=log1,
            chapter=chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=180
        )
        TestRecord.objects.create(
            student=self.student1,
            chapter=chapter,
            date=today,
            test_format=TestFormat.ALL,
            test_method=TestMethod.FEEDBACK,
            total_tests=60,
            correct_tests=50,
            wrong_tests=10
        )

        # Student 2 study logs: 60 mins = 01:00
        log2 = DailyStudyLog.objects.create(student=self.student2, date=today)
        StudyActivity.objects.create(
            daily_log=log2,
            chapter=chapter,
            activity_type=StudyActivityType.READING,
            duration_minutes=60
        )
        TestRecord.objects.create(
            student=self.student2,
            chapter=chapter,
            date=today,
            test_format=TestFormat.ALL,
            test_method=TestMethod.FEEDBACK,
            total_tests=20,
            correct_tests=15,
            wrong_tests=5
        )

        self.client.force_authenticate(user=self.student1)
        res = self.client.get(f"{self.url_leaderboard}?period=week")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data['period'], 'week')
        self.assertEqual(data['total_active_users'], 2)
        results = data['results']
        self.assertEqual(len(results), 2)

        # Rank 1: student1 (fatemeh with 180 mins)
        self.assertEqual(results[0]['rank'], 1)
        self.assertEqual(results[0]['user_id'], str(self.student1.id))
        self.assertEqual(results[0]['total_study_hours'], '03:00')
        self.assertEqual(results[0]['total_tests'], 60)

        # Rank 2: student2 (abutaleb with 60 mins)
        self.assertEqual(results[1]['rank'], 2)
        self.assertEqual(results[1]['user_id'], str(self.student2.id))
        self.assertEqual(results[1]['total_study_hours'], '01:00')
        self.assertEqual(results[1]['total_tests'], 20)

        # Verify cached in Redis
        cached_entry = cache.get("leaderboard:week")
        self.assertIsNotNone(cached_entry)
        self.assertEqual(cached_entry['total_active_users'], 2)

    def test_celery_task_update_all_leaderboards(self):
        # Execute the Celery task directly
        result = update_all_leaderboards()
        self.assertIn('day', result)
        self.assertIn('week', result)
        self.assertIn('month', result)
        self.assertIn('three_months', result)

        # Check all caches were populated
        for p in ['day', 'week', 'month', 'three_months']:
            self.assertIsNotNone(cache.get(f"leaderboard:{p}"))
