from collections import defaultdict
from curriculum.models import SourceMaterialChapter
from planner.models import ChapterMastery, TestRecord


class ConclusionPlanService:
    """
    Sub-module 2: Conclusion Plan & Test Analytics aggregation and business service.
    Handles upsert and retrieval logic for ChapterMastery and TestRecord.
    """

    @staticmethod
    def get_conclusion_grid(student, source_material_id=None):
        """
        Retrieves aggregated conclusion grid data for the student.
        If source_material_id is provided, includes all chapters of that source material.
        Otherwise, includes all chapters where the student has recorded mastery or tests.
        """
        if source_material_id:
            chapters = SourceMaterialChapter.objects.filter(
                source_material_id=source_material_id
            ).select_related('source_material').order_by('chapter_number', 'id')
        else:
            mastery_chapter_ids = ChapterMastery.objects.filter(
                student=student
            ).values_list('chapter_id', flat=True)
            test_chapter_ids = TestRecord.objects.filter(
                student=student
            ).values_list('chapter_id', flat=True)
            relevant_chapter_ids = set(mastery_chapter_ids).union(set(test_chapter_ids))
            chapters = SourceMaterialChapter.objects.filter(
                id__in=relevant_chapter_ids
            ).select_related('source_material').order_by('source_material__title', 'chapter_number', 'id')

        # Map mastery levels by chapter_id
        masteries = {
            m.chapter_id: m.level
            for m in ChapterMastery.objects.filter(student=student, chapter__in=chapters)
        }

        # Map test records by chapter_id
        test_records_by_chapter = defaultdict(list)
        test_records_qs = TestRecord.objects.filter(
            student=student,
            chapter__in=chapters
        ).order_by('test_format', 'test_method', 'id')

        for tr in test_records_qs:
            test_records_by_chapter[tr.chapter_id].append({
                'id': str(tr.id),
                'test_format': tr.test_format,
                'test_method': tr.test_method,
                'total_tests': tr.total_tests,
                'correct_tests': tr.correct_tests,
                'wrong_tests': tr.wrong_tests,
                'untested_tests': tr.untested_tests,
                'percentage': tr.percentage,
            })

        results = []
        for ch in chapters:
            results.append({
                'chapter': {
                    'id': ch.id,
                    'title': ch.title,
                    'chapter_number': ch.chapter_number,
                    'source_material_id': ch.source_material_id,
                    'source_material_title': ch.source_material.title if ch.source_material else '',
                },
                'mastery_level': masteries.get(ch.id, None),
                'test_records': test_records_by_chapter.get(ch.id, []),
            })

        return {'results': results}

    @staticmethod
    def upsert_test_record(student, chapter, test_format, test_method, total_tests, correct_tests, wrong_tests):
        """
        Upsert a test record for the given student, chapter, format, and method.
        Returns (test_record, created).
        """
        record, created = TestRecord.objects.get_or_create(
            student=student,
            chapter=chapter,
            test_format=test_format,
            test_method=test_method,
            defaults={
                'total_tests': total_tests,
                'correct_tests': correct_tests,
                'wrong_tests': wrong_tests,
            }
        )
        if not created:
            record.total_tests = total_tests
            record.correct_tests = correct_tests
            record.wrong_tests = wrong_tests
            record.save()
        return record, created

    @staticmethod
    def delete_test_record(student, record_id):
        """
        Deletes a test record owned by the student.
        Returns True if deleted, False if not found.
        """
        try:
            record = TestRecord.objects.get(id=record_id, student=student)
            record.delete()
            return True
        except TestRecord.DoesNotExist:
            return False

    @staticmethod
    def upsert_mastery(student, chapter, level):
        """
        Upsert mastery level for the given student and chapter.
        Returns (mastery, created).
        """
        mastery, created = ChapterMastery.objects.update_or_create(
            student=student,
            chapter=chapter,
            defaults={'level': level}
        )
        return mastery, created

    @staticmethod
    def delete_mastery(student, chapter_id):
        """
        Deletes a chapter mastery owned by the student.
        Returns True if deleted, False if not found.
        """
        try:
            mastery = ChapterMastery.objects.get(chapter_id=chapter_id, student=student)
            mastery.delete()
            return True
        except ChapterMastery.DoesNotExist:
            return False

    @staticmethod
    def get_chapters_for_source_material(source_material_id):
        """
        Retrieves chapters for a given source material.
        """
        return SourceMaterialChapter.objects.filter(
            source_material_id=source_material_id
        ).order_by('chapter_number', 'id')
