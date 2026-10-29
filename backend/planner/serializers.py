from rest_framework import serializers
from curriculum.models import SourceMaterialChapter
from planner.models import TestFormat, TestMethod, TestRecord, ChapterMastery, DailyNote, ConsultationBooking


class ChapterRecordSerializer(serializers.Serializer):
    chapter_id = serializers.CharField()
    chapter_title = serializers.CharField()
    source_material_title = serializers.CharField()
    read_time_minutes = serializers.IntegerField()
    review_time_minutes = serializers.IntegerField()
    test_count = serializers.IntegerField()


class WeeklyPerformanceSerializer(serializers.Serializer):
    week_start = serializers.CharField()
    week_end = serializers.CharField()
    total_read_time_minutes = serializers.IntegerField()
    total_review_time_minutes = serializers.IntegerField()
    total_test_count = serializers.IntegerField()
    chapter_records = ChapterRecordSerializer(many=True)


# ============================================
# Sub-module 2: Conclusion Plan & Test Analytics
# ============================================

class ChapterSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    chapter_number = serializers.IntegerField(required=False)
    source_material_id = serializers.IntegerField(required=False)
    source_material_title = serializers.CharField(required=False, allow_blank=True)


class TestRecordSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    chapter_id = serializers.IntegerField(source='chapter.id', read_only=True)

    class Meta:
        model = TestRecord
        fields = [
            'id',
            'chapter_id',
            'test_format',
            'test_method',
            'total_tests',
            'correct_tests',
            'wrong_tests',
            'untested_tests',
            'percentage',
        ]
        read_only_fields = ['id', 'untested_tests', 'percentage', 'chapter_id']


class TestRecordCreateUpdateSerializer(serializers.Serializer):
    chapter_id = serializers.IntegerField(required=True)
    test_format = serializers.ChoiceField(choices=TestFormat.choices, required=True)
    test_method = serializers.ChoiceField(choices=TestMethod.choices, required=True)
    total_tests = serializers.IntegerField(min_value=0, required=True)
    correct_tests = serializers.IntegerField(min_value=0, required=True)
    wrong_tests = serializers.IntegerField(min_value=0, required=True)

    def validate_chapter_id(self, value):
        if not SourceMaterialChapter.objects.filter(id=value).exists():
            raise serializers.ValidationError("Chapter not found.")
        return value

    def validate(self, attrs):
        total = attrs.get('total_tests', 0)
        correct = attrs.get('correct_tests', 0)
        wrong = attrs.get('wrong_tests', 0)
        if correct + wrong > total:
            raise serializers.ValidationError(
                "Sum of correct tests and wrong tests cannot exceed total tests."
            )
        return attrs


class ChapterMasterySerializer(serializers.ModelSerializer):
    chapter_id = serializers.IntegerField(source='chapter.id', read_only=True)

    class Meta:
        model = ChapterMastery
        fields = ['id', 'chapter_id', 'level']


class ChapterMasteryCreateUpdateSerializer(serializers.Serializer):
    chapter_id = serializers.IntegerField(required=True)
    level = serializers.IntegerField(min_value=1, max_value=100, required=True)

    def validate_chapter_id(self, value):
        if not SourceMaterialChapter.objects.filter(id=value).exists():
            raise serializers.ValidationError("Chapter not found.")
        return value


class ConclusionGridItemSerializer(serializers.Serializer):
    chapter = ChapterSummarySerializer()
    mastery_level = serializers.IntegerField(allow_null=True)
    test_records = TestRecordSerializer(many=True)


class ConclusionPlanResponseSerializer(serializers.Serializer):
    results = ConclusionGridItemSerializer(many=True)


class SourceMaterialChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourceMaterialChapter
        fields = ['id', 'title', 'chapter_number', 'source_material_id', 'page_count']


# ============================================
# Sub-module 3: Dashboard & Student Tools
# ============================================

class CountdownSerializer(serializers.Serializer):
    target_name = serializers.CharField()
    days = serializers.IntegerField()
    hours = serializers.IntegerField()
    minutes = serializers.IntegerField()


class PersonalRecordsSerializer(serializers.Serializer):
    total_study_hours = serializers.CharField()
    max_daily_study = serializers.CharField()
    total_tests = serializers.IntegerField()
    max_daily_tests = serializers.IntegerField()


class TodayTasksSerializer(serializers.Serializer):
    has_reviews = serializers.BooleanField()
    has_studies = serializers.BooleanField()


class DashboardSummarySerializer(serializers.Serializer):
    quote = serializers.CharField()
    countdown = CountdownSerializer()
    records = PersonalRecordsSerializer()
    today_tasks = TodayTasksSerializer()


class DailyNoteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    date = serializers.DateField(read_only=True)

    class Meta:
        model = DailyNote
        fields = ['id', 'date', 'text']


class DailyNoteCreateSerializer(serializers.Serializer):
    text = serializers.CharField(allow_blank=True)


class ConsultationBookingSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ConsultationBooking
        fields = ['id', 'day_of_week', 'time_slot', 'created_at']
