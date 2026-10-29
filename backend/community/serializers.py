from rest_framework import serializers
import jdatetime
from community.models import StudentOpinion, OpinionVote


class AuthorSummarySerializer(serializers.Serializer):
    username = serializers.CharField()
    avatar_url = serializers.CharField(allow_null=True, required=False)


class StudentOpinionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    author = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    created_at_jalali = serializers.SerializerMethodField()

    class Meta:
        model = StudentOpinion
        fields = [
            'id',
            'author',
            'is_anonymous',
            'text',
            'likes',
            'dislikes',
            'user_vote',
            'created_at_jalali',
        ]
        read_only_fields = ['id', 'author', 'likes', 'dislikes', 'user_vote', 'created_at_jalali']

    def get_author(self, obj):
        # Privacy guarantee: Anonymous opinions strictly strip author details
        if obj.is_anonymous:
            return None
        return {
            "username": obj.author.first_name if obj.author.first_name else obj.author.username,
            "avatar_url": None,
        }

    def get_user_vote(self, obj):
        # Attached dynamically in view queryset or via context
        if hasattr(obj, 'user_vote'):
            return obj.user_vote
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = OpinionVote.objects.filter(opinion=obj, user=request.user).first()
            return vote.vote_type if vote else 0
        return 0

    def get_created_at_jalali(self, obj):
        if not obj.created_at:
            return ""
        try:
            return jdatetime.datetime.fromgregorian(datetime=obj.created_at).strftime('%Y/%m/%d %H:%M:%S')
        except Exception:
            return obj.created_at.strftime('%Y/%m/%d %H:%M:%S')


class StudentOpinionCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000, required=True)
    is_anonymous = serializers.BooleanField(default=False, required=False)

    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Opinion text cannot be empty.")
        return value.strip()


class OpinionVoteInputSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=[1, -1], required=True)


class OpinionVoteResponseSerializer(serializers.Serializer):
    likes = serializers.IntegerField()
    dislikes = serializers.IntegerField()
    user_vote = serializers.IntegerField()


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.CharField()
    username = serializers.CharField()
    avatar_url = serializers.CharField(allow_null=True)
    major = serializers.CharField()
    total_study_hours = serializers.CharField()
    average_daily_hours = serializers.CharField()
    total_tests = serializers.IntegerField()
    average_daily_tests = serializers.IntegerField()


class LeaderboardResponseSerializer(serializers.Serializer):
    total_active_users = serializers.IntegerField()
    period = serializers.CharField()
    results = LeaderboardEntrySerializer(many=True)
