from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from curriculum.models import SourceMaterialChapter
from planner.models import (
    TestFormat,
    TestMethod,
    TestRecord,
    ChapterMastery,
    DailyNote,
    ConsultationBooking,
    StudyActivityType,
    DailyStudyLog,
    StudyActivity,
)


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


# ============================================
# Sub-module 5: Weekly Study Hours
# ============================================

class WeeklyHoursDayOverviewSerializer(serializers.Serializer):
    date = serializers.CharField()
    day_name_jalali = serializers.CharField()
    is_finalized = serializers.BooleanField()
    is_locked = serializers.BooleanField()
    total_study_duration_minutes = serializers.IntegerField()


class WeeklyHoursOverviewSerializer(serializers.Serializer):
    week_number = serializers.IntegerField()
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    can_edit_previous_week = serializers.BooleanField()
    days = WeeklyHoursDayOverviewSerializer(many=True)


class StudyActivityDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    chapter_id = serializers.IntegerField()
    chapter_title = serializers.CharField(required=False, allow_blank=True)
    source_material_id = serializers.IntegerField(required=False, allow_null=True)
    source_material_title = serializers.CharField(required=False, allow_blank=True)
    activity_type = serializers.CharField()
    duration_minutes = serializers.IntegerField()


class DailyStudyLogDetailSerializer(serializers.Serializer):
    date = serializers.CharField()
    sleep_duration_minutes = serializers.IntegerField()
    is_finalized = serializers.BooleanField()
    activities = StudyActivityDetailSerializer(many=True)


class StudyActivityItemUpsertSerializer(serializers.Serializer):
    chapter_id = serializers.IntegerField(required=True)
    activity_type = serializers.ChoiceField(choices=StudyActivityType.choices, required=True)
    duration_minutes = serializers.IntegerField(min_value=0, max_value=1440, required=True)

    def validate_chapter_id(self, value):
        if not SourceMaterialChapter.objects.filter(id=value).exists():
            raise serializers.ValidationError(_("Chapter not found."))
        return value


class DailyStudyLogUpsertSerializer(serializers.Serializer):
    sleep_duration_minutes = serializers.IntegerField(min_value=0, max_value=1440, required=False, default=0)
    is_finalized = serializers.BooleanField(required=False, default=False)
    activities = StudyActivityItemUpsertSerializer(many=True, required=False, default=list)

    def validate(self, attrs):
        sleep = attrs.get('sleep_duration_minutes', 0)
        activities = attrs.get('activities', [])
        total_activity_mins = sum(a.get('duration_minutes', 0) for a in activities)
        if sleep + total_activity_mins > 1440:
            raise serializers.ValidationError(
                _("Total study and sleep time in a day cannot exceed 24 hours (1440 minutes).")
            )
        return attrs


# ============================================
# Sub-module 6: Student Reports
# ============================================

class ReportBaseResponseSerializer(serializers.Serializer):
    report_title = serializers.CharField()
    report_type = serializers.CharField()
    week_start = serializers.CharField()
    week_end = serializers.CharField()
    generated_at = serializers.CharField()
    student_name = serializers.CharField()
    data = serializers.DictField()


# ============================================
# Sub-module 7: Student Analytics
# ============================================

class TotalActivityAnalyticsSerializer(serializers.Serializer):
    summary = serializers.DictField()
    line_chart = serializers.DictField()
    pie_chart = serializers.DictField()


class CourseAveragesAnalyticsSerializer(serializers.Serializer):
    metric = serializers.CharField()
    unit = serializers.CharField()
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.ListField(child=serializers.FloatField())


class TimeAllocationAnalyticsSerializer(serializers.Serializer):
    bar_chart = serializers.DictField()
    table_data = serializers.ListField(child=serializers.DictField())
    totals = serializers.DictField()


class StackedCourseActivityAnalyticsSerializer(serializers.Serializer):
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.DictField()

