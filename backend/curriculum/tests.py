from django.test import TestCase
from django.core.exceptions import ValidationError
from qna.models import SourceMaterial
from .models import SourceMaterialChapter


class SourceMaterialChapterTests(TestCase):
    """Test suite for SourceMaterialChapter model."""

    def setUp(self):
        """Create test source material."""
        self.source_material = SourceMaterial.objects.create(
            title='Discrete Mathematics',
            year=2024
        )

    def test_create_chapter(self):
        """Test creating a valid chapter."""
        chapter = SourceMaterialChapter.objects.create(
            source_material=self.source_material,
            title='Graph Theory',
            chapter_number=3,
            page_count=50
        )
        self.assertEqual(chapter.title, 'Graph Theory')
        self.assertEqual(chapter.chapter_number, 3)
        self.assertEqual(str(chapter), 'Discrete Mathematics - Chapter 3: Graph Theory')

    def test_unique_constraint(self):
        """Test that (source_material, chapter_number) is unique."""
        SourceMaterialChapter.objects.create(
            source_material=self.source_material,
            title='Graph Theory',
            chapter_number=3
        )

        # Attempting to create another chapter with same number should fail
        with self.assertRaises(Exception):
            SourceMaterialChapter.objects.create(
                source_material=self.source_material,
                title='Different Title',
                chapter_number=3
            )

    def test_chapter_number_validation(self):
        """Test that chapter_number must be positive."""
        chapter = SourceMaterialChapter(
            source_material=self.source_material,
            title='Test Chapter',
            chapter_number=0
        )
        with self.assertRaises(ValidationError):
            chapter.full_clean()

    def test_title_blank_validation(self):
        """Test that title cannot be blank."""
        chapter = SourceMaterialChapter(
            source_material=self.source_material,
            title='   ',
            chapter_number=1
        )
        with self.assertRaises(ValidationError):
            chapter.clean()
