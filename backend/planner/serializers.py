from rest_framework import serializers


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
