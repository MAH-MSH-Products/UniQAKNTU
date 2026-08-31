from rest_framework.test import APITestCase
from rest_framework import status
from .models import TagCategory, Tag

class TagsAPITests(APITestCase):
    def setUp(self):
        self.category = TagCategory.objects.create(name="Subject")
        self.tag = Tag.objects.create(category=self.category, value="Operating Systems")

    def test_list_tag_categories(self):
        url = '/api/tags/categories/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "Subject")

    def test_list_tags(self):
        url = '/api/tags/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['value'], "Operating Systems")
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import UserRole
from .models import TagCategory

User = get_user_model()

class TagAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', email='admin@test.com', password='password', role=UserRole.ADMIN)
        self.student = User.objects.create_user(username='student', email='student@test.com', password='password', role=UserRole.STUDENT)
        self.cat = TagCategory.objects.create(name='Subject')

    def test_tag_creation_permissions(self):
        url = '/api/tags/'
        data = {'category_id': self.cat.id, 'value': 'NewTag'}

        # 1. Unauthenticated
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Student (Forbidden)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin (Allowed)
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

