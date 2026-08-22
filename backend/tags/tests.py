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
